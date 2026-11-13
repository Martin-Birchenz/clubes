import { useEffect, useState } from "react";
import { Calendar, Plus, CheckCircle2, XCircle, Settings } from "lucide-react";
import api from "../../config/api";

export default function AdminBookings() {
  const today = new Date().toISOString().split("T")[0];

  const [disciplines, setDisciplines] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [selectedDisciplineId, setSelectedDisciplineId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showSetupModal, setShowSetupModal] = useState(false);
  const [newDisciplineName, setNewDisciplineName] = useState("");
  const [newFacility, setNewFacility] = useState({
    disciplineId: "",
    name: "",
    pricingType: "hourly",
    defaultPrice: 12000,
    memberDiscountPercent: 25,
  });

  const [resForm, setResForm] = useState({
    facilityId: "",
    clientName: "",
    clientPhone: "",
    startTime: "18:00",
    endTime: "19:00",
    customPrice: "",
    paymentStatus: "pending",
    notes: "",
  });

  const loadBaseData = async () => {
    try {
      const [discRes, facRes] = await Promise.all([
        api.get("/admin/disciplines"),
        api.get("/admin/facilities"),
      ]);
      const discList = discRes.data.data || [];
      const facList = facRes.data.data || [];

      setDisciplines(discList);
      setFacilities(facList);

      if (discList.length > 0 && !selectedDisciplineId) {
        setSelectedDisciplineId(discList[0].id);
        setNewFacility((prev) => ({ ...prev, disciplineId: discList[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadReservations = async () => {
    if (!selectedDisciplineId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get("/admin/reservations", {
        params: { date: selectedDate, disciplineId: selectedDisciplineId },
      });
      setReservations(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    const filteredFacs = facilities.filter(
      (f) => f.discipline_id === selectedDisciplineId,
    );
    if (filteredFacs.length > 0) {
      setResForm((prev) => ({
        ...prev,
        facilityId: filteredFacs[0].id,
        customPrice: filteredFacs[0].default_price,
      }));
    } else {
      setResForm((prev) => ({ ...prev, facilityId: "" }));
    }
    loadReservations();
  }, [selectedDisciplineId, selectedDate, facilities]);

  const handleCreateDiscipline = async (e) => {
    e.preventDefault();
    const slug = newDisciplineName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-");

    try {
      await api.post("/admin/disciplines", {
        name: newDisciplineName,
        slug,
        hasBookings: true,
      });
      setNewDisciplineName("");
      await loadBaseData();
    } catch (err) {
      alert(err.response?.data?.message || "Error al crear disciplina");
    }
  };

  const handleCreateFacility = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/facilities", {
        ...newFacility,
        disciplineId: Number(newFacility.disciplineId || selectedDisciplineId),
        defaultPrice: Number(newFacility.defaultPrice),
        memberDiscountPercent: Number(newFacility.memberDiscountPercent),
      });
      setNewFacility((prev) => ({ ...prev, name: "" }));
      await loadBaseData();
    } catch (err) {
      alert(err.response?.data?.message || "Error al crear cancha/espacio");
    }
  };

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/reservations", {
        facilityId: Number(resForm.facilityId),
        clientName: resForm.clientName,
        clientPhone: resForm.clientPhone,
        reservationDate: selectedDate,
        startTime: resForm.startTime,
        endTime: resForm.endTime,
        customPrice:
          resForm.customPrice !== "" ? Number(resForm.customPrice) : undefined,
        paymentStatus: resForm.paymentStatus,
        notes: resForm.notes,
      });
      setResForm((prev) => ({
        ...prev,
        clientName: "",
        clientPhone: "",
        notes: "",
      }));
      loadReservations();
    } catch (err) {
      alert(err.response?.data?.message || "No se pudo reservar el turno");
    }
  };

  const handleUpdateReservation = async (id, payload) => {
    try {
      await api.patch(`/admin/reservations/${id}`, payload);
      loadReservations();
    } catch (err) {
      alert("Error al actualizar turno");
    }
  };

  const activeFacilities = facilities.filter(
    (f) => f.discipline_id === selectedDisciplineId,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Disciplinas y Turnero</h2>
          <p className="text-sm text-slate-500">
            Agenda aislada por disciplina, tarifas flexibles y control
            anti-solapamiento
          </p>
        </div>

        <button
          onClick={() => setShowSetupModal(true)}
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 cursor-pointer"
        >
          <Settings className="h-4 w-4" /> Configurar Canchas
        </button>
      </div>

      {/* Pestañas aisladas por Disciplina */}
      {disciplines.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {disciplines.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDisciplineId(d.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                selectedDisciplineId === d.id
                  ? "bg-slate-950 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      )}

      {disciplines.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-3">
          <p className="text-slate-600">
            Este club todavía no tiene disciplinas configuradas.
          </p>
          <button
            onClick={() => setShowSetupModal(true)}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Crear Primera Disciplina
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario Nueva Reserva */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-4">
            <h3 className="font-bold text-base">Agendar Turno / Evento</h3>

            {activeFacilities.length === 0 ? (
              <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg">
                Agregá al menos una cancha o espacio en "Configurar Canchas"
                para tomar reservas.
              </p>
            ) : (
              <form
                onSubmit={handleCreateReservation}
                className="space-y-3 text-sm"
              >
                <div>
                  <label className="block font-medium mb-1">
                    Cancha / Espacio
                  </label>
                  <select
                    value={resForm.facilityId}
                    onChange={(e) => {
                      const fac = activeFacilities.find(
                        (f) => f.id === Number(e.target.value),
                      );
                      setResForm({
                        ...resForm,
                        facilityId: e.target.value,
                        customPrice: fac ? fac.default_price : "",
                      });
                    }}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {activeFacilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ($
                        {Number(f.default_price).toLocaleString("es-AR")})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium mb-1">Inicio</label>
                    <input
                      type="time"
                      required
                      value={resForm.startTime}
                      onChange={(e) =>
                        setResForm({ ...resForm, startTime: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Fin</label>
                    <input
                      type="time"
                      required
                      value={resForm.endTime}
                      onChange={(e) =>
                        setResForm({ ...resForm, endTime: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-1">
                    Cliente / Responsable
                  </label>
                  <input
                    required
                    value={resForm.clientName}
                    onChange={(e) =>
                      setResForm({ ...resForm, clientName: e.target.value })
                    }
                    placeholder="Nombre y apellido"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">WhatsApp</label>
                  <input
                    required
                    value={resForm.clientPhone}
                    onChange={(e) =>
                      setResForm({ ...resForm, clientPhone: e.target.value })
                    }
                    placeholder="3435..."
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium mb-1">Tarifa ($)</label>
                    <input
                      type="number"
                      value={resForm.customPrice}
                      onChange={(e) =>
                        setResForm({ ...resForm, customPrice: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Pago</label>
                    <select
                      value={resForm.paymentStatus}
                      onChange={(e) =>
                        setResForm({
                          ...resForm,
                          paymentStatus: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="partial">Señado</option>
                      <option value="paid">Pagado</option>
                    </select>
                  </div>
                </div>

                <input
                  value={resForm.notes}
                  onChange={(e) =>
                    setResForm({ ...resForm, notes: e.target.value })
                  }
                  placeholder="Notas (ej: Luz, pelotas, partido nocturno)"
                  className="w-full border rounded-lg px-3 py-2"
                />

                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Confirmar Reserva
                </button>
              </form>
            )}
          </div>

          {/* Grilla Diaria */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Agenda del Día
              </h3>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
              />
            </div>

            {loading ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                Cargando agenda...
              </p>
            ) : reservations.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                No hay reservas cargadas para esta fecha en esta disciplina.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                    <tr>
                      <th className="px-3 py-2.5">Horario</th>
                      <th className="px-3 py-2.5">Espacio</th>
                      <th className="px-3 py-2.5">Cliente</th>
                      <th className="px-3 py-2.5">Importe</th>
                      <th className="px-3 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {reservations.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-3 font-mono font-bold text-xs">
                          {r.start_time.slice(0, 5)} - {r.end_time.slice(0, 5)}
                        </td>
                        <td className="px-3 py-3">{r.facility_name}</td>
                        <td className="px-3 py-3">
                          <div className="font-medium">{r.client_name}</div>
                          <div className="text-xs text-slate-500">
                            {r.client_phone}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-semibold">
                            ${Number(r.final_price).toLocaleString("es-AR")}
                          </div>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                              r.payment_status === "paid"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {r.payment_status === "paid"
                              ? "Pagado"
                              : "Pendiente"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right space-x-1">
                          {r.status !== "cancelled" && (
                            <>
                              {r.payment_status !== "paid" && (
                                <button
                                  onClick={() =>
                                    handleUpdateReservation(r.id, {
                                      paymentStatus: "paid",
                                    })
                                  }
                                  title="Marcar pagado"
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  handleUpdateReservation(r.id, {
                                    status: "cancelled",
                                  })
                                }
                                title="Cancelar turno"
                                className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Configuración de Disciplinas y Canchas */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 text-sm">
            <h3 className="text-lg font-bold">
              Configurar Disciplinas e Instalaciones
            </h3>

            <form
              onSubmit={handleCreateDiscipline}
              className="space-y-2 border-b pb-4"
            >
              <label className="block font-semibold text-xs uppercase text-slate-500">
                1. Agregar Disciplina (Ej: Tenis, Pádel, Salón)
              </label>
              <div className="flex gap-2">
                <input
                  required
                  value={newDisciplineName}
                  onChange={(e) => setNewDisciplineName(e.target.value)}
                  placeholder="Nombre de la disciplina"
                  className="flex-1 border rounded-lg px-3 py-2"
                />
                <button
                  type="submit"
                  className="bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  Agregar
                </button>
              </div>
            </form>

            {disciplines.length > 0 && (
              <form onSubmit={handleCreateFacility} className="space-y-3">
                <label className="block font-semibold text-xs uppercase text-slate-500">
                  2. Agregar Cancha o Espacio Físico
                </label>
                <select
                  value={newFacility.disciplineId || selectedDisciplineId}
                  onChange={(e) =>
                    setNewFacility({
                      ...newFacility,
                      disciplineId: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {disciplines.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <input
                  required
                  value={newFacility.name}
                  onChange={(e) =>
                    setNewFacility({ ...newFacility, name: e.target.value })
                  }
                  placeholder="Ej: Cancha 1 Polvo / Salón Principal"
                  className="w-full border rounded-lg px-3 py-2"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    required
                    value={newFacility.defaultPrice}
                    onChange={(e) =>
                      setNewFacility({
                        ...newFacility,
                        defaultPrice: e.target.value,
                      })
                    }
                    placeholder="Tarifa base ($)"
                    className="border rounded-lg px-3 py-2"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newFacility.memberDiscountPercent}
                    onChange={(e) =>
                      setNewFacility({
                        ...newFacility,
                        memberDiscountPercent: e.target.value,
                      })
                    }
                    placeholder="% Descuento Socio"
                    className="border rounded-lg px-3 py-2"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-2 rounded-lg font-semibold cursor-pointer"
                >
                  Guardar Cancha / Espacio
                </button>
              </form>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSetupModal(false)}
                className="px-4 py-2 rounded-lg border cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
