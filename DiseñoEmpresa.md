DAME EL JSX

modifica los colores azul es LinkedIn por este color, dame el css completo

#00b43f

Tengo esta api

C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\api\Usuario.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

{
  "id": 1,
  "nombres": "Julian",
  "correo": "herrenojulian@coltrade.com.co",
  "rol": "Administrador",
  "empresa": {
    "id": 1,
    "nombre": "Colombian Trade Company Sas",
    "nombre_corto": "Coltrade",
    "direccion": "7200 NW 84th Ave, Medley, FL 33166, Estados Unidos",
    "fecha_registro": "2025-08-19",
    "telefono": "3025830404",
    "ciudad": "Miami",
    "pais": "Colombia",
    "categoria": {
      "id": 1,
      "descripcion": "Tecnología"
    },
    "plan": {
      "id": 3,
      "tipo": "Premium anual"
    },
    "estado": {
      "id": 1,
      "nombre": "Activo"
    }
  },
  "productos": [
    {
      "id_producto": 7,
      "producto": "Tmk e Ecommerce",
      "slug": "tmk-e-ecommerce",
      "iframe": "<if"
    },
    {
      "id_producto": 8,
      "producto": "Ventas Falabella",
      "slug": "ventas-falabella",
      "iframe": "<if"
    },

como ves tiene este campo llamado ID q es el id de la emre

  "empresa": {
    "id": 1,
    "nombre": "Colombian Trade Company Sas",

q quiero hacer como ve tengo estas carpetas

PS C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\styles\empresas> ls

    Directorio: C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\styles\empresas

Mode                 LastWriteTime         Length Name

---

dar--l       4/11/2025  8:24 a. m.                1
d-----       4/11/2025  8:24 a. m.                2
d-----       4/11/2025  8:24 a. m.                3

entonces eh, ejemplo hay la carpeta llamada 1 y es donde tengo los estilo de la empresa pue con id uno, ósea relaciono la carpeta con el ID y el nombre de la carpeta

ahora dentro de esa carpeta hay

esto, esto es con una empresa de ID  3

PS C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\styles\empresas\3> ls

    Directorio: C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\styles\empresas\3

Mode                 LastWriteTime         Length Name

---

-a---l       4/11/2025  8:28 a. m.           7763 **AsignarDashboard.module.css**

PS C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\styles\empresas\3>

lo q quiero es que pase los siguiente

cuando en
"plan": {
      "id": 3,
      "tipo": "Premium anual"

sea 6 o 3 use los estilos que están dentro de esta carpeta

PS C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\styles\empresas\3>

y sino use los estilos que ya importe el JSX ósea este :

**C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\styles\Profile\AsignarDashboard.module.css**

ejemplo

Inegreso con un una empresa que tiene en su plan 3 y ella es id 3 ósea la empresa y como ves tiene este archivo dentro de sus carpetas de css

**C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\styles\empresas\3\AsignarDashboard.module.css**

pero también existe este

**C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\styles\Profile\AsignarDashboard.module.css**

entonces debería usar el de las carpetas de empresa

ahora por ejemplo inicia sesión alguien con id plan 3 pero el es ID 5 y ejemplo no esta dentro de las carpetas pues usaría este css

**C:\Users\Julian Herreño\OneDrive - Colombian Trade Company SAS\DATA\02. AREAS\DATA\Julian Estif Herreno Palacios\09-DataFlow-WebSite\front-dataflowai\src\styles\Profile\AsignarDashboard.module.cs**s

a lo q quiero llegar es q siempre se usará este nombre **AsignarDashboard.module.css** pero lo único q cambia son las rutas dependiendo el ID de la empresa y el ID del plan y si estyá creado,
ahora ayúdame implementando eso en este JSX
