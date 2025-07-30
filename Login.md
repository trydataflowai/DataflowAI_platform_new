**En mi pagina las personas pueden hacer LOGIN y eso tiene un token**
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const iniciarSesion = async ({ correo, contrasena }) => {
  try {
    const response = await fetch(`${API_BASE_URL}login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ correo, contrasena }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al iniciar sesión');
    }

    // Puedes guardar el token si quieres:
    localStorage.setItem('token', data.token);

    return data; // contiene token + usuario
  } catch (error) {
    throw new Error(error.message || 'Error de red');
  }
};

export const cerrarSesion = () => {
  localStorage.removeItem('token');
};


**y aparte tengo esta:** 

**C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\api\Usuario.js**

ENV: VITE_API_BASE_URL=http://127.0.0.1:8000/api/
http://localhost:8000/api/usuario/info/

que tiene esta const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const obtenerInfoUsuario = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}usuario/info/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('No se pudo obtener la información del usuario');
  }

  return await response.json();
};


**que retorna este JSON**
{
  "id": 56,
  "nombres": "Celulares",
  "correo": "celulares@gmail.com",
  "rol": "Administrador",
  "empresa": {
    "id": 59,
    "nombre": "CelularesSas",
    "direccion": "Calle 74 #87c 90 sur",
    "fecha_registro": "2025-07-29",
    "telefono": "3027760395",
    "ciudad": "Bogotá",
    "pais": "CO",
    "categoria": {
      "id": 1,
      "descripcion": "Tecnología"
    },
    "plan": {
      "id": 4,
      "tipo": "Basic mensual"
    },
    "estado": {
      "id": 1,
      "nombre": "Activo"
    }
  },
  "productos": [
    {
      "id_producto": 4,
      "producto": "Dashboard Ventas",
      "slug": "dashboard-ventas",
      "iframe": "<iframe title=\"Informe de Ventas Claro PDV_2\" width=\"1140\" height=\"541.25\" src=\"https://app.powerbi.com/reportEmbed?reportId=de2cde57-2751-4da4-9958-2d07779946a9&autoAuth=true&ctid=2ff22c76-1647-48cc-81ae-36b57a4a192b\" frameborder=\"0\" allowFullScreen=\"true\">`</iframe>`"
    }
  ]
}}
