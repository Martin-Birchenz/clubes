import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  MessageCircle,
  CreditCard,
} from "lucide-react";
import api from "../../config/api";
import { useTenant } from "../../context/TenantContext";

export default function MemberPortal() {
  const { tenant, theme, flags, contact } = useTenant();

  const [dni, setDni] = useState("");
  const [loading, setLoading] = useState(false);
  const [member, setMember] = useState(null);
  const [error, setError] = useState(null);
  const [copiedAlias, setCopiedAlias] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const clean = dni.replace(/\D/g, "").trim();
    if (!clean) return;

    setLoading(true);
    setError(null);
    setMember(null);

    try {
      const { data } = await api.get(
        `/public/c/${tenant.slug}/members/${clean}`,
      );
      setMember(data.data);
    } catch (err) {
      setError(err.response?.data?.message || "No se encontró el socio");
    } finally {
      setLoading(false);
    }
  };

  const copyAlias = () => {
    if (!member?.bank_alias) return;
    navigator.clipboard.writeText(member.bank_alias);
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 2000);
  };

  const isUpToDate = member?.status === "active" || Boolean(member?.is_exempt);

  const whatsappReceiptUrl =
    contact?.whatsappSecretary && member
      ? `https://wa.me/${contact.whatsappSecretary.replace(/\D/g, "")}?text=${encodeURIComponent(
          `Hola ${tenant.shortName}, soy ${member.first_name} ${member.last_name} (Socio #${member.member_number} - DNI ${member.dni}). Envío comprobante de pago de cuota.`,
        )}`
      : null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Portal del Socio</h1>
        <p className="text-sm text-gray-600 mt-1">
          Consultá tu estado de cuota, medios de pago y Carnet Digital
        </p>
      </div>

      {/* Buscador por DNI */}
      <form
        onSubmit={handleSearch}
        className="bg-surface p-5 rounded-2xl shadow-sm border border-gray-200 flex gap-2"
      >
        <input
          type="text"
          inputMode="numeric"
          required
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          placeholder="Ingresá tu DNI (sin puntos)"
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition cursor-pointer"
        >
          <Search className="h-4 w-4" />
          {loading ? "Buscando..." : "Consultar"}
        </button>
      </form>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 text-center">
          {error}
        </div>
      )}

      {/* Tarjeta de Carnet Digital Camaleón */}
      {member && (
        <div className="bg-surface rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Cabecera del Carnet con colores del club */}
          <div className="bg-primary text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme?.logoUrl && (
                <img
                  src={theme.logoUrl}
                  alt={tenant.name}
                  className="h-11 w-11 rounded-full bg-white p-1 object-contain"
                />
              )}
              <div>
                <p className="text-xs uppercase tracking-wider opacity-80">
                  {tenant.shortName}
                </p>
                <h2 className="font-bold text-base leading-tight">
                  Carnet Digital de Socio
                </h2>
              </div>
            </div>
            <span className="text-xs font-mono bg-white/15 px-2.5 py-1 rounded-lg">
              #{member.member_number}
            </span>
          </div>

          {/* Datos del Socio + QR */}
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-lg font-bold leading-tight">
                  {member.first_name} {member.last_name}
                </p>
                <p className="text-xs text-gray-500">DNI: {member.dni}</p>
                <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-800">
                  Categoría: {member.category_name}
                </span>
              </div>

              {flags.hasQrAccess && (
                <div className="p-2.5 bg-white border border-gray-200 rounded-xl shadow-xs shrink-0">
                  <QRCodeSVG value={member.qr_token} size={96} level="M" />
                </div>
              )}
            </div>

            {/* Banner de Estado de Cuota */}
            <div
              className={`rounded-xl p-4 flex items-start gap-3 ${
                isUpToDate
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                  : "bg-red-50 border border-red-200 text-red-900"
              }`}
            >
              {isUpToDate ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                <p className="font-bold">
                  {member.is_exempt
                    ? "Socio Exento de Cuota (Vitalicio / Honorario)"
                    : isUpToDate
                      ? "Cuota al Día — Habilitado"
                      : "Cuota Pendiente de Pago"}
                </p>
                {member.paid_until && !member.is_exempt && (
                  <p className="text-xs opacity-80 mt-0.5">
                    Vigencia cubierta hasta:{" "}
                    <strong>
                      {new Date(member.paid_until).toLocaleDateString("es-AR")}
                    </strong>
                  </p>
                )}
              </div>
            </div>

            {/* Opciones de Pago si no es exento */}
            {!member.is_exempt && (
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Valor cuota mensual:</span>
                  <span className="text-lg font-bold">
                    ${Number(member.monthly_fee).toLocaleString("es-AR")}
                  </span>
                </div>

                {member.bank_alias && (
                  <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-500 block">
                        Alias Transferencia del Club:
                      </span>
                      <strong className="text-sm font-mono">
                        {member.bank_alias}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={copyAlias}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border bg-white hover:bg-gray-100 font-medium cursor-pointer"
                    >
                      {copiedAlias ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />{" "}
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copiar
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {member.mp_public_key && (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 bg-secondary text-white py-2.5 px-4 rounded-xl text-xs font-bold hover:opacity-90 transition cursor-pointer"
                    >
                      <CreditCard className="h-4 w-4" /> Pagar con Mercado Pago
                    </button>
                  )}

                  {whatsappReceiptUrl && (
                    <a
                      href={whatsappReceiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 px-4 rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                    >
                      <MessageCircle className="h-4 w-4" /> Enviar Comprobante
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
