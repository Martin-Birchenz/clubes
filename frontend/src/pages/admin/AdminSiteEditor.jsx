import { useEffect, useState } from "react";
import { Save, Upload, Plus, Trash2 } from "lucide-react";
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
  const [faqs, setFaqs] = useState([]);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [uploadingField, setUploadingField] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadFaqs = async () => {
    try {
      const { data } = await api.get("/admin/faqs");
      setFaqs(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadFaqs();
  }, []);

  const handleImageUpload = async (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setUploadingField(fieldName);
    try {
      const { data } = await api.post("/admin/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.url) {
        setForm((prev) => ({ ...prev, [fieldName]: data.url }));
      }
    } catch (err) {
      alert("Error al subir imagen a Cloudinary");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/admin/site-content", {
        ...form,
        foundedYear: form.foundedYear ? Number(form.foundedYear) : null,
      });
      alert("Portal institucional actualizado");
    } catch (err) {
      alert("Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFaq = async (e) => {
    e.preventDefault();
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
    try {
      await api.post("/admin/faqs", newFaq);
      setNewFaq({ question: "", answer: "" });
      loadFaqs();
    } catch (err) {
      alert("Error al agregar pregunta frecuente");
    }
  };

  const handleDeleteFaq = async (id) => {
    try {
      await api.delete(`/admin/faqs/${id}`);
      loadFaqs();
    } catch (err) {
      alert("Error al eliminar FAQ");
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold">
          Personalización del Portal Público
        </h2>
        <p className="text-sm text-slate-500">
          Subí fotos en la nube, editá la historia institucional y administrá
          las preguntas frecuentes
        </p>
      </div>

      {/* Formulario Principal + Subida Cloudinary */}
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

        {/* Upload Portada Cloudinary */}
        <div className="border rounded-xl p-3.5 bg-slate-50 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Imagen de Portada (Hero Banner)</p>
            <p className="text-xs text-slate-500">
              Se almacena automáticamente en Cloudinary
            </p>
          </div>
          <div className="flex items-center gap-3">
            {form.heroBannerUrl && (
              <img
                src={form.heroBannerUrl}
                alt="Hero"
                className="h-12 w-20 object-cover rounded border bg-white"
              />
            )}
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-100">
              <Upload className="h-3.5 w-3.5" />
              {uploadingField === "heroBannerUrl"
                ? "Subiendo..."
                : "Subir Foto"}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "heroBannerUrl")}
                className="hidden"
              />
            </label>
          </div>
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

          {/* Upload Foto Histórica Cloudinary */}
          <div className="border rounded-xl p-3.5 bg-slate-50 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">
                Foto Histórica (Efecto B&N a Color)
              </p>
              <p className="text-xs text-slate-500">
                Ideal foto antigua del club o estadio
              </p>
            </div>
            <div className="flex items-center gap-3">
              {form.historyImageUrl && (
                <img
                  src={form.historyImageUrl}
                  alt="Historia"
                  className="h-12 w-20 object-cover rounded border bg-white"
                />
              )}
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-100">
                <Upload className="h-3.5 w-3.5" />
                {uploadingField === "historyImageUrl"
                  ? "Subiendo..."
                  : "Subir Foto"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "historyImageUrl")}
                  className="hidden"
                />
              </label>
            </div>
          </div>
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

      {/* Gestor de Preguntas Frecuentes (FAQs) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 text-sm">
        <h3 className="text-lg font-bold">Preguntas Frecuentes (FAQs)</h3>

        <form onSubmit={handleAddFaq} className="space-y-2.5 border-b pb-4">
          <input
            required
            placeholder="Pregunta (ej: ¿Cómo me hago socio del club?)"
            value={newFaq.question}
            onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
          <textarea
            required
            rows="2"
            placeholder="Respuesta clara para el socio..."
            value={newFaq.answer}
            onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Agregar Pregunta
          </button>
        </form>

        <div className="divide-y">
          {faqs.map((f) => (
            <div
              key={f.id}
              className="py-3 flex items-start justify-between gap-3"
            >
              <div>
                <p className="font-bold">{f.question}</p>
                <p className="text-xs text-slate-600 mt-0.5">{f.answer}</p>
              </div>
              <button
                onClick={() => handleDeleteFaq(f.id)}
                className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
