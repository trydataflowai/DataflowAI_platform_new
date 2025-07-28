import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

import { createPaymentIntent, stripePromise } from '../../api/PagosStripe';
import { crearUsuario, fetchPlanes } from '../../api/CrearUsuario';
import styles from '../../styles/PagosStripe.module.css';
import logo from '../../assets/Dataflow AI logo ajustado blanco.png';

const CheckoutForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const id_empresa = Number(searchParams.get('id_empresa'));
  const id_plan = Number(searchParams.get('id_plan'));

  const [clientSecret, setClientSecret] = useState('');
  const [planValor, setPlanValor] = useState('');
  const [planName, setPlanName] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    createPaymentIntent({ id_empresa, id_plan })
      .then(data => setClientSecret(data.clientSecret))
      .catch(err => setError(err.detail || 'Error initializing payment'));
  }, [id_empresa, id_plan]);

  useEffect(() => {
    fetchPlanes()
      .then(pls => {
        const plan = pls.find(p => p.id_plan === id_plan);
        if (plan) {
          setPlanValor(plan.valor_plan);
          setPlanName(plan.nombre_plan);
        }
      })
      .catch(() => {});
  }, [id_plan]);

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
      } catch {
        setError('Payment succeeded, but the user could not be created. Please try again later.');
      } finally {
        setProcessing(false);
      }
    } else {
      setError('Payment was not completed, please try again later.');
      setProcessing(false);
    }
  };

  return (
    <div className={styles.paymentContainer}>
      <div className={styles.glowEffect}></div>
      
      <div className={styles.paymentWrapper}>
        <div className={styles.brandHeader}>
          <img src={logo} alt="DataflowAI Logo" className={styles.logo} />
          <div className={styles.brandText}>
            <h1 className={styles.brandTitle}>DATAFLOW<span className={styles.brandHighlight}>AI</span></h1>
            <p className={styles.brandTagline}>Intelligent Data Solutions</p>
          </div>
        </div>
        
        <div className={styles.paymentCard}>
          <div className={styles.cardGlow}></div>
          
          {success ? (
            <div className={styles.successContainer}>
              <div className={styles.successAnimation}>
                <div className={styles.checkmark}>✓</div>
                <div className={styles.circlePulse}></div>
              </div>
              <h2 className={styles.successTitle}>Payment Processed Successfully</h2>
              <p className={styles.successMessage}>
                Your <span className={styles.planHighlight}>{planName}</span> subscription is now active. 
                You'll receive a confirmation email with access details.
              </p>
              
              <div className={styles.securityBadges}>
                <div className={styles.badge}>
                  <span className={styles.badgeIcon}>🔐</span>
                  <span>256-bit Encryption</span>
                </div>
                <div className={styles.badge}>
                  <span className={styles.badgeIcon}>🛡️</span>
                  <span>PCI DSS Compliant</span>
                </div>
              </div>
              
              <button 
                onClick={() => navigate('/login')} 
                className={styles.loginButton}
              >
                Access Your Dashboard
                <span className={styles.arrowIcon}>→</span>
              </button>
            </div>
          ) : (
            <>
              <div className={styles.paymentHeader}>
                <h2 className={styles.paymentTitle}>Secure Payment</h2>
                <p className={styles.paymentSubtitle}>
                  Complete your subscription to unlock the full potential of DataflowAI's analytics platform
                </p>
              </div>

              {error && (
                <div className={styles.errorMessage}>
                  <div className={styles.errorIcon}>!</div>
                  <div>{error}</div>
                </div>
              )}

              {!clientSecret ? (
                <div className={styles.loadingState}>
                  <div className={styles.loadingAnimation}>
                    <div className={styles.loadingDot}></div>
                    <div className={styles.loadingDot}></div>
                    <div className={styles.loadingDot}></div>
                  </div>
                  <p>Initializing secure payment gateway...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={styles.paymentForm}>
                  <div className={styles.planSummary}>
                    <div className={styles.planDetails}>
                      <h3 className={styles.planName}>{planName} Plan</h3>
                      <p className={styles.planDescription}>Full access to all features</p>
                    </div>
                    <div className={styles.planPrice}>
                      <span className={styles.priceCurrency}>$</span>
                      <span className={styles.priceAmount}>{planValor}</span>
                      <span className={styles.priceFrequency}>/month</span>
                    </div>
                  </div>

                  <div className={styles.cardSection}>
                    <div className={styles.sectionHeader}>
                      <h3 className={styles.sectionTitle}>Payment Information</h3>
                      <div className={styles.cardIcons}>
                        <span className={styles.cardIcon}>💳</span>
                        <span className={styles.cardIcon}>🔒</span>
                      </div>
                    </div>
                    
                    <div className={styles.cardElementWrapper}>
                      <CardElement 
                        options={{
                          style: {
                            base: {
                              fontSize: '16px',
                              color: '#ffffff',
                              '::placeholder': {
                                color: 'rgba(255, 255, 255, 0.3)',
                              },
                              iconColor: '#00c7ff',
                            },
                            invalid: {
                              color: '#ff6b6b',
                            },
                          },
                        }}
                        className={styles.cardElement}
                      />
                    </div>
                  </div>

                  <div className={styles.paymentFooter}>
                    <div className={styles.securityAssurance}>
                      <span className={styles.lockIcon}>🔒</span>
                      <span>Secured by Stripe • 256-bit SSL</span>
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={!stripe || processing}
                      className={styles.payButton}
                    >
                      {processing ? (
                        <>
                          <span className={styles.buttonSpinner}></span>
                          Processing Payment
                        </>
                      ) : (
                        <>
                          <span className={styles.buttonIcon}>→</span>
                          Confirm Payment of ${planValor}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      <div className={styles.featuresGrid}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🚀</div>
          <h3>Instant Setup</h3>
          <p>Get started immediately after payment with no configuration needed</p>
        </div>
        
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>📊</div>
          <h3>Advanced Analytics</h3>
          <p>Unlock powerful data visualization and processing tools</p>
        </div>
        
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🔄</div>
          <h3>Flexible Scaling</h3>
          <p>Easily upgrade or modify your plan as your needs change</p>
        </div>
      </div>
    </div>
  );
};

const PagosStripe = () => (
  <Elements stripe={stripePromise}>
    <CheckoutForm />
  </Elements>
);//xd

export default PagosStripe;