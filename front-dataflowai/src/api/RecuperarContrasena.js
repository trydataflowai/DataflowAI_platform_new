const API_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const parseErrorMessage = async (res, fallback) => {
  try {
    const data = await res.json();
    if (typeof data?.error === 'string' && data.error.trim()) return data.error;
    if (typeof data?.message === 'string' && data.message.trim()) return data.message;
    return fallback;
  } catch {
    return fallback;
  }
};

export const solicitarCodigoRecuperacion = async ({ correo }) => {
  const res = await fetch(`${API_URL}/password-recovery/request-code/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo }),
  });

  if (!res.ok) {
    const message = await parseErrorMessage(res, 'No se pudo enviar el codigo de recuperacion.');
    throw new Error(message);
  }
  return await res.json();
};

export const confirmarRecuperacionContrasena = async ({
  correo,
  codigo,
  contrasena_nueva,
  contrasena_nueva_confirmacion,
}) => {
  const res = await fetch(`${API_URL}/password-recovery/confirm/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correo,
      codigo,
      contrasena_nueva,
      contrasena_nueva_confirmacion,
    }),
  });

  if (!res.ok) {
    const message = await parseErrorMessage(res, 'No se pudo cambiar la contraseña.');
    throw new Error(message);
  }
  return await res.json();
};
