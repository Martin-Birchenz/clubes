import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  DollarSign,
  CalendarDays,
  Store,
  QrCode,
  Globe,
} from "lucide-react";
import api from "../../config/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/dashboard/summary")
      .then((res) => setStats(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-slate-500 py-8">
        Cargando resumen ejecutivo...
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Panel de Control</h2>
        <p className="text-sm text-slate-500">
          Resumen operativo y financiero en tiempo real del club
        </p>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
            <span>Socios Activos</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold">
            {stats?.members?.active_count || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            De {stats?.members?.total || 0} totales (
            {stats?.members?.debtor_count || 0} con deuda)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
            <span>Cuotas Cobradas (Mes)</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">
            ${Number(stats?.monthlyFeesCollected || 0).toLocaleString("es-AR")}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Recaudación societaria del mes actual
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
            <span>Turnos Hoy</span>
            <CalendarDays className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold">
            {stats?.todayReservationsCount || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Reservas confirmadas en instalaciones
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
            <span>Efectivo en Cantina</span>
            <Store className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold">
            $
            {Number(stats?.canteen?.cash_in_registers || 0).toLocaleString(
              "es-AR",
            )}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {stats?.canteen?.open_boxes || 0} caja(s) abierta(s) en este momento
          </p>
        </div>
      </div>

      {/* Accesos Directos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/admin/socios"
          className="bg-white border border-slate-200 hover:border-slate-900 p-4 rounded-xl text-center space-y-1.5 transition"
        >
          <Users className="h-5 w-5 mx-auto text-slate-700" />
          <p className="text-xs font-bold">Cobrar Cuotas / Padrón</p>
        </Link>
        <Link
          to="/admin/turnos"
          className="bg-white border border-slate-200 hover:border-slate-900 p-4 rounded-xl text-center space-y-1.5 transition"
        >
          <CalendarDays className="h-5 w-5 mx-auto text-slate-700" />
          <p className="text-xs font-bold">Agenda de Canchas</p>
        </Link>
        <Link
          to="/admin/porteria"
          className="bg-white border border-slate-200 hover:border-slate-900 p-4 rounded-xl text-center space-y-1.5 transition"
        >
          <QrCode className="h-5 w-5 mx-auto text-slate-700" />
          <p className="text-xs font-bold">Escáner Portería QR</p>
        </Link>
        <Link
          to="/admin/sitio"
          className="bg-white border border-slate-200 hover:border-slate-900 p-4 rounded-xl text-center space-y-1.5 transition"
        >
          <Globe className="h-5 w-5 mx-auto text-slate-700" />
          <p className="text-xs font-bold">Editar Sitio Web</p>
        </Link>
      </div>
    </div>
  );
}
