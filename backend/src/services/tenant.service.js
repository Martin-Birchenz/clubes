const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db.js");
const tenantRepository = require("../repositories/tenant.repository.js");

class TenantService {
  async login(email, password) {
    const user = await tenantRepository.findUserByEmail(email);

    if (!user || !user.is_active) {
      const err = new Error("Credenciales inválidas o usuario inactivo");
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const err = new Error("Credenciales inválidas o usuario inactivo");
      err.statusCode = 401;
      throw err;
    }

    // Si pertenece a un club, verificar que no esté suspendido
    if (
      user.tenant_id &&
      (!user.tenant_active || user.subscription_status === "suspended")
    ) {
      const err = new Error(
        "El acceso de este club está suspendido por administración",
      );
      err.statusCode = 403;
      throw err;
    }

    const permissions =
      typeof user.permissions === "string"
        ? JSON.parse(user.permissions)
        : user.permissions;

    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenant_id,
        roleCode: user.role_code,
        permissions,
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" },
    );

    await pool.query("UPDATE users SET last_login_at = NOW() WHERE id = ?", [
      user.id,
    ]);

    return {
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        roleCode: user.role_code,
        permissions,
        tenant: user.tenant_id
          ? {
              id: user.tenant_id,
              slug: user.tenant_slug,
              name: user.tenant_name,
            }
          : null,
      },
    };
  }

  async getPublicBootstrap(slug) {
    const config = await tenantRepository.getPublicBootstrapBySlug(slug);
    if (!config) {
      const err = new Error("Club no encontrado o temporalmente inactivo");
      err.statusCode = 404;
      throw err;
    }

    return {
      tenant: {
        id: config.id,
        name: config.name,
        shortName: config.short_name,
        slug: config.slug,
        city: config.city,
        province: config.province,
      },
      theme: {
        logoUrl: config.logo_url,
        faviconUrl: config.favicon_url,
        heroBannerUrl: config.hero_banner_url,
        colors: {
          "--color-primary": config.primary_color,
          "--color-secondary": config.secondary_color,
          "--color-accent": config.accent_color,
          "--color-bg-main": config.bg_main_color,
          "--color-surface": config.surface_color,
          "--color-text-main": config.text_main_color,
        },
        fonts: {
          heading: config.font_heading,
          body: config.font_body,
        },
      },
      flags: {
        hasMemberships: Boolean(config.has_memberships),
        hasCanteen: Boolean(config.has_canteen),
        hasBookings: Boolean(config.has_bookings),
        hasStore: Boolean(config.has_store),
        hasColonia: Boolean(config.has_colonia),
        hasQrAccess: Boolean(config.has_qr_access),
        hasSubcommissions: Boolean(config.has_subcommissions),
      },
      contact: {
        instagramUrl: config.instagram_url,
        facebookUrl: config.facebook_url,
        whatsappSecretary: config.whatsapp_secretary,
        bankAlias: config.bank_alias,
        bankHolderName: config.bank_holder_name,
        mpPublicKey: config.mp_public_key,
      },
      institutional: {
        themeVariant: config.theme_variant,
        heroSubtitle: config.hero_subtitle,
        foundedYear: config.founded_year,
        historyTitle: config.history_title,
        historyText: config.history_text,
        historyImageUrl: config.history_image_url,
        address: config.address,
        googleMapsEmbedUrl: config.google_maps_embed_url,
        disciplines: config.disciplines || [],
        faqs: config.faqs || [],
      },
    };
  }

  async createTenantWithSeed(payload) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Insertar Tenant
      const [tenantRes] = await conn.query(
        `INSERT INTO tenants 
          (name, short_name, slug, city, province, contact_email, contact_phone, plan_tier, subscription_status, monthly_fee_ars, next_billing_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, DATE_ADD(CURDATE(), INTERVAL 30 DAY))`,
        [
          payload.name,
          payload.shortName,
          payload.slug,
          payload.city || null,
          payload.province,
          payload.contactEmail,
          payload.contactPhone,
          payload.planTier,
          payload.monthlyFeeArs,
        ],
      );
      const tenantId = tenantRes.insertId;

      // 2. Insertar Configuración Camaleón y Feature Flags
      const flags = payload.flags || {};
      await conn.query(
        `INSERT INTO tenant_config 
          (tenant_id, logo_url, primary_color, secondary_color, whatsapp_secretary,
           has_memberships, has_canteen, has_bookings, has_store, has_colonia, has_qr_access, has_subcommissions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId,
          payload.logoUrl || null,
          payload.primaryColor,
          payload.secondaryColor,
          payload.contactPhone,
          flags.hasMemberships !== false ? 1 : 0,
          flags.hasCanteen ? 1 : 0,
          flags.hasBookings !== false ? 1 : 0,
          flags.hasStore ? 1 : 0,
          flags.hasColonia ? 1 : 0,
          flags.hasQrAccess ? 1 : 0,
          flags.hasSubcommissions ? 1 : 0,
        ],
      );

      // 3. Seed de Roles operativos del club
      const defaultRoles = [
        [
          "club_admin",
          "Administrador General",
          JSON.stringify({ modules: ["all"] }),
        ],
        [
          "secretaria",
          "Secretaría y Socios",
          JSON.stringify({ modules: ["members", "bookings", "colonia"] }),
        ],
        [
          "tesoreria",
          "Tesorería y Caja",
          JSON.stringify({ modules: ["members", "finance", "canteen"] }),
        ],
        [
          "cantina",
          "Operador de Cantina",
          JSON.stringify({ modules: ["canteen"] }),
        ],
      ];

      let clubAdminRoleId = null;
      for (const [code, name, perms] of defaultRoles) {
        const [roleRes] = await conn.query(
          "INSERT INTO roles (tenant_id, code, name, permissions, is_system_default) VALUES (?, ?, ?, ?, 1)",
          [tenantId, code, name, perms],
        );
        if (code === "club_admin") clubAdminRoleId = roleRes.insertId;
      }

      // 4. Seed del Usuario Administrador inicial
      const passwordHash = await bcrypt.hash(payload.adminUser.password, 10);
      await conn.query(
        "INSERT INTO users (tenant_id, role_id, full_name, email, password_hash) VALUES (?, ?, ?, ?, ?)",
        [
          tenantId,
          clubAdminRoleId,
          payload.adminUser.fullName,
          payload.adminUser.email,
          passwordHash,
        ],
      );

      // 5. Seed de Categorías base de Socios y Punto de Venta Cantina
      const defaultCategories = [
        ["Activo", 10000, 0],
        ["Cadete", 6000, 0],
        ["Grupo Familiar", 22000, 0],
        ["Vitalicio", 0, 1],
      ];
      for (const [catName, fee, exempt] of defaultCategories) {
        await conn.query(
          "INSERT INTO member_categories (tenant_id, name, monthly_fee, is_exempt) VALUES (?, ?, ?, ?)",
          [tenantId, catName, fee, exempt],
        );
      }

      if (flags.hasCanteen) {
        await conn.query(
          "INSERT INTO points_of_sale (tenant_id, name, pos_type) VALUES (?, 'Cantina Central', 'canteen')",
          [tenantId],
        );
      }

      await conn.commit();
      return { id: tenantId, slug: payload.slug, name: payload.name };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}

module.exports = new TenantService();
