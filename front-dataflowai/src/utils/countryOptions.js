const FALLBACK_COUNTRIES = [
  "Alemania",
  "Argentina",
  "Australia",
  "Bolivia",
  "Brasil",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Corea del Sur",
  "Costa Rica",
  "Ecuador",
  "El Salvador",
  "Espana",
  "Estados Unidos",
  "Francia",
  "Guatemala",
  "Honduras",
  "India",
  "Italia",
  "Japon",
  "Mexico",
  "Nicaragua",
  "Panama",
  "Paraguay",
  "Peru",
  "Reino Unido",
  "Republica Dominicana",
  "Uruguay",
  "Venezuela",
];

function getCountryOptions() {
  try {
    if (typeof Intl === "undefined" || typeof Intl.DisplayNames !== "function") {
      return FALLBACK_COUNTRIES;
    }

    const display = new Intl.DisplayNames(["es"], { type: "region" });
    const codes = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("region") : [];

    const countries = codes
      .filter((code) => /^[A-Z]{2}$/.test(code))
      .map((code) => display.of(code))
      .filter(Boolean);

    if (!countries.length) return FALLBACK_COUNTRIES;

    return Array.from(new Set(countries)).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
  } catch (err) {
    return FALLBACK_COUNTRIES;
  }
}

export const COUNTRY_OPTIONS = getCountryOptions();

