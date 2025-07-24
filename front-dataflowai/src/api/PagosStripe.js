// front-dataflowai/src/api/PagosStripe.js

// ——> Importa loadStripe desde stripe-js
import { loadStripe } from '@stripe/stripe-js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// Crea aquí tu stripePromise para poder reutilizarlo
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export async function createPaymentIntent({ id_empresa, id_plan }) {
  const res = await fetch(`${API_BASE_URL}create-payment-intent/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_empresa, id_plan }),
  });
  if (!res.ok) throw await res.json();
  return res.json();  // { clientSecret }
}
