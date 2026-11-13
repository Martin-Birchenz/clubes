import { useEffect, useRef, useState } from "react";
import {
  QrCode,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  History,
} from "lucide-react";
import api from "../../config/api";

export default function AdminAccessControl() {
  const [checkpoint, setCheckpoint] = useState("Pileta / Natatorio");
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [logs, setLogs] = useState([]);

  const inputRef = useRef(null);

  const loadLogs = async () => {
    try {
      const { data } = await api.get("/admin/access/logs");
      setLogs(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLogs();
    inputRef.current?.focus();
  }, []);

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setScanning(true);
    try {
      const { data } = await api.post("/admin/access/scan", {
        code: code.trim(),
        checkpoint,
      });
      setLastResult(data.data);
      setCode("");
      loadLogs();
    } catch (err) {
      alert(err.response?.data?.message || "Error al validar acceso");
    } finally {
      setScanning(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Control de Acceso QR</h2>
          <p className="text-sm text-slate-500">
            Validación instantánea de carnet digital en portería, pileta o
            gimnasio
          </p>
        </div>

        <select
          value={checkpoint}
          onChange={(e) => setCheckpoint(e.target.value)}
          className="border border-slate-300 bg-white rounded-xl px-3.5 py-2 text-sm font-medium"
        >
          <option value="Pileta / Natatorio">Puesto: Pileta / Natatorio</option>
          <option value="Portería Principal">Puesto: Portería Principal</option>
          <option value="Gimnasio / Sede">Puesto: Gimnasio / Sede</option>
        </select>
      </div>

      {/* Lector / Buscador Rápido */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <form
          onSubmit={handleScanSubmit}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <QrCode className="h-5 w-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Escaneá el QR del socio o escribí su DNI y presioná Enter..."
              className="w-full border border-slate-300 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <button
            type="submit"
            disabled={scanning}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
          >
            {scanning ? "Validando..." : "Validar Ingreso"}
          </button>
        </form>

        {/* Resultado Visual de Alto Contraste */}
        {lastResult && (
          <div
            className={`rounded-2xl p-6 border-2 flex flex-col sm:flex-row items-center justify-between gap-4 transition ${
              !lastResult.found
                ? "bg-amber-50 border-amber-400 text-amber-950"
                : lastResult.granted
                  ? "bg-emerald-50 border-emerald-500 text-emerald-950"
                  : "bg-red-50 border-red-500 text-red-950"
            }`}
          >
            <div className="flex items-center gap-4">
              {!lastResult.found ? (
                <ShieldAlert className="h-12 w-12 text-amber-600 shrink-0" />
              ) : lastResult.granted ? (
                <CheckCircle2 className="h-12 w-12 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="h-12 w-12 text-red-600 shrink-0" />
              )}

              <div>
                <p className="text-lg font-extrabold uppercase tracking-tight">
                  {lastResult.reason}
                </p>
                {lastResult.member && (
                  <div className="text-sm mt-1 space-y-0.5">
                    <p className="font-bold">
                      {lastResult.member.fullName} (Socio #
                      {lastResult.member.memberNumber} • DNI{" "}
                      {lastResult.member.dni})
                    </p>
                    <p className="text-xs opacity-80">
                      Categoría: {lastResult.member.categoryName}
                      {lastResult.member.paidUntil &&
                        ` • Vigencia hasta: ${new Date(
                          lastResult.member.paidUntil,
                        ).toLocaleDateString("es-AR")}`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setLastResult(null);
                inputRef.current?.focus();
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/80 border border-black/10 hover:bg-white cursor-pointer"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Historial de Últimos Ingresos */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center gap-2 font-bold text-sm">
          <History className="h-4 w-4 text-slate-500" /> Últimos 20 Accesos
          Registrados
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-2.5">Hora</th>
                <th className="px-4 py-2.5">Socio</th>
                <th className="px-4 py-2.5">Puesto</th>
                <th className="px-4 py-2.5 text-right">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    Aún no se registraron escaneos hoy.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-500">
                      {new Date(log.scanned_at).toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2.5 font-medium">
                      {log.last_name}, {log.first_name}{" "}
                      <span className="text-xs text-slate-400">
                        (#{log.member_number})
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {log.checkpoint}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          log.access_granted
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {log.access_granted ? "Habilitado" : "Rechazado"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
