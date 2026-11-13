import { Link } from "react-router-dom";
import {
  Calendar,
  QrCode,
  MapPin,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { useTenant } from "../../context/TenantContext";

export default function PublicClubHome() {
  const { tenant, theme, flags, contact, institutional } = useTenant();

  const heroBg =
    theme?.heroBannerUrl ||
    "https://images.unsplash.com/photo-1518605368461-1ee7e33f2685?auto=format&fit=crop&w=1600&q=80";

  return (
    <div className="space-y-16 pb-12">
      {/* 1. HERO INSTITUCIONAL CON FONDO FIJADO */}
      <section
        className="relative rounded-3xl overflow-hidden text-white min-h-[72vh] flex items-center px-6 md:px-14 py-16 shadow-xl bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.82), rgba(0,0,0,0.45), rgba(0,0,0,0.85)), url("${heroBg}")`,
        }}
      >
        <div className="max-w-2xl space-y-5">
          {institutional?.foundedYear && (
            <span className="inline-block text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs">
              Fundado en {institutional.foundedYear} • {tenant.city}
            </span>
          )}

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-none">
            {tenant.name}
          </h1>

          <p className="text-base md:text-lg text-white/90 font-medium">
            {institutional?.heroSubtitle ||
              "Pasión, deporte y sentido de pertenencia. Gestioná tu cuota, descargá tu carnet digital y reservá tu cancha."}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            {flags.hasMemberships && (
              <Link
                to={`/c/${tenant.slug}/mi-carnet`}
                className="inline-flex items-center gap-2 bg-secondary text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition shadow-lg"
              >
                <QrCode className="h-4 w-4" /> Mi Carnet / Pagar Cuota
              </Link>
            )}
            {flags.hasBookings && (
              <Link
                to={`/c/${tenant.slug}/turnos`}
                className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-100 transition shadow-lg"
              >
                <Calendar className="h-4 w-4" /> Reservar Cancha
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 2. HISTORIA E IDENTIDAD DEL CLUB (GRAYSCALE -> COLOR) */}
      {(institutional?.historyText || institutional?.historyImageUrl) && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center bg-surface p-8 md:p-12 rounded-3xl border border-gray-200 shadow-xs">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-secondary">
              Nuestra Identidad
            </span>
            <h2 className="text-3xl font-extrabold">
              {institutional.historyTitle || `Historia de ${tenant.shortName}`}
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm md:text-base">
              {institutional.historyText}
            </p>
          </div>

          {institutional.historyImageUrl && (
            <div className="overflow-hidden rounded-2xl shadow-md">
              <img
                src={institutional.historyImageUrl}
                alt={tenant.name}
                className="w-full h-80 object-cover heritage-grayscale"
              />
            </div>
          )}
        </section>
      )}

      {/* 3. DISCIPLINAS DEPORTIVAS DEL CLUB */}
      {institutional?.disciplines?.length > 0 && (
        <section className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-3xl font-extrabold uppercase tracking-tight">
              Nuestras Disciplinas
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Actividades deportivas y sociales abiertas a socios y la comunidad
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {institutional.disciplines.map((disc) => (
              <div
                key={disc.id}
                className="bg-surface rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:-translate-y-1 transition duration-300 flex flex-col"
              >
                {disc.image_url && (
                  <img
                    src={disc.image_url}
                    alt={disc.name}
                    className="w-full h-48 object-cover heritage-grayscale"
                  />
                )}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-xl font-bold">{disc.name}</h3>
                    {disc.description && (
                      <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                        {disc.description}
                      </p>
                    )}
                  </div>
                  {disc.schedule_info && (
                    <div className="pt-2 border-t border-gray-100 text-xs font-semibold text-primary">
                      Horarios: {disc.schedule_info}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. PREGUNTAS FRECUENTES (FAQs) */}
      {institutional?.faqs?.length > 0 && (
        <section className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-2xl font-extrabold text-center uppercase">
            Preguntas Frecuentes
          </h2>
          <div className="space-y-2.5">
            {institutional.faqs.map((faq) => (
              <details
                key={faq.id}
                className="group bg-surface border border-gray-200 rounded-2xl p-4"
              >
                <summary className="font-bold text-sm cursor-pointer flex items-center justify-between list-none">
                  <span>{faq.question}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400 group-open:rotate-180 transition" />
                </summary>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* 5. SEDE Y CONTACTO DIRECTO */}
      <section className="bg-primary text-white rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">
            ¿Querés asociarte o hacer una consulta?
          </h3>
          {institutional?.address && (
            <p className="text-sm text-white/80 flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" /> {institutional.address},{" "}
              {tenant.city}
            </p>
          )}
        </div>

        {contact?.whatsappSecretary && (
          <a
            href={`https://wa.me/${contact.whatsappSecretary.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-500 text-slate-950 px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-400 transition shrink-0"
          >
            <MessageCircle className="h-4 w-4" /> Escribir a Secretaría
          </a>
        )}
      </section>
    </div>
  );
}
