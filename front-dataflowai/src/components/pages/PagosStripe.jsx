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
    <div className={styles.premiumContainer}>
      <div className={styles.premiumCard}>
        <div className={styles.cardGlow}></div>
        
        {success ? (
          <div className={styles.successContainer}>
            <div className={styles.successAnimation}>
              <svg className={styles.checkmark} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none"/>
                <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
            <h2 className={styles.successTitle}>Payment Processed</h2>
            <p className={styles.successMessage}>Your transaction has been completed successfully. Welcome to our premium service.</p>
            <div className={styles.buttonGroup}>
              <button onClick={() => navigate('/login')} className={`${styles.premiumButton} ${styles.primary}`}>
                Access Dashboard
              </button>
              <button className={`${styles.premiumButton} ${styles.secondary}`}>
                View Receipt
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.premiumHeader}>
              <div className={styles.logo}>PREMIUM</div>
              <h1 className={styles.premiumTitle}>Secure Transaction</h1>
              <p className={styles.premiumSubtitle}>Enter your payment details below</p>
            </div>
            
            {error && <div className={styles.premiumError}>{error}</div>}
            
            {!clientSecret ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingAnimation}>
                  <div className={styles.loadingBar}></div>
                </div>
                <p className={styles.loadingText}>Initializing secure connection...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.premiumForm}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Card Information</label>
                  <div className={styles.cardElementWrapper}>
                    <CardElement 
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#ffffff',
                            '::placeholder': {
                              color: '#6b7280',
                            },
                            iconColor: '#9ca3af',
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
                  className={`${styles.premiumButton} ${styles.primary} ${processing ? styles.processing : ''}`}
                >
                  {processing ? (
                    <>
                      <span className={styles.spinner}></span>
                      Authorizing Payment
                    </>
                  ) : (
                    'Complete Transaction — $99.00'
                  )}
                </button>
                
                <div className={styles.securityAssurance}>
                  <div className={styles.securityBadge}>
                    <svg className={styles.lockIcon} viewBox="0 0 24 24">
                      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v2h8z"/>
                    </svg>
                    <span>256-bit SSL Encryption Stripe Pay</span>
                  </div>
                </div>
              </form>
            )}
          </>
        )}
      </div>
      
      <div className={styles.footerNote}>
        <p>© 2023 DATAFLOW AI. All transactions are secured and encrypted.</p>
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