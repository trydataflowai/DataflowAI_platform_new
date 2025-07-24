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
  const [success, setSuccess]           = useState(false);

  useEffect(() => {
    createPaymentIntent({ id_empresa, id_plan })
      .then(data => setClientSecret(data.clientSecret))
      .catch(err => setError(err.detail || 'Error processing payment'));
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
        setSuccess(true);
      } catch (err) {
        setError('Payment was successful but we couldn\'t create your account. Please try again later.');
      } finally {
        setProcessing(false);
      }
    } else {
      setError('Payment was not completed. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className={styles.voidContainer}>
      <div className={styles.cosmosCard}>
        <div className={styles.cardHalo}></div>
        
        {success ? (
          <div className={styles.quantumSuccess}>
            <div className={styles.successOrbit}>
              <div className={styles.successCore}></div>
              <svg className={styles.successCheck} viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className={styles.successTitle}>Quantum Payment Confirmed</h2>
            <p className={styles.successMessage}>Your transaction is secured in the blockchain</p>
            <button 
              onClick={() => navigate('/login')} 
              className={styles.neonButton}
            >
              Access Quantum Dashboard
              <span className={styles.buttonGlow}></span>
            </button>
          </div>
        ) : (
          <>
            <div className={styles.cardHeader}>
              <div className={styles.cardLogo}>NEXUS</div>
              <h1 className={styles.cardTitle}>Secure Quantum Payment</h1>
              <p className={styles.cardSubtitle}>Enter your credentials below</p>
            </div>
            
            {error && (
              <div className={styles.errorPulse}>
                <svg className={styles.errorIcon} viewBox="0 0 24 24">
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {error}
              </div>
            )}
            
            {!clientSecret ? (
              <div className={styles.loadingQuantum}>
                <div className={styles.quantumLoader}>
                  <div className={styles.quantumDot}></div>
                  <div className={styles.quantumDot}></div>
                  <div className={styles.quantumDot}></div>
                </div>
                <p>Initializing quantum encryption...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.quantumForm}>
                <div className={styles.inputField}>
                  <label>Card Information</label>
                  <div className={styles.cardMatrix}>
                    <CardElement 
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#e0e0e0',
                            '::placeholder': {
                              color: '#6b7280',
                            },
                            iconColor: '#3b82f6',
                          },
                          invalid: {
                            color: '#ef4444',
                            iconColor: '#ef4444',
                          },
                        },
                      }}
                    />
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  disabled={!stripe || processing}
                  className={styles.neonButton}
                >
                  {processing ? (
                    <>
                      <span className={styles.buttonSpinner}></span>
                      Processing Quantum Transaction
                    </>
                  ) : (
                    <>
                      Confirm Payment - $99.00
                      <span className={styles.buttonGlow}></span>
                    </>
                  )}
                </button>
                
                <div className={styles.securityShield}>
                  <svg className={styles.shieldIcon} viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                  <span>256-bit Quantum Encryption</span>
                </div>
              </form>
            )}
          </>
        )}
      </div>
      
      <div className={styles.cyberFooter}>
        <p>© 2023 QUANTUM PAYMENTS SYSTEM | All rights reserved</p>
      </div>
    </div>
  );
};

const PagosStripe = () => (
  <Elements stripe={stripePromise}>
    <CheckoutForm />
  </Elements>
);

export default PagosStripe;