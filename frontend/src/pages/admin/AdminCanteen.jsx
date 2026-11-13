import { useEffect, useState } from "react";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Lock,
  Unlock,
  TrendingDown,
  PackagePlus,
} from "lucide-react";
import api from "../../config/api";

export default function AdminCanteen() {
  const [posList, setPosList] = useState([]);
  const [selectedPosId, setSelectedPosId] = useState(null);
  const [register, setRegister] = useState(null);
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("efectivo");

  const [openingAmount, setOpeningAmount] = useState("0");
  const [declaredCash, setDeclaredCash] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const [newProd, setNewProd] = useState({ name: "", price: "", stock: "20" });
  const [expense, setExpense] = useState({
    category: "Insumos Cantina",
    description: "",
    amount: "",
  });

  const loadPosList = async () => {
    try {
      const { data } = await api.get("/admin/pos");
      const list = data.data || [];
      setPosList(list);
      if (list.length > 0 && !selectedPosId) {
        setSelectedPosId(list[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadStatus = async () => {
    if (!selectedPosId) return;
    try {
      const { data } = await api.get(`/admin/pos/${selectedPosId}/status`);
      setRegister(data.data.register);
      setProducts(data.data.products || []);
      setSummary(data.data.summary);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPosList();
  }, []);

  useEffect(() => {
    setCart([]);
    loadStatus();
  }, [selectedPosId]);

  const handleOpenRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/admin/pos/${selectedPosId}/open`, {
        openingAmount: Number(openingAmount),
      });
      loadStatus();
    } catch (err) {
      alert(err.response?.data?.message || "Error al abrir caja");
    }
  };

  const handleCloseRegister = async () => {
    const declared = prompt(
      `Efectivo esperado en caja: $${Number(
        register.expected_cash,
      ).toLocaleString(
        "es-AR",
      )}\nIngresá el efectivo real contado para cerrar el turno:`,
    );
    if (declared === null) return;

    try {
      await api.post(`/admin/pos/registers/${register.id}/close`, {
        declaredCash: Number(declared),
      });
      setCart([]);
      loadStatus();
    } catch (err) {
      alert(err.response?.data?.message || "Error al cerrar caja");
    }
  };

  const addToCart = (prod) => {
    if (prod.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === prod.id);
      if (existing) {
        if (existing.quantity >= prod.stock) return prev;
        return prev.map((i) =>
          i.productId === prod.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        { productId: prod.id, name: prod.name, price: prod.price, quantity: 1 },
      ];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      await api.post(`/admin/pos/${selectedPosId}/sales`, {
        items: cart.map((c) => ({
          productId: c.productId,
          quantity: c.quantity,
        })),
        paymentMethod,
      });
      setCart([]);
      loadStatus();
    } catch (err) {
      alert(err.response?.data?.message || "Error al registrar venta");
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/admin/pos/${selectedPosId}/products`, {
        name: newProd.name,
        price: Number(newProd.price),
        stock: Number(newProd.stock),
      });
      setNewProd({ name: "", price: "", stock: "20" });
      setShowProductModal(false);
      loadStatus();
    } catch (err) {
      alert("Error al agregar producto");
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/pos/expenses", {
        registerId: register?.id || null,
        ...expense,
        amount: Number(expense.amount),
      });
      setExpense({ category: "Insumos Cantina", description: "", amount: "" });
      setShowExpenseModal(false);
      loadStatus();
    } catch (err) {
      alert("Error al registrar egreso");
    }
  };

  const cartTotal = cart.reduce(
    (acc, item) => acc + Number(item.price) * item.quantity,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">TPV Cantina / Buffet y Caja</h2>
          <p className="text-sm text-slate-500">
            Punto de venta rápido con control de stock, arqueo por turno y
            egresos
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowProductModal(true)}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
          >
            <PackagePlus className="h-4 w-4" /> Nuevo Producto
          </button>
          {register && (
            <>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-amber-200 cursor-pointer"
              >
                <TrendingDown className="h-4 w-4" /> Registrar Gasto
              </button>
              <button
                onClick={handleCloseRegister}
                className="inline-flex items-center gap-1.5 bg-red-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-red-700 cursor-pointer"
              >
                <Lock className="h-4 w-4" /> Cerrar Caja
              </button>
            </>
          )}
        </div>
      </div>

      {/* Selector de Punto de Venta si el club tiene más de uno */}
      {posList.length > 1 && (
        <div className="flex gap-2">
          {posList.map((pos) => (
            <button
              key={pos.id}
              onClick={() => setSelectedPosId(pos.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${
                selectedPosId === pos.id
                  ? "bg-slate-950 text-white"
                  : "bg-white border border-slate-200"
              }`}
            >
              {pos.name}
            </button>
          ))}
        </div>
      )}

      {/* Si la caja está cerrada -> Pantalla de Apertura */}
      {!register ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md mx-auto text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center">
            <Unlock className="h-6 w-6 text-slate-700" />
          </div>
          <h3 className="text-lg font-bold">Caja Cerrada</h3>
          <p className="text-xs text-slate-500">
            Ingresá el cambio inicial en efectivo para abrir la jornada de
            ventas.
          </p>
          <form onSubmit={handleOpenRegister} className="space-y-3">
            <input
              type="number"
              min="0"
              required
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
              placeholder="Monto inicial ($)"
              className="w-full border rounded-xl px-4 py-2.5 text-center font-bold"
            />
            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Abrir Caja del Turno
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* KPIs del Turno Abierto */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Ventas Brutas</span>
                <p className="text-xl font-bold text-emerald-700">
                  ${summary.grossSales.toLocaleString("es-AR")}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Gastos / Egresos</span>
                <p className="text-xl font-bold text-red-600">
                  -${summary.totalExpenses.toLocaleString("es-AR")}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Balance Neto</span>
                <p className="text-xl font-bold">
                  ${summary.netBalance.toLocaleString("es-AR")}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">
                  Efectivo Esperado
                </span>
                <p className="text-xl font-bold text-blue-700">
                  ${Number(register.expected_cash).toLocaleString("es-AR")}
                </p>
              </div>
            </div>
          )}

          {/* Grilla de Productos + Comanda */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3 h-fit">
              {products.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  disabled={prod.stock <= 0}
                  onClick={() => addToCart(prod)}
                  className="bg-white p-4 rounded-xl border border-slate-200 text-left hover:border-slate-900 disabled:opacity-40 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <p className="font-bold text-sm leading-tight">
                      {prod.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Stock: {prod.stock}
                    </p>
                  </div>
                  <p className="text-base font-extrabold mt-3">
                    ${Number(prod.price).toLocaleString("es-AR")}
                  </p>
                </button>
              ))}
            </div>

            {/* Ticket / Comanda */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 h-fit">
              <h3 className="font-bold text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" /> Comanda Actual
              </h3>

              {cart.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Tocá los productos para sumarlos al pedido
                </p>
              ) : (
                <div className="space-y-2 text-sm divide-y">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="pt-2 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="block text-xs text-slate-500">
                          $
                          {(item.price * item.quantity).toLocaleString("es-AR")}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-3 space-y-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${cartTotal.toLocaleString("es-AR")}</span>
                </div>

                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia / QR</option>
                  <option value="debito">Tarjeta Débito</option>
                </select>

                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                >
                  Confirmar Venta
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Nuevo Producto */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 text-sm">
            <h3 className="text-lg font-bold">Agregar Producto a Cantina</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3">
              <input
                required
                placeholder="Nombre (ej: Choripán, Gatorade)"
                value={newProd.name}
                onChange={(e) =>
                  setNewProd({ ...newProd, name: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="number"
                required
                placeholder="Precio ($)"
                value={newProd.price}
                onChange={(e) =>
                  setNewProd({ ...newProd, price: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="number"
                required
                placeholder="Stock inicial"
                value={newProd.stock}
                onChange={(e) =>
                  setNewProd({ ...newProd, stock: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 border rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Egreso / Caja Chica */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 text-sm">
            <h3 className="text-lg font-bold">Registrar Gasto / Egreso</h3>
            <form onSubmit={handleCreateExpense} className="space-y-3">
              <select
                value={expense.category}
                onChange={(e) =>
                  setExpense({ ...expense, category: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="Insumos Cantina">
                  Insumos Cantina / Pan / Bebidas
                </option>
                <option value="Arbitraje">Pago Árbitros / Planilleros</option>
                <option value="Mantenimiento">Mantenimiento / Limpieza</option>
              </select>
              <input
                required
                placeholder="Detalle (ej: 5 bolsas de hielo)"
                value={expense.description}
                onChange={(e) =>
                  setExpense({ ...expense, description: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="number"
                required
                placeholder="Monto ($)"
                value={expense.amount}
                onChange={(e) =>
                  setExpense({ ...expense, amount: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 border rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Registrar Egreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
