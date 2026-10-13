export type EscalaVisual = "90" | "100" | "110";
export type TemaVisual = "claro" | "oscuro";

const CLAVE_ESCALA = "veterinaria-escala-visual";
const CLAVE_TEMA = "veterinaria-tema-visual";

export function obtenerEscalaVisual(): EscalaVisual {
  const guardada = localStorage.getItem(CLAVE_ESCALA);

  if (guardada === "90" || guardada === "110") {
    return guardada;
  }

  return "100";
}

export function aplicarEscalaVisual(escala: EscalaVisual): void {
  document.documentElement.style.zoom = `${Number(escala) / 100}`;
  localStorage.setItem(CLAVE_ESCALA, escala);
}

export function obtenerTemaVisual(): TemaVisual {
  return localStorage.getItem(CLAVE_TEMA) === "oscuro" ? "oscuro" : "claro";
}


export function aplicarTemaVisual(tema: TemaVisual): void {
  document.documentElement.dataset.theme =
    tema === "oscuro" ? "dark" : "light";

  localStorage.setItem(CLAVE_TEMA, tema);
}