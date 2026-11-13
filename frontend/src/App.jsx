import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useTenant } from "./context/TenantContext";

// Layouts
import PublicClubLayout from "./layouts/PublicClubLayout";
import AdminLayout from "./layouts/AdminLayout";

// Páginas Públicas (Modo Camaleón)
import MemberPortal from "./pages/public/MemberPortal";

// Páginas Admin & SuperAdmin
import Login from "./pages/admin/Login";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminCanteen from "./pages/admin/AdminCanteen";
import AdminAccessControl from "./pages/admin/AdminAccessControl";

function PublicClubHome() {
  const { tenant, theme, flags } = useTenant();

  return (
    <div className="space-y-8">
      <section className="bg-primary text-white rounded-3xl p-8 md:p-12 shadow-lg">
        <div className="max-w-2xl space-y-4">
          {theme?.logoUrl && (
            <img
              src={theme.logoUrl}
              alt={tenant.name}
              className="h-16 w-16 rounded-2xl bg-white p-1.5 object-contain"
            />
          )}
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {tenant.name}
          </h1>
          <p className="text-white/80 text-base">
            Portal oficial de socios, autogestión de cuotas y reserva de
            instalaciones
            {tenant.city ? ` • ${tenant.city}, ${tenant.province}` : ""}.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            {flags.hasMemberships && (
              <Link
                to={`/c/${tenant.slug}/mi-carnet`}
                className="bg-secondary text-white px-5 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition"
              >
                Consultar Cuota y Carnet QR
              </Link>
            )}
            {flags.hasBookings && (
              <Link
                to={`/c/${tenant.slug}/turnos`}
                className="bg-white text-primary px-5 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition"
              >
                Ver Canchas y Turnos
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function RequireSuperAdmin({ children }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.roleCode !== "superadmin") return <Navigate to="/admin" replace />;
  return children;
}

function RequireStaff({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Portal Público Multi-Tenant (Modo Camaleón) */}
          <Route path="/c/:slug" element={<PublicClubLayout />}>
            <Route index element={<PublicClubHome />} />
            <Route path="mi-carnet" element={<MemberPortal />} />
            <Route
              path="turnos"
              element={
                <div className="bg-surface p-6 rounded-2xl border border-gray-200">
                  <h2 className="text-xl font-bold mb-2">Turnero Público</h2>
                  <p className="text-sm text-gray-600">
                    Consultá disponibilidad o comunicate con la secretaría del
                    club para reservar tu horario.
                  </p>
                </div>
              }
            />
          </Route>

          {/* Login Unificado */}
          <Route path="/login" element={<Login />} />

          {/* Consola Comercial SuperAdmin */}
          <Route
            path="/superadmin"
            element={
              <RequireSuperAdmin>
                <SuperAdminDashboard />
              </RequireSuperAdmin>
            }
          />

          {/* Panel Operativo del Club */}
          <Route
            path="/admin"
            element={
              <RequireStaff>
                <AdminLayout />
              </RequireStaff>
            }
          >
            <Route index element={<Navigate to="socios" replace />} />
            <Route path="socios" element={<AdminMembers />} />
            <Route path="turnos" element={<AdminBookings />} />
            <Route path="cantina" element={<AdminCanteen />} />
            <Route path="porteria" element={<AdminAccessControl />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
