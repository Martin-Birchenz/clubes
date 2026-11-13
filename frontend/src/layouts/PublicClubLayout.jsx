import { Outlet, Link } from "react-router-dom";
import { TenantProvider, useTenant } from "../context/TenantContext";

function ClubShell() {
  const { tenant, theme, flags, loading, error } = useTenant();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-bg-main">
        <h1 className="text-2xl font-bold mb-2">Portal no disponible</h1>
        <p className="text-gray-600">
          {error || "El club solicitado no existe."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-main text-text-main">
      <header className="bg-primary text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={`/c/${tenant.slug}`} className="flex items-center gap-3">
            {theme?.logoUrl && (
              <img
                src={theme.logoUrl}
                alt={tenant.name}
                className="h-10 w-10 object-contain rounded-full bg-white p-1"
              />
            )}
            <span className="font-bold text-lg tracking-tight">
              {tenant.name}
            </span>
          </Link>

          <nav className="flex items-center gap-5 text-sm font-medium">
            {flags.hasMemberships && (
              <Link
                to={`/c/${tenant.slug}/mi-carnet`}
                className="hover:opacity-80"
              >
                Mi Carnet / Cuota
              </Link>
            )}
            {flags.hasBookings && (
              <Link
                to={`/c/${tenant.slug}/turnos`}
                className="hover:opacity-80"
              >
                Reservar Turno
              </Link>
            )}
            <Link
              to="/login"
              className="bg-secondary text-white px-3 py-1.5 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Acceso Staff
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-surface py-4 text-center text-xs text-gray-500">
        {tenant.name} • Potenciado por <strong>Core Deportivo</strong>
      </footer>
    </div>
  );
}

export default function PublicClubLayout() {
  return (
    <TenantProvider>
      <ClubShell />
    </TenantProvider>
  );
}
