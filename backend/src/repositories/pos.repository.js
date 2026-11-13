const pool = require("../config/db.js");

class PosRepository {
  async getPointsOfSale(tenantId) {
    const [rows] = await pool.query(
      "SELECT * FROM points_of_sale WHERE tenant_id = ? AND is_active = 1 ORDER BY id ASC",
      [tenantId],
    );
    return rows;
  }

  async getOpenRegister(tenantId, posId) {
    const [rows] = await pool.query(
      "SELECT * FROM cash_registers WHERE tenant_id = ? AND pos_id = ? AND status = 'open' LIMIT 1",
      [tenantId, posId],
    );
    return rows[0] || null;
  }

  async openRegister({ tenantId, posId, userId, openingAmount }) {
    const existing = await this.getOpenRegister(tenantId, posId);
    if (existing) {
      const err = new Error(
        "Ya existe una caja abierta en este punto de venta",
      );
      err.statusCode = 409;
      throw err;
    }

    const [res] = await pool.query(
      `INSERT INTO cash_registers (tenant_id, pos_id, opened_by_user_id, opening_amount, expected_cash, status)
       VALUES (?, ?, ?, ?, ?, 'open')`,
      [tenantId, posId, userId, openingAmount, openingAmount],
    );
    return {
      id: res.insertId,
      pos_id: posId,
      opening_amount: openingAmount,
      status: "open",
    };
  }

  async closeRegister({ tenantId, registerId, userId, declaredCash }) {
    const [res] = await pool.query(
      `UPDATE cash_registers 
       SET status = 'closed', closed_by_user_id = ?, declared_cash = ?, closed_at = NOW()
       WHERE id = ? AND tenant_id = ? AND status = 'open'`,
      [userId, declaredCash, registerId, tenantId],
    );
    if (res.affectedRows === 0) {
      const err = new Error("No se encontró una caja abierta para cerrar");
      err.statusCode = 404;
      throw err;
    }
    return true;
  }

  async getProducts(tenantId, posId) {
    const [rows] = await pool.query(
      "SELECT * FROM pos_products WHERE tenant_id = ? AND pos_id = ? AND is_active = 1 ORDER BY name ASC",
      [tenantId, posId],
    );
    return rows;
  }

  async createProduct(
    tenantId,
    { posId, name, skuOrSize, price, memberPrice, stock },
  ) {
    const [res] = await pool.query(
      `INSERT INTO pos_products (tenant_id, pos_id, name, sku_or_size, price, member_price, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        posId,
        name,
        skuOrSize || null,
        price,
        memberPrice ?? null,
        stock,
      ],
    );
    return { id: res.insertId, name, price, stock };
  }

  async recordSaleAcid({ tenantId, posId, userId, items, paymentMethod }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Verificar caja abierta
      const [regRows] = await conn.query(
        "SELECT id FROM cash_registers WHERE tenant_id = ? AND pos_id = ? AND status = 'open' FOR UPDATE",
        [tenantId, posId],
      );
      if (regRows.length === 0) {
        const err = new Error(
          "Debés abrir la caja del turno antes de registrar ventas",
        );
        err.statusCode = 400;
        throw err;
      }
      const registerId = regRows[0].id;

      // 2. Validar stock y calcular total
      let totalAmount = 0;
      const resolvedItems = [];

      for (const item of items) {
        const [prodRows] = await conn.query(
          "SELECT id, name, price, stock FROM pos_products WHERE id = ? AND tenant_id = ? AND pos_id = ? FOR UPDATE",
          [item.productId, tenantId, posId],
        );
        if (prodRows.length === 0) {
          const err = new Error(`Producto #${item.productId} no encontrado`);
          err.statusCode = 404;
          throw err;
        }
        const prod = prodRows[0];
        if (prod.stock < item.quantity) {
          const err = new Error(
            `Stock insuficiente para ${prod.name} (disponible: ${prod.stock})`,
          );
          err.statusCode = 400;
          throw err;
        }

        const subtotal = Number(prod.price) * Number(item.quantity);
        totalAmount += subtotal;
        resolvedItems.push({
          productId: prod.id,
          quantity: Number(item.quantity),
          unitPrice: Number(prod.price),
          subtotal,
        });
      }

      // 3. Insertar cabecera de venta
      const [saleRes] = await conn.query(
        `INSERT INTO pos_sales (tenant_id, pos_id, register_id, sold_by_user_id, total_amount, payment_method)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [tenantId, posId, registerId, userId, totalAmount, paymentMethod],
      );
      const saleId = saleRes.insertId;

      // 4. Insertar detalle y descontar stock
      for (const line of resolvedItems) {
        await conn.query(
          "INSERT INTO pos_sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)",
          [
            saleId,
            line.productId,
            line.quantity,
            line.unitPrice,
            line.subtotal,
          ],
        );
        await conn.query(
          "UPDATE pos_products SET stock = stock - ? WHERE id = ? AND tenant_id = ?",
          [line.quantity, line.productId, tenantId],
        );
      }

      // 5. Si cobró en efectivo, sumar al efectivo esperado de la caja
      if (paymentMethod === "efectivo") {
        await conn.query(
          "UPDATE cash_registers SET expected_cash = expected_cash + ? WHERE id = ?",
          [totalAmount, registerId],
        );
      }

      await conn.commit();
      return { saleId, totalAmount };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async recordExpenseAcid({
    tenantId,
    registerId,
    userId,
    category,
    description,
    amount,
  }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `INSERT INTO cash_expenses (tenant_id, register_id, recorded_by_user_id, category, description, amount, expense_date)
         VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
        [tenantId, registerId || null, userId, category, description, amount],
      );

      if (registerId) {
        await conn.query(
          "UPDATE cash_registers SET expected_cash = expected_cash - ? WHERE id = ? AND tenant_id = ? AND status = 'open'",
          [amount, registerId, tenantId],
        );
      }

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async getRegisterSummary(tenantId, registerId) {
    const [salesByMethod] = await pool.query(
      `SELECT payment_method, COALESCE(SUM(total_amount), 0) AS total
       FROM pos_sales
       WHERE tenant_id = ? AND register_id = ?
       GROUP BY payment_method`,
      [tenantId, registerId],
    );

    const [expensesRows] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM cash_expenses WHERE tenant_id = ? AND register_id = ?",
      [tenantId, registerId],
    );

    const grossSales = salesByMethod.reduce(
      (acc, r) => acc + Number(r.total),
      0,
    );
    const totalExpenses = Number(expensesRows[0]?.total_expenses || 0);

    return {
      grossSales,
      totalExpenses,
      netBalance: grossSales - totalExpenses,
      byMethod: salesByMethod,
    };
  }
}

module.exports = new PosRepository();
