import { useState } from "react";
import { Save } from "lucide-react";
import api from "../../config/api";

export default function AdminSiteEditor() {
  const [form, setForm] = useState({
    heroBannerUrl: "",
    heroSubtitle: "",
    foundedYear: "",
    historyTitle: "",
    historyText: "",
    historyImageUrl: "",
    address: "",
    bankAlias: "",
    whatsappSecretary: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/admin/site-content", {
        ...form,
        foundedYear: form.foundedYear ? Number(form.foundedYear) : null,
      });
      alert("Portal institucional actualizado correctamente");
    } catch (err) {
      alert(err.response?.data?.message || "Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          Personalización del Portal Público
        </h2>
        <p className="text-sm text-slate-500">
          Editá la portada, historia institucional, dirección y alias de
          transferencia del club
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 text-sm"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Año de Fundación</label>
            <input
              type="number"
              placeholder="Ej: 1944"
              value={form.foundedYear}
              onChange={(e) =>
                setForm({ ...form, foundedYear: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">
              Dirección de la Sede
            </label>
            <input
              placeholder="Ej: Mihura y Fritz Gerald"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">
            Subtítulo de Portada (Hero)
          </label>
          <input
            placeholder="Frase principal debajo del nombre del club"
            value={form.heroSubtitle}
            onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">
            URL Imagen de Portada (Cloudinary)
          </label>
          <input
            type="url"
            placeholder="https://res.cloudinary.com/..."
            value={form.heroBannerUrl}
            onChange={(e) =>
              setForm({ ...form, heroBannerUrl: e.target.value })
            }
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div className="pt-2 border-t space-y-3">
          <h3 className="font-bold text-xs uppercase text-slate-500">
            Sección Historia
          </h3>
          <input
            placeholder="Título (ej: Nuestras Raíces desde 1944)"
            value={form.historyTitle}
            onChange={(e) => setForm({ ...form, historyTitle: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
          <textarea
            rows="4"
            placeholder="Relato histórico del club..."
            value={form.historyText}
            onChange={(e) => setForm({ ...form, historyText: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
          <input
            type="url"
            placeholder="URL Foto Histórica (Cloudinary)"
            value={form.historyImageUrl}
            onChange={(e) =>
              setForm({ ...form, historyImageUrl: e.target.value })
            }
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div className="pt-2 border-t grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">
              Alias Bancario para Cuotas
            </label>
            <input
              placeholder="Ej: CLUB.DEPOR.NOGOYA"
              value={form.bankAlias}
              onChange={(e) => setForm({ ...form, bankAlias: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">
              WhatsApp Secretaría
            </label>
            <input
              placeholder="5493435000000"
              value={form.whatsappSecretary}
              onChange={(e) =>
                setForm({ ...form, whatsappSecretary: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar Cambios del Sitio"}
          </button>
        </div>
      </form>
    </div>
  );
}
