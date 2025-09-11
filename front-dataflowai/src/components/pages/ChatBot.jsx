import React, { useState, useEffect } from 'react';

const Chatbot = () => {
  const [dots, setDots] = useState('');
  const [particles, setParticles] = useState([]);

  // Animación de puntos suspensivos
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Generar partículas animadas
  useEffect(() => {
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 15 + 10,
      delay: Math.random() * 5
    }));
    setParticles(newParticles);
  }, []);

  const chatMessages = [
    { type: 'bot', message: 'Hola! 👋 Soy tu asistente virtual' },
    { type: 'user', message: 'Hola, necesito ayuda con mi cuenta' },
    { type: 'bot', message: 'Por supuesto! Te ayudo con eso...' }
  ];

  return (
    <div style={{
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      background: '#000000',
      color: '#ffffff',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Partículas de fondo */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 1
      }}>
        {particles.map((particle) => (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              background: '#00f7ff',
              borderRadius: '50%',
              opacity: 0,
              bottom: '-10px',
              left: `${particle.x}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `particleRise ${particle.speed}s linear infinite`,
              animationDelay: `${particle.delay}s`,
              filter: 'blur(1px)'
            }}
          />
        ))}
      </div>

      {/* Contenedor principal */}
      <div style={{
        display: 'flex',
        height: '100vh',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Panel izquierdo - Lista de chats */}
        <div style={{
          width: '320px',
          background: 'linear-gradient(135deg, #050505 0%, #0a0a0a 100%)',
          borderRight: '1px solid rgba(0, 247, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '20px',
            borderBottom: '1px solid rgba(0, 247, 255, 0.1)'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '1.4rem',
              background: 'linear-gradient(90deg, #00f7ff, #00c2ff)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              fontWeight: '700'
            }}>
              ChatBot AI
            </h2>
            <p style={{
              margin: '8px 0 0 0',
              color: '#cccccc',
              fontSize: '0.9rem'
            }}>
              Asistente Virtual Inteligente
            </p>
          </div>

          {/* Botón nuevo chat */}
          <div style={{ padding: '20px' }}>
            <button style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #00f7ff, #00c2ff)',
              border: 'none',
              borderRadius: '8px',
              color: '#0a0a0a',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              fontSize: '0.95rem'
            }}>
              + Nuevo Chat
            </button>
          </div>

          {/* Lista de chats anteriores */}
          <div style={{
            flex: 1,
            padding: '0 20px',
            overflowY: 'auto'
          }}>
            {['Consulta sobre facturación', 'Problema técnico', 'Información de productos', 'Soporte general'].map((chat, index) => (
              <div key={index} style={{
                padding: '12px 16px',
                marginBottom: '8px',
                background: 'rgba(0, 247, 255, 0.05)',
                border: '1px solid rgba(0, 247, 255, 0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '0.9rem',
                color: '#cccccc'
              }}>
                {chat}
              </div>
            ))}
          </div>
        </div>

        {/* Panel principal - Chat */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#000000'
        }}>
          {/* Header del chat */}
          <div style={{
            padding: '20px 30px',
            borderBottom: '1px solid rgba(0, 247, 255, 0.1)',
            background: 'rgba(5, 5, 5, 0.8)',
            backdropFilter: 'blur(15px)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(0,247,255,0.2), rgba(0,194,255,0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(0,247,255,0.3)'
              }}>
                🤖
              </div>
              <div>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.2rem',
                  color: '#ffffff'
                }}>
                  Asistente Virtual
                </h3>
                <p style={{
                  margin: '4px 0 0 0',
                  color: '#00ffaa',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#00ffaa',
                    animation: 'pulse 2s infinite'
                  }}></span>
                  En línea
                </p>
              </div>
            </div>
          </div>

          {/* Área de mensajes */}
          <div style={{
            flex: 1,
            padding: '30px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}>
            {/* Overlay de construcción */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3), rgba(0,0,0,0.7))',
              backdropFilter: 'blur(10px)',
              zIndex: 10
            }}>
              {/* Icono principal */}
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(0,247,255,0.15), rgba(0,194,255,0.08))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '30px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 30px rgba(0,247,255,0.1) inset',
                border: '2px solid rgba(0,247,255,0.2)',
                animation: 'float 3s ease-in-out infinite'
              }}>
                <div style={{
                  fontSize: '60px',
                  filter: 'drop-shadow(0 0 20px rgba(0,247,255,0.3))',
                  animation: 'rotate 8s linear infinite'
                }}>
                  ⚙️
                </div>
              </div>

              {/* Título principal */}
              <h1 style={{
                fontSize: '2.5rem',
                margin: '0 0 15px 0',
                background: 'linear-gradient(90deg, #00f7ff, #00e1ff, #00c2ff)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                fontWeight: '800',
                textAlign: 'center',
                letterSpacing: '-1px'
              }}>
                EN CONSTRUCCIÓN
              </h1>

              {/* Subtítulo */}
              <p style={{
                fontSize: '1.3rem',
                color: '#cccccc',
                margin: '0 0 20px 0',
                textAlign: 'center',
                maxWidth: '500px',
                lineHeight: '1.4',
                fontWeight: '500'
              }}>
                Nuestro ChatBot inteligente estará disponible muy pronto
              </p>

              {/* Mensaje con puntos animados */}
              <div style={{
                padding: '15px 25px',
                background: 'rgba(0, 247, 255, 0.1)',
                border: '1px solid rgba(0, 247, 255, 0.2)',
                borderRadius: '12px',
                marginBottom: '30px'
              }}>
                <p style={{
                  margin: 0,
                  color: '#00e1ff',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  Configurando IA avanzada{dots}
                </p>
              </div>

              {/* Características que vendrán */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
                maxWidth: '600px',
                marginTop: '20px'
              }}>
                {[
                  { icon: '🧠', text: 'IA Conversacional' },
                  { icon: '⚡', text: 'Respuestas Instantáneas' },
                  { icon: '🎯', text: 'Soporte 24/7' },
                  { icon: '🔒', text: 'Seguro y Privado' }
                ].map((feature, index) => (
                  <div key={index} style={{
                    padding: '12px 18px',
                    background: 'rgba(5, 5, 5, 0.8)',
                    border: '1px solid rgba(0, 247, 255, 0.1)',
                    borderRadius: '8px',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                      {feature.icon}
                    </div>
                    <p style={{
                      margin: 0,
                      color: '#cccccc',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      {feature.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Progreso visual */}
              <div style={{
                marginTop: '40px',
                width: '300px',
                height: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #00f7ff, #00c2ff)',
                  borderRadius: '3px',
                  animation: 'progressBar 3s ease-in-out infinite'
                }}></div>
              </div>
            </div>

            {/* Mensajes de ejemplo (desenfocados) */}
            {chatMessages.map((msg, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '15px',
                width: '100%',
                filter: 'blur(2px)',
                opacity: 0.3
              }}>
                <div style={{
                  maxWidth: '70%',
                  padding: '12px 18px',
                  borderRadius: '18px',
                  background: msg.type === 'user' 
                    ? 'linear-gradient(135deg, #00f7ff, #00c2ff)'
                    : 'rgba(5, 5, 5, 0.8)',
                  color: msg.type === 'user' ? '#0a0a0a' : '#ffffff',
                  border: msg.type === 'bot' ? '1px solid rgba(0, 247, 255, 0.2)' : 'none'
                }}>
                  {msg.message}
                </div>
              </div>
            ))}
          </div>

          {/* Input area (deshabilitada) */}
          <div style={{
            padding: '20px 30px',
            borderTop: '1px solid rgba(0, 247, 255, 0.1)',
            background: 'rgba(5, 5, 5, 0.8)',
            backdropFilter: 'blur(15px)'
          }}>
            <div style={{
              display: 'flex',
              gap: '15px',
              alignItems: 'center',
              position: 'relative'
            }}>
              <input
                type="text"
                placeholder="El chat estará disponible pronto..."
                disabled
                style={{
                  flex: 1,
                  padding: '15px 20px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(0, 247, 255, 0.2)',
                  borderRadius: '25px',
                  color: '#cccccc',
                  fontSize: '1rem',
                  outline: 'none',
                  cursor: 'not-allowed'
                }}
              />
              <button disabled style={{
                padding: '15px 20px',
                background: '#cccccc',
                border: 'none',
                borderRadius: '50%',
                color: '#666',
                cursor: 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes particleRise {
          0% { 
            opacity: 0;
            transform: translateY(0) scale(0.5);
          }
          20% { opacity: 0.8; }
          100% { 
            opacity: 0;
            transform: translateY(-100vh) scale(1.2);
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes progressBar {
          0% { width: 0%; }
          50% { width: 75%; }
          100% { width: 0%; }
        }

        @media (max-width: 768px) {
          /* Responsive adjustments would go here */
        }
      `}</style>
    </div>
  );
};

export default Chatbot;