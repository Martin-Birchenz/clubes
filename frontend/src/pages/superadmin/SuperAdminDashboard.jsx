import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Plus,
  ExternalLink,
  Power,
  LogOut,
  Users,
  DollarSign,
  Wrench,
} from "lucide-react";
import api from "../../config/api";
import { useAuth } from "../../context/AuthContext";

const INITIAL_FORM = {
  name: "",
  shortName: "",
  slug: "",
  city: "",
  province: "Entre Ríos",
  contactEmail: "",
  contactPhone: "",
  planTier: "pro",
  monthlyFeeArs: 40000,
  primaryColor: "#111827",
  secondaryColor: "#DC2626",
  flags: {
    hasMemberships: true,
    hasCanteen: true,
    hasBookings: true,
    hasStore: false,
    hasColonia: false,
    hasQrAccess: true,
    hasSubcommissions: true,
  },
  adminUser: {
    fullName: "",
    email: "",
    password: "",
  },
};

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [feedback, setFeedback] = useState(null);

  const fetchTenants = async () => {
    try {
      const { data } = await api.get("/superadmin/tenants");
      setTenants(data.data || []);
    } catch (err) {
      setFeedback({ type: "error", text: "Error al cargar clubes" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleNameChange = (value) => {
    const autoSlug = value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    setForm((prev) => ({ ...prev, name: value, slug: autoSlug }));
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      await api.post("/superadmin/tenants", {
        ...form,
        monthlyFeeArs: Number(form.monthlyFeeArs),
      });
      setShowModal(false);
      setForm(INITIAL_FORM);
      setFeedback({ type: "success", text: "Club dado de alta con éxito" });
      fetchTenants();
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.message || "Error al crear el club",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleTenantStatus = async (tenant) => {
    const nextStatus =
      tenant.subscription_status === "suspended" ? "active" : "suspended";
    try {
      await api.patch(`/superadmin/tenants/${tenant.id}/status`, {
        subscriptionStatus: nextStatus,
      });
      fetchTenants();
    } catch (err) {
      setFeedback({ type: "error", text: "No se pudo cambiar el estado" });
    }
  };

  const handleImpersonate = (tenant) => {
    sessionStorage.setItem("cd_impersonate_tenant_id", String(tenant.id));
    sessionStorage.setItem("cd_impersonate_tenant_name", tenant.name);
    navigate("/admin");
  };

  const activeTenants = tenants.filter(
    (t) => t.subscription_status === "active",
  );
  const totalMrr = activeTenants.reduce(
    (acc, t) => acc + Number(t.monthly_fee_ars || 0),
    0,
  );
  const totalMembers = tenants.reduce(
    (acc, t) => acc + Number(t.total_members || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Topbar */}
      <header className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">
            Consola Comercial B2B
          </span>
          <h1 className="text-xl font-bold">Core Deportivo — SuperAdmin</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300 hidden sm:inline">
            {user?.fullName}
          </span>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Salir
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* KPIs Comerciales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-100 text-emerald-700">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">
                MRR Activo
              </p>
              <p className="text-2xl font-bold">
                ${totalMrr.toLocaleString("es-AR")} ARS
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-700">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">
                Clubes Activos
              </p>
              <p className="text-2xl font-bold">
                {activeTenants.length} / {tenants.length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-100 text-amber-700">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">
                Socios Gestionados
              </p>
              <p className="text-2xl font-bold">
                {totalMembers.toLocaleString("es-AR")}
              </p>
            </div>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-3.5 rounded-lg text-sm font-medium ${
              feedback.type === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Tabla de Clubes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Clubes Licenciados</h2>
              <p className="text-xs text-slate-500">
                Administración de tenants, branding Camaleón y control de abonos
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Nuevo Club
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3">Institución</th>
                  <th className="px-5 py-3">Localidad</th>
                  <th className="px-5 py-3">Plan / Abono</th>
                  <th className="px-5 py-3">Socios</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-5 py-8 text-center text-slate-500"
                    >
                      Cargando clubes...
                    </td>
                  </tr>
                ) : tenants.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-5 py-8 text-center text-slate-500"
                    >
                      Todavía no diste de alta ningún club.
                    </td>
                  </tr>
                ) : (
                  tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {t.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          /c/{t.slug}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {t.city || "-"}, {t.province}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="uppercase text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800 mr-2">
                          {t.plan_tier}
                        </span>
                        <span className="font-medium">
                          ${Number(t.monthly_fee_ars).toLocaleString("es-AR")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium">
                        {t.total_members}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            t.subscription_status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {t.subscription_status === "active"
                            ? "Activo"
                            : "Suspendido"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <a
                          href={`/c/${t.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Ver Portal Público"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-100"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Portal
                        </a>
                        <button
                          onClick={() => handleImpersonate(t)}
                          title="Entrar como Soporte"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                        >
                          <Wrench className="h-3.5 w-3.5" /> Soporte
                        </button>
                        <button
                          onClick={() => toggleTenantStatus(t)}
                          title="Activar o suspender por abono"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 cursor-pointer"
                        >
                          <Power className="h-3.5 w-3.5" />
                          {t.subscription_status === "suspended"
                            ? "Reactivar"
                            : "Pausar"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Alta Rápida de Club */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl my-8">
            <h3 className="text-lg font-bold mb-4">
              Alta Rápida de Club (Onboarding)
            </h3>

            <form onSubmit={handleCreateTenant} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">
                    Nombre Institucional *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ej: Club Atlético Victoria"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    Nombre Corto *
                  </label>
                  <input
                    required
                    value={form.shortName}
                    onChange={(e) =>
                      setForm({ ...form, shortName: e.target.value })
                    }
                    placeholder="Ej: Atlético Victoria"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    Slug URL (/c/slug) *
                  </label>
                  <input
                    required
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Ciudad *</label>
                  <input
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Ej: Victoria"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    Email Institucional *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.contactEmail}
                    onChange={(e) =>
                      setForm({ ...form, contactEmail: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    WhatsApp Secretaría *
                  </label>
                  <input
                    required
                    value={form.contactPhone}
                    onChange={(e) =>
                      setForm({ ...form, contactPhone: e.target.value })
                    }
                    placeholder="5493436000000"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {/* Branding y Abono */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t">
                <div>
                  <label className="block font-medium mb-1">
                    Color Primario
                  </label>
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) =>
                      setForm({ ...form, primaryColor: e.target.value })
                    }
                    className="w-full h-9 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    Color Secundario
                  </label>
                  <input
                    type="color"
                    value={form.secondaryColor}
                    onChange={(e) =>
                      setForm({ ...form, secondaryColor: e.target.value })
                    }
                    className="w-full h-9 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Plan</label>
                  <select
                    value={form.planTier}
                    onChange={(e) =>
                      setForm({ ...form, planTier: e.target.value })
                    }
                    className="w-full border rounded-lg px-2 py-2"
                  >
                    <option value="base">Base</option>
                    <option value="pro">Pro</option>
                    <option value="full">Full</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    Abono ARS/mes
                  </label>
                  <input
                    type="number"
                    value={form.monthlyFeeArs}
                    onChange={(e) =>
                      setForm({ ...form, monthlyFeeArs: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {/* Usuario Admin Inicial del Club */}
              <div className="pt-2 border-t">
                <p className="font-semibold text-xs uppercase text-slate-500 mb-2">
                  Credenciales Administrador del Club
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    required
                    placeholder="Nombre del encargado"
                    value={form.adminUser.fullName}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        adminUser: {
                          ...form.adminUser,
                          fullName: e.target.value,
                        },
                      })
                    }
                    className="border rounded-lg px-3 py-2"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email login"
                    value={form.adminUser.email}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        adminUser: { ...form.adminUser, email: e.target.value },
                      })
                    }
                    className="border rounded-lg px-3 py-2"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Clave inicial (min 6)"
                    value={form.adminUser.password}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        adminUser: {
                          ...form.adminUser,
                          password: e.target.value,
                        },
                      })
                    }
                    className="border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
                >
                  {saving ? "Creando..." : "Crear Club y Generar Seed"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
