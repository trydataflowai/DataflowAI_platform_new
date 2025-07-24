import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

import { createPaymentIntent, stripePromise } from '../../api/PagosStripe';
import { crearUsuario } from '../../api/CrearUsuario';
import styles from '../../styles/PagosStripe.module.css';

const CheckoutForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const id_empresa = Number(searchParams.get('id_empresa'));
  const id_plan    = Number(searchParams.get('id_plan'));

  const [clientSecret, setClientSecret] = useState('');
  const [error, setError]               = useState('');
  const [processing, setProcessing]     = useState(false);
  const [success, setSuccess]           = useState(false);  // 🟢 nuevo estado

  useEffect(() => {
    createPaymentIntent({ id_empresa, id_plan })
      .then(data => setClientSecret(data.clientSecret))
      .catch(err => setError(err.detail || 'Error al iniciar el pago'));
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
      try {
        const pending = JSON.parse(localStorage.getItem('pendingUser') || '{}');
        await crearUsuario({ ...pending, id_empresa });
        localStorage.removeItem('pendingUser');
        setSuccess(true); // 🟢 Mostrar mensaje de éxito
      } catch (err) {
        setError('El pago fue exitoso, pero no se pudo crear el usuario. Intenta más tarde.');
      } finally {
        setProcessing(false);
      }
    } else {
      setError('No se ha realizado el pago, intenta más tarde.');
      setProcessing(false);
    }
  };

  return (
    <div className={styles.container}>
      {success ? (
        <div className={styles.successBox}>
          <h2>✅ Pago realizado con éxito</h2>
          <p>Gracias por tu compra. ¿Deseas iniciar sesión ahora?</p>
          <button onClick={() => navigate('/login')} className={styles.loginButton}>
            Ir a login
          </button>
        </div>
      ) : (
        <>
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
        </>
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
