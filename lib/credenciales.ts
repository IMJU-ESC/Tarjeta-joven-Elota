const CARACTERES_SEGUROS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generarCadenaSegura = (longitud: number) => {
  const valores = new Uint32Array(longitud);
  globalThis.crypto.getRandomValues(valores);

  return Array.from(
    valores,
    (valor) => CARACTERES_SEGUROS[valor % CARACTERES_SEGUROS.length],
  ).join("");
};

export const normalizarCorreo = (correo: string) => correo.trim().toLowerCase();

export const generarContrasenaJoven = () =>
  `IMJU-${generarCadenaSegura(8)}`;

export const generarContrasenaNegocio = () =>
  `ALIADO-${generarCadenaSegura(8)}`;

// El QR nunca debe ser igual a la contraseña del joven.
export const generarCodigoQrJoven = () =>
  `TJE-${globalThis.crypto.randomUUID().replaceAll("-", "").toUpperCase()}`;
