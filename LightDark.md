1. **Colores del dark:

   Quiero que remplaces los colores dark por estos

   .dark {
   --black-deep: #0a0a12;
   --black-cosmos: #12121d;
   --accent-neon: #00c7ff;
   --accent-dark: #0077b6;
   --text-primary: #ffffff;
   --text-secondary: #b8c2d9;
   --transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
   }

   Fallback forzaba `dark` mientras llegaban datos asíncronos.**

   En `ConfiguracionUsuarios.jsx` el `variantClass` original usaba `planId` para decidir la clase y,  *cuando `planId` era `null` al inicio* , el componente devolvía por defecto `styles.PerfilgeneralDark`. Eso hacía que la página  **se renderizara inmediatamente en oscuro** , y cuando la llamada asíncrona terminaba y `planId` cambiaba, React re-renderizaba y allí aparecía la versión `light`. Ese re-render es lo que causaba el destello (dark → light), especialmente visible si la página tiene transiciones o animaciones.
2. **Orden de inicialización del tema + paint.**

   Si el tema no se aplica *antes* del primer paint (por ejemplo si dependes solo de React para poner `data-theme`), la página podría pintar con estilos por defecto y luego cambiar. Las animaciones/transiciones hacen que ese cambio sea visible como un “parpadeo”.

Qué arregló la solución que aplicamos:

* **No forzar `dark` como fallback:** ahora `variantClass` usa `theme` directamente (`theme === 'dark' ? PerfilgeneralDark : PerfilgeneralLight`) en el primer render, así nunca se impone `dark` por ausencia de `planId`.
* **Aplicación temprana del tema:** el script que añadimos en `index.html` lee `localStorage` y/o la preferencia del sistema y aplica `data-theme` *antes* de que React se cargue, evitando el FOUC.
* **`useLayoutEffect` en el `ThemeContext`:** aplica el `data-theme` de forma síncrona antes del paint cuando React monta o cambia el tema, lo que evita parpadeos al navegar.
* **(Opcional) `data-theme-ready`:** marcamos el documento como “theme ready” para que puedas condicionar transiciones en CSS hasta que el tema esté listo (evita transiciones visuales indeseadas).

## ✅ **PROMPT CORTO PARA COPIAR Y PEGAR A UNA IA**

*(arreglar JSX según ThemeContext)*

Arregla este componente JSX para que el modo oscuro/claro dependa **solo** de mi `ThemeContext` (uso `theme === "dark"` o `"light"`).
No debe haber parpadeo de colores al navegar entre páginas.
El componente **no debe depender de planId, data, ni cargas dinámicas para determinar el tema**.
Debes aplicar las clases así:

```
js
const variantClass = theme === "dark"
  ? (styles?.NombreDark || defaultStyles.NombreDark)
  : (styles?.NombreLight || defaultStyles.NombreLight);
```

Si algún CSS dinámico no trae clases, usa los fallback defaults.

Reemplaza toda la lógica antigua de dark/light y deja solo esta basada en ThemeContext.
Devuélveme el JSX completo, limpio, funcionando y sin explicaciones.

Aquí está mi componente a corregir:

```
dame el jsx completo
```
