import { useEffect, useRef, useState } from "react";
import {
  Search,
  Upload,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import api from "../../config/api";

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState(null);
  const [payingMember, setPayingMember] = useState(null);
  const [months, setMonths] = useState(1);
  const [method, setMethod] = useState("efectivo");

  const fileInputRef = useRef(null);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/members", {
        params: { search, status: statusFilter },
      });
      setMembers(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadMembers();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setImporting(true);
    setImportReport(null);

    try {
      const { data } = await api.post("/admin/members/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportReport(data.data);
      loadMembers();
    } catch (err) {
      alert(err.response?.data?.message || "Error al importar planilla");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!payingMember) return;

    const totalAmount = Number(payingMember.monthly_fee) * Number(months);

    try {
      await api.post(`/admin/members/${payingMember.id}/payments`, {
        amount: totalAmount,
        monthsCovered: Number(months),
        paymentMethod: method,
      });
      setPayingMember(null);
      setMonths(1);
      loadMembers();
    } catch (err) {
      alert(err.response?.data?.message || "Error al registrar el cobro");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Padrón de Socios y Tesorería</h2>
          <p className="text-sm text-slate-500">
            Gestión de cuotas, estado de cuenta e importación masiva desde Excel
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            {importing ? "Procesando Excel..." : "Importar Padrón (.xlsx)"}
          </button>
        </div>
      </div>

      {/* Reporte de Importación Zod */}
      {importReport && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Importación completada ({importReport.totalRows} filas leídas)
            </span>
            <button
              onClick={() => setImportReport(null)}
              className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
          <p className="text-slate-600">
            Nuevos: <strong>{importReport.imported}</strong> • Actualizados:{" "}
            <strong>{importReport.updated}</strong> • Con errores:{" "}
            <strong className="text-red-600">{importReport.failed}</strong>
          </p>
          {importReport.errors?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 max-h-32 overflow-y-auto space-y-1">
              {importReport.errors.map((err, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Fila {err.row} (DNI {err.dni}): {err.reasons.join(", ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filtros y Buscador */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por DNI, apellido, nombre o N° socio..."
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
          >
            <Search className="h-4 w-4" /> Buscar
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="active">Al día</option>
          <option value="debtor">Con deuda</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>

      {/* Tabla de Socios */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">N° / DNI</th>
                <th className="px-4 py-3">Socio</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Vigencia</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Cobranza</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Cargando padrón...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No hay socios cargados todavía. Usá el botón "Importar
                    Padrón (.xlsx)".
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-slate-500">
                        #{m.member_number}
                      </div>
                      <div className="font-semibold">{m.dni}</div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {m.last_name}, {m.first_name}
                    </td>
                    <td className="px-4 py-3">
                      <div>{m.category_name}</div>
                      <div className="text-xs text-slate-500">
                        ${Number(m.monthly_fee).toLocaleString("es-AR")}/mes
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {m.paid_until
                        ? new Date(m.paid_until).toLocaleDateString("es-AR")
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          m.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {m.status === "active" ? "Al día" : "Deudor"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!m.is_exempt && (
                        <button
                          onClick={() => setPayingMember(m)}
                          className="inline-flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
                        >
                          <DollarSign className="h-3.5 w-3.5" /> Cobrar Cuota
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cobro Rápido de Cuota */}
      {payingMember && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold">
              Registrar Cobro — {payingMember.last_name},{" "}
              {payingMember.first_name}
            </h3>

            <form onSubmit={handleConfirmPayment} className="space-y-4 text-sm">
              <div>
                <label className="block font-medium mb-1">
                  Meses a abonar (Adelantos)
                </label>
                <select
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {[1, 2, 3, 6, 12].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "mes" : "meses"} ($
                      {(Number(payingMember.monthly_fee) * n).toLocaleString(
                        "es-AR",
                      )}
                      )
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Medio de Pago</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="efectivo">Efectivo en Secretaría</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="debito">Débito / Posnet</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setPayingMember(null)}
                  className="px-4 py-2 rounded-lg border cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 cursor-pointer"
                >
                  Confirmar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
