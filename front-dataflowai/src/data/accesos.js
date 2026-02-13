// permissions.js
// 🔥 Empresa → Items del menú que NO deben verse
// Usa exactamente estos labels:
// "Dashboards", "Tools", "Profile", "Marketplace", "Support", "AI Insights", "FormBuilder"

const permissions = {
  "1": ["Perfil", "Crm", "Pagos"],
  "2": ["FormBuilder", "Tools", "Perfil", "Crm", "Pagos"],
  "3": ["Perfil", "Crm", "Pagos"],
  "4": ["Tools", "Perfil", "Crm"],

  // Empresa 5 NO ve nada del menú principal
  "5": [
    "Dashboards",
    "Tools",
    "Profile",
    "Marketplace",
    "Support",
    "AI Insights",
    "FormBuilder"
  ]
};

export function getHiddenItemsFor(companyId) {
  return permissions[String(companyId)] || [];
}

export default permissions;
