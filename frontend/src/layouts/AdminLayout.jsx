import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Store,
  QrCode,
  Globe,
  LogOut,
  ShieldAlert,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout() {
  const { user, logout, activeTenantName, exitSupportMode } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const roleCode = (user?.roleCode || user?.role || "").toLowerCase();

  const isSuperAdmin = roleCode === "superadmin";
  const isFullAdmin =
    isSuperAdmin ||
    ["admin", "admin_club", "club_admin", "presidente", "secretaria"].includes(
      roleCode,
    );

  const rawPermissions = user?.permissions;
  const permissions = Array.isArray(rawPermissions)
    ? rawPermissions
    : typeof rawPermissions === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(rawPermissions);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];

  const canAccess = (requiredModule) => {
    if (isFullAdmin || permissions.includes("all")) return true;
    return permissions.includes(requiredModule);
  };

  const navItems = [
    {
      to: "/admin",
      label: "Inicio / Resumen",
      icon: LayoutDashboard,
      module: "members",
      end: true,
    },
    {
      to: "/admin/socios",
      label: "Socios y Cuotas",
      icon: Users,
      module: "members",
    },
    {
      to: "/admin/turnos",
      label: "Turnero Canchas",
      icon: CalendarDays,
      module: "bookings",
    },
    {
      to: "/admin/cantina",
      label: "Cantina / Buffet",
      icon: Store,
      module: "canteen",
    },
    {
      to: "/admin/porteria",
      label: "Portería QR",
      icon: QrCode,
      module: "access_control",
    },
    {
      to: "/admin/sitio",
      label: "Sitio Web / CMS",
      icon: Globe,
      module: "all",
    },
  ];

  const visibleItems = navItems.filter((item) => canAccess(item.module));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleExitSupport = () => {
    if (typeof exitSupportMode === "function") {
      exitSupportMode();
    }
    navigate("/superadmin");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {isSuperAdmin && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span>
              MODO SUPERADMIN —{" "}
              {activeTenantName
                ? `Administrando: ${activeTenantName}`
                : "Vista de Administración"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleExitSupport}
            className="bg-slate-900 text-white px-3 py-1 rounded text-xs hover:bg-slate-800 cursor-pointer"
          >
            Volver a Consola SuperAdmin
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row">
        <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col p-4 shrink-0">
          <div className="flex items-center justify-between md:block pb-3 md:pb-4 border-b border-slate-800">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-slate-400">
                Panel del Club
              </p>
              <h1 className="font-bold text-base truncate mt-0.5">
                {activeTenantName || user?.tenantName || "Gestión Deportiva"}
              </h1>
              <span className="inline-block mt-1 text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase">
                {user?.roleName || roleCode || "Staff"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-lg bg-slate-800 text-white"
              aria-label="Abrir menú"
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>

          <div
            className={`${
              menuOpen ? "flex" : "hidden"
            } md:flex flex-col flex-1 mt-3 md:mt-4`}
          >
            <nav className="space-y-1 flex-1">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                        isActive
                          ? "bg-white text-slate-900 font-semibold"
                          : "text-slate-300 hover:bg-slate-800"
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-3 mt-4 border-t border-slate-800">
              <p className="text-xs text-slate-400 truncate mb-2">
                {user?.fullName}
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-slate-800 cursor-pointer"
              >
                <LogOut className="h-4 w-4" /> Cerrar Sesión
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
