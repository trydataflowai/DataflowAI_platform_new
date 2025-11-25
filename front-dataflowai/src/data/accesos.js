// permissions.js
// 🔥 Empresa → Items del menú que NO deben verse
// Usa exactamente estos labels:
// "Dashboards", "Tools", "Profile", "Marketplace", "Support", "AI Insights", "FormBuilder"

const permissions = {
  // EJEMPLO:
  // La empresa 2 NO puede ver FormBuilder
  "2": ["FormBuilder", "Tools"]

  // Agrega más si quieres:
  // "5": ["Marketplace", "AI Insights"],
  // "10": ["FormBuilder", "Tools"]
};

export function getHiddenItemsFor(companyId) {
  return permissions[String(companyId)] || [];
}

export default permissions;
