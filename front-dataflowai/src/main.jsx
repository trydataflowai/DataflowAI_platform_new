import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ThemeProvider } from './components/componentes/ThemeContext';
import { CompanyStylesProvider } from './components/componentes/ThemeContextEmpresa';

// Orden recomendado:
// 1) CompanyStylesProvider (carga los CSS específicos de la empresa y bloquea hasta listo)
// 2) ThemeProvider (mantiene tema)
// 3) App

createRoot(document.getElementById('root')).render(
  <CompanyStylesProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </CompanyStylesProvider>
);
