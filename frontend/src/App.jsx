import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Layouts
import PublicClubLayout from "./layouts/PublicClubLayout";
import AdminLayout from "./layouts/AdminLayout";

// Páginas Públicas (Modo Camaleón Heritage)
import PublicClubHome from "./pages/public/PublicClubHome";
import MemberPortal from "./pages/public/MemberPortal";
import PublicBookings from "./pages/public/PublicBookings";

// Páginas Admin & SuperAdmin
import Login from "./pages/admin/Login";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminCanteen from "./pages/admin/AdminCanteen";
import AdminAccessControl from "./pages/admin/AdminAccessControl";
import AdminSiteEditor from "./pages/admin/AdminSiteEditor";

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
          {/* Portal Público Multi-Tenant (Modo Camaleón Heritage) */}
          <Route path="/c/:slug" element={<PublicClubLayout />}>
            <Route index element={<PublicClubHome />} />
            <Route path="mi-carnet" element={<MemberPortal />} />
            <Route path="turnos" element={<PublicBookings />} />
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
            <Route index element={<AdminDashboard />} />
            <Route path="socios" element={<AdminMembers />} />
            <Route path="turnos" element={<AdminBookings />} />
            <Route path="cantina" element={<AdminCanteen />} />
            <Route path="porteria" element={<AdminAccessControl />} />
            <Route path="sitio" element={<AdminSiteEditor />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
