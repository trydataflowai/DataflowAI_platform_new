// front-dataflowai/src/api/PagosStripe.js

const API_BASE_URL = 'http://127.0.0.1:8000/api/';

export async function createPaymentIntent({ id_empresa, id_plan }) {
  const res = await fetch(`${API_BASE_URL}create-payment-intent/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_empresa, id_plan }),
  });
  if (!res.ok) throw await res.json();
  return res.json();  // { clientSecret }
}
