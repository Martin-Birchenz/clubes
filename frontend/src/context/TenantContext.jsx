import { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../config/api";

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const { slug } = useParams();
  const [tenantData, setTenantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    async function loadBootstrap() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/public/c/${slug}/bootstrap`);
        if (!isMounted) return;

        const payload = data.data;
        setTenantData(payload);

        // Inyección en tiempo real del Modo Camaleón en :root
        const root = document.documentElement;
        Object.entries(payload.theme.colors || {}).forEach(
          ([cssVar, hexValue]) => {
            if (hexValue) root.style.setProperty(cssVar, hexValue);
          },
        );
        if (payload.theme.fonts?.heading) {
          root.style.setProperty(
            "--font-heading",
            `"${payload.theme.fonts.heading}", sans-serif`,
          );
        }
        if (payload.theme.fonts?.body) {
          root.style.setProperty(
            "--font-body",
            `"${payload.theme.fonts.body}", sans-serif`,
          );
        }

        // Actualizar título y favicon de la pestaña
        document.title = payload.tenant.name;
        if (payload.theme.faviconUrl) {
          const link = document.querySelector("link[rel~='icon']");
          if (link) link.href = payload.theme.faviconUrl;
        }
      } catch (err) {
        if (!isMounted) return;
        setError(
          err.response?.data?.message ||
            "No se pudo cargar la información del club",
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBootstrap();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  return (
    <TenantContext.Provider
      value={{
        tenant: tenantData?.tenant || null,
        theme: tenantData?.theme || null,
        flags: tenantData?.flags || {},
        contact: tenantData?.contact || {},
        loading,
        error,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);
