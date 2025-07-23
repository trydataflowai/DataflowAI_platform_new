// front-dataflowai/src/components/pages/PagosStripe.jsx

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { createPaymentIntent } from '../../api/PagosStripe';
import { crearUsuario } from '../../api/CrearUsuario';
import styles from '../../styles/PagosStripe.module.css';

const stripePromise = loadStripe('tu_stripe_publishable_key');

const CheckoutForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const id_empresa = Number(searchParams.get('id_empresa'));
  const id_plan = Number(searchParams.get('id_plan'));
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    createPaymentIntent({ id_empresa, id_plan })
      .then(data => setClientSecret(data.clientSecret))
      .catch(err => setError(err.detail || 'Error al iniciar pago'));
  }, [id_empresa, id_plan]);

  const handleSubmit = async e => {
    e.preventDefault();
    setProcessing(true);
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) }
    });

    if (stripeError) {
      setError(stripeError.message);
      setProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      // 1) Crear el usuario guardado en localStorage
      const pending = JSON.parse(localStorage.getItem('pendingUser') || '{}');
      await crearUsuario({ ...pending, id_empresa });

      // 2) Limpiar el storage
      localStorage.removeItem('pendingUser');

      // 3) Mostrar mensaje y redirigir
      navigate('/dashboard');  // o donde quieras
    }
  };

  return (
    <div className={styles.container}>
      <h1>Completa tu pago</h1>
      {error && <div className={styles.error}>{error}</div>}
      {!clientSecret ? (
        <p>Cargando pasarela…</p>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <CardElement className={styles.cardElement} />
          <button type="submit" disabled={!stripe || processing}>
            {processing ? 'Procesando…' : 'Pagar'}
          </button>
        </form>
      )}
    </div>
  );
};

const PagosStripe = () => (
  <Elements stripe={stripePromise}>
    <CheckoutForm />
  </Elements>
);

export default PagosStripe;
