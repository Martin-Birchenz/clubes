import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Users,
  CalendarDays,
  Store,
  QrCode,
  LogOut,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout() {
  const { user, logout, hasModule } = useAuth();
  const navigate = useNavigate();

  const impersonatedName = sessionStorage.getItem("cd_impersonate_tenant_name");
  const clubTitle = impersonatedName || user?.tenant?.name || "Panel del Club";

  const exitSupportMode = () => {
    sessionStorage.removeItem("cd_impersonate_tenant_id");
    sessionStorage.removeItem("cd_impersonate_tenant_name");
    navigate("/superadmin");
  };

  const navItems = [
    {
      to: "/admin/socios",
      label: "Socios y Cuotas",
      icon: Users,
      module: "members",
    },
    {
      to: "/admin/turnos",
      label: "Disciplinas y Turnos",
      icon: CalendarDays,
      module: "bookings",
    },
    {
      to: "/admin/cantina",
      label: "Cantina / TPV",
      icon: Store,
      module: "canteen",
    },
    {
      to: "/admin/porteria",
      label: "Control Acceso QR",
      icon: QrCode,
      module: "members",
    },
  ].filter((item) => hasModule(item.module));

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {impersonatedName && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between">
          <span>Modo Soporte SuperAdmin activo sobre: {impersonatedName}</span>
          <button
            onClick={exitSupportMode}
            className="inline-flex items-center gap-1 bg-slate-950 text-white px-2.5 py-1 rounded cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver a SuperAdmin
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar RBAC */}
        <aside className="w-full md:w-64 bg-slate-950 text-white flex flex-col justify-between p-4">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 px-2 pt-2">
              <Shield className="h-6 w-6 text-amber-400 shrink-0" />
              <div>
                <h1 className="font-bold text-sm leading-tight">{clubTitle}</h1>
                <span className="text-[11px] text-slate-400 uppercase">
                  {user?.roleCode}
                </span>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? "bg-white text-slate-950 font-semibold"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="mt-6 flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-900 hover:text-white cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Cerrar Sesión
          </button>
        </aside>

        {/* Contenido Operativo */}
        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
