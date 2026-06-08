/**
 * Helper para el manejo y parseo de candidatos con metadatos extendidos.
 * Codifica y decodifica la información en formato JSON dentro del campo `nombre` en la Blockchain.
 */

/**
 * Genera un Data URI SVG dinámico como avatar con las iniciales del candidato y el color del partido de fondo.
 */
export const getDynamicAvatar = (nombre, apellido, colorPartido) => {
  const n = (nombre || "").trim();
  const a = (apellido || "").trim();
  let iniciales = "?";
  if (n && a) {
    iniciales = (n[0] + a[0]).toUpperCase();
  } else if (n) {
    iniciales = n.slice(0, 2).toUpperCase();
  } else if (a) {
    iniciales = a.slice(0, 2).toUpperCase();
  }

  const color = colorPartido || "#1d4ed8";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="grad-${iniciales}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:0.85" />
          <stop offset="100%" style="stop-color:${color};stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#grad-${iniciales})" stroke="#ffffff" stroke-width="2.5" />
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="'Outfit', 'Inter', sans-serif" font-size="36" font-weight="900" letter-spacing="0.5">
        ${iniciales}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/**
 * Lista de avatares ficticios oficiales listos para usar en pruebas.
 */
export const PRESET_AVATARS = [
  {
    id: "avatar-m1",
    label: "Perfil Masculino 1",
    url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256&h=256"
  },
  {
    id: "avatar-f1",
    label: "Perfil Femenino 1",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256&h=256"
  },
  {
    id: "avatar-m2",
    label: "Perfil Masculino 2",
    url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=256&h=256"
  },
  {
    id: "avatar-f2",
    label: "Perfil Femenino 2",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256"
  }
];

/**
 * Paleta de colores predefinidos sugeridos para partidos políticos.
 */
export const PRESET_COLORS = [
  { hex: "#1d4ed8", label: "Azul Democrático" },
  { hex: "#dc2626", label: "Rojo Solidario" },
  { hex: "#16a34a", label: "Verde Ecologista" },
  { hex: "#eab308", label: "Amarillo Libertad" },
  { hex: "#f97316", label: "Naranja Federal" },
  { hex: "#7c3aed", label: "Violeta Renovador" },
  { hex: "#2563eb", label: "Celeste Republicano" },
  { hex: "#475569", label: "Gris Independiente" }
];

/**
 * Serializa los atributos del candidato a una cadena JSON para guardarlo en la Blockchain.
 */
export const serializeCandidato = ({ nombre, apellido, partido, color, foto }) => {
  return JSON.stringify({
    nombre: (nombre || "").trim(),
    apellido: (apellido || "").trim(),
    partido: (partido || "Independiente").trim(),
    color: color || "#1d4ed8",
    foto: (foto || "").trim()
  });
};

/**
 * Deserializa la cadena del candidato proveniente de la Blockchain de forma segura.
 * Aplica fallback elegante si no está en formato JSON.
 */
export const parseCandidato = (cand) => {
  const rawNombre = cand.nombre || "";
  let nombre = rawNombre;
  let apellido = "";
  let partido = "Independiente";
  let color = "#1d4ed8";
  let foto = "";

  const trimmed = rawNombre.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      nombre = parsed.nombre || "";
      apellido = parsed.apellido || "";
      partido = parsed.partido || "Independiente";
      color = parsed.color || "#1d4ed8";
      foto = parsed.foto || "";
    } catch (e) {
      console.warn("Fallo al decodificar JSON del candidato ID:", cand.id, e);
    }
  }

  // Generamos el avatar si no tiene foto cargada
  const finalFoto = foto ? foto : getDynamicAvatar(nombre, apellido, color);

  return {
    id: Number(cand.id),
    nombre,
    apellido,
    partido,
    color,
    foto: finalFoto,
    hasCustomFoto: !!foto,
    votos: Number(cand.votos)
  };
};
