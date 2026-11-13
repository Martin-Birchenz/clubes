const pool = require("../config/db.js");

class TenantRepository {
  async findUserByEmail(email) {
    const [rows] = await pool.query(
      `SELECT 
         u.id, u.tenant_id, u.full_name, u.email, u.password_hash, u.is_active,
         r.code AS role_code, r.permissions,
         t.slug AS tenant_slug, t.name AS tenant_name, t.subscription_status, t.is_active AS tenant_active
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE u.email = ?
       LIMIT 1`,
      [email],
    );
    return rows[0] || null;
  }

  async getPublicBootstrapBySlug(slug) {
    const [rows] = await pool.query(
      `SELECT 
         t.id, t.name, t.short_name, t.slug, t.city, t.province,
         tc.logo_url, tc.favicon_url, tc.hero_banner_url,
         tc.primary_color, tc.secondary_color, tc.accent_color,
         tc.bg_main_color, tc.surface_color, tc.text_main_color,
         tc.font_heading, tc.font_body,
         tc.instagram_url, tc.facebook_url, tc.whatsapp_secretary,
         tc.bank_alias, tc.bank_holder_name, tc.mp_public_key,
         tc.has_memberships, tc.has_canteen, tc.has_bookings,
         tc.has_store, tc.has_colonia, tc.has_qr_access, tc.has_subcommissions
       FROM tenants t
       JOIN tenant_config tc ON tc.tenant_id = t.id
       WHERE t.slug = ? AND t.is_active = 1 AND t.subscription_status != 'suspended'
       LIMIT 1`,
      [slug],
    );
    return rows[0] || null;
  }

  async getAllTenants() {
    const [rows] = await pool.query(
      `SELECT 
         t.*,
         (SELECT COUNT(*) FROM members m WHERE m.tenant_id = t.id) AS total_members
       FROM tenants t
       ORDER BY t.created_at DESC`,
    );
    return rows;
  }

  async updateSubscriptionStatus(
    tenantId,
    subscriptionStatus,
    nextBillingDate = null,
  ) {
    const [result] = await pool.query(
      `UPDATE tenants 
       SET subscription_status = ?, next_billing_date = COALESCE(?, next_billing_date)
       WHERE id = ?`,
      [subscriptionStatus, nextBillingDate, tenantId],
    );
    return result.affectedRows > 0;
  }

  async getPublicBootstrapBySlug(slug) {
    const [rows] = await pool.query(
      `SELECT 
         t.id, t.name, t.short_name, t.slug, t.city, t.province,
         tc.*
       FROM tenants t
       JOIN tenant_config tc ON tc.tenant_id = t.id
       WHERE t.slug = ? AND t.is_active = 1 AND t.subscription_status != 'suspended'
       LIMIT 1`,
      [slug],
    );
    if (!rows[0]) return null;

    const tenantId = rows[0].id;

    const [disciplines] = await pool.query(
      "SELECT id, name, slug, description, image_url, schedule_info, has_bookings, has_classes FROM disciplines WHERE tenant_id = ? AND is_active = 1 ORDER BY name ASC",
      [tenantId],
    );

    const [faqs] = await pool.query(
      "SELECT id, question, answer FROM tenant_faqs WHERE tenant_id = ? ORDER BY sort_order ASC, id ASC",
      [tenantId],
    );

    return { ...rows[0], disciplines, faqs };
  }
}

module.exports = new TenantRepository();
