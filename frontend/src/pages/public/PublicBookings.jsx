import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  MessageCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import api from "../../config/api";
import { useTenant } from "../../context/TenantContext";

const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

export default function PublicBookings() {
  const { tenant, contact } = useTenant();
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [data, setData] = useState({
    disciplines: [],
    facilities: [],
    occupiedSlots: [],
  });
  const [selectedDiscId, setSelectedDiscId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(
          `/public/c/${tenant.slug}/bookings/availability`,
          {
            params: { date },
          },
        );
        const payload = res.data.data;
        setData(payload);
        if (payload.disciplines.length > 0 && !selectedDiscId) {
          setSelectedDiscId(payload.disciplines[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tenant.slug, date]);

  const isSlotOccupied = (facilityId, slotHour) => {
    return data.occupiedSlots.some((occ) => {
      if (occ.facility_id !== facilityId) return false;
      const start = occ.start_time.slice(0, 5);
      const end = occ.end_time.slice(0, 5);
      return slotHour >= start && slotHour < end;
    });
  };

  const buildWhatsappBookingLink = (facility, slotHour) => {
    if (!contact?.whatsappSecretary) return null;
    const phone = contact.whatsappSecretary.replace(/\D/g, "");
    const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString(
      "es-AR",
    );
    const msg = `Hola ${tenant.shortName}! Quisiera reservar *${facility.name}* el día *${formattedDate}* a las *${slotHour} hs*.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const facilities = data.facilities.filter(
    (f) => f.discipline_id === selectedDiscId,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Disponibilidad de Canchas y Espacios
          </h1>
          <p className="text-sm text-gray-600">
            Consultá horarios libres en tiempo real y reservá directo por
            WhatsApp
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface border border-gray-200 px-3 py-2 rounded-xl">
          <Calendar className="h-4 w-4 text-primary" />
          <input
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-sm font-semibold focus:outline-none"
          />
        </div>
      </div>

      {/* Pestañas de Disciplinas */}
      {data.disciplines.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.disciplines.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDiscId(d.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                selectedDiscId === d.id
                  ? "bg-primary text-white"
                  : "bg-surface border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-center py-10 text-sm text-gray-500">
          Consultando disponibilidad...
        </p>
      ) : facilities.length === 0 ? (
        <div className="bg-surface p-8 rounded-2xl border border-gray-200 text-center text-sm text-gray-600">
          No hay canchas habilitadas para reserva online en esta disciplina.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {facilities.map((fac) => (
            <div
              key={fac.id}
              className="bg-surface rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h2 className="font-bold text-lg">{fac.name}</h2>
                  <p className="text-xs text-gray-500">
                    Tarifa general:{" "}
                    <strong>
                      ${Number(fac.default_price).toLocaleString("es-AR")}
                    </strong>
                    {fac.member_discount_percent > 0 &&
                      ` • Socios al día: ${fac.member_discount_percent}% OFF`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const occupied = isSlotOccupied(fac.id, slot);
                  const waUrl = buildWhatsappBookingLink(fac, slot);

                  if (occupied) {
                    return (
                      <div
                        key={slot}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-semibold opacity-75"
                      >
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {slot}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <XCircle className="h-3.5 w-3.5" /> Ocupado
                        </span>
                      </div>
                    );
                  }

                  return waUrl ? (
                    <a
                      key={slot}
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 hover:bg-emerald-600 hover:text-white transition text-xs font-bold"
                    >
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {slot}
                      </span>
                      <MessageCircle className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <div
                      key={slot}
                      className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold text-center"
                    >
                      {slot} Libre
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
