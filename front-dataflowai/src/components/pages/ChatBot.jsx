// Chatbot.jsx
import React, { useEffect, useState } from "react";
import darkStyles from '../../styles/ChatBotDark.module.css';
import lightStyles from '../../styles/ChatBotLight.module.css';

import { obtenerInfoUsuario } from '../../api/Usuario';
import { useTheme } from '../componentes/ThemeContext';

const Chatbot = () => {
  const { theme } = useTheme(); // 'dark' | 'light'
  const [activeStyles, setActiveStyles] = useState(darkStyles);

  const [planId, setPlanId] = useState(null);
  const [dots, setDots] = useState('');
  const [particles, setParticles] = useState([]);

  // Animación de puntos suspensivos
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Generar partículas animadas una vez
  useEffect(() => {
    const newParticles = Array.from({ length: 14 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 10 + 8,
      delay: Math.random() * 4,
      opacity: Math.random() * 0.36 + 0.12
    }));
    setParticles(newParticles);
  }, []);

  // Obtener plan del usuario (para permitir forzar dark si plan no lo permite)
  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const user = await obtenerInfoUsuario();
        const pid = user?.empresa?.plan?.id ?? null;
        setPlanId(pid);
      } catch (err) {
        console.warn('No se pudo obtener info usuario (plan):', err);
        setPlanId(null);
      }
    };
    fetchUsuario();
  }, []);

  // Seleccionar estilos activos según plan y theme
  useEffect(() => {
    if (planId === 3 || planId === 6) {
      setActiveStyles(theme === 'dark' ? darkStyles : lightStyles);
    } else {
      setActiveStyles(darkStyles); // forzar dark para planes que no permiten toggle
    }
  }, [theme, planId]);

  const chatMessages = [
    { type: 'bot', message: 'Bienvenido. Soy su asistente virtual.' },
    { type: 'user', message: 'Necesito ayuda con mi cuenta.' },
    { type: 'bot', message: 'Con gusto. ¿En qué puedo asistirle exactamente?' }
  ];

  const features = [
    { title: 'IA Conversacional', subtitle: 'Respuestas automáticas con contexto.' },
    { title: 'Respuesta rápida', subtitle: 'Tiempo de respuesta optimizado.' },
    { title: 'Disponibilidad', subtitle: 'Atención continua.' },
    { title: 'Seguridad', subtitle: 'Privacidad y protección de datos.' }
  ];

  return (
    <div className={activeStyles.container}>
      {/* Partículas de fondo */}
      <div className={activeStyles.particles} aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className={activeStyles.particle}
            style={{
              left: `${p.x}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              animationDuration: `${p.speed}s`,
              animationDelay: `${p.delay}s`
            }}
          />
        ))}
      </div>

      {/* Contenedor principal */}
      <div className={activeStyles.layout}>
        {/* Panel izquierdo - Lista de chats */}
        <aside className={activeStyles.leftPanel}>
          <header className={activeStyles.leftHeader}>
            <div>
              <h2 className={activeStyles.headerTitle}>ChatBot AI</h2>
              <p className={activeStyles.headerSubtitle}>Asistente virtual</p>
            </div>
          </header>

          <div className={activeStyles.newChatWrap}>
            <button className={activeStyles.newChatBtn} type="button">Nuevo chat</button>
          </div>

          <nav className={activeStyles.chatList} aria-label="Chats recientes">
            {['Consulta sobre facturación', 'Problema técnico', 'Información de productos', 'Soporte general'].map((chat, index) => (
              <div key={index} className={activeStyles.chatItem} role="button" tabIndex={0}>
                {chat}
              </div>
            ))}
          </nav>
        </aside>

        {/* Panel principal - Chat */}
        <main className={activeStyles.mainPanel}>
          <div className={activeStyles.chatHeader}>
            <div className={activeStyles.headerRow}>
              <div className={activeStyles.avatarCircle} aria-hidden="true">AV</div>
              <div className={activeStyles.headerMeta}>
                <h3 className={activeStyles.assistantName}>Asistente Virtual</h3>
                <p className={activeStyles.statusLine}>
                  <span className={activeStyles.statusDot} /> En línea
                </p>
              </div>
            </div>
          </div>

          <section className={activeStyles.messagesArea} aria-live="polite">
            <div className={activeStyles.overlay} role="region" aria-label="Información de estado">
              <div className={activeStyles.overlayIconCircle}>
                {/* Gear SVG (no emoji) */}
                <svg className={activeStyles.overlaySvg} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19.4 15a1.8 1.8 0 0 0 .34 1.96l.02.02a1 1 0 0 1-0.02 1.4l-1.1 1.1a1 1 0 0 1-1.4 0l-.02-.02A1.8 1.8 0 0 0 15 19.4a1.8 1.8 0 0 0-1.96.34l-.02.02a1 1 0 0 1-1.4 0l-1.1-1.1a1 1 0 0 1 0-1.4l.02-.02A1.8 1.8 0 0 0 8.6 15a1.8 1.8 0 0 0-.34-1.96l-.02-.02a1 1 0 0 1 0-1.4l1.1-1.1a1 1 0 0 1 1.4 0l.02.02A1.8 1.8 0 0 0 9 8.6 1.8 1.8 0 0 0 10.96 8.26l.02-.02a1 1 0 0 1 1.4 0l1.1 1.1a1 1 0 0 1 0 1.4l-.02.02A1.8 1.8 0 0 0 15 8.6a1.8 1.8 0 0 0 1.96-.34l.02-.02a1 1 0 0 1 1.4 0l1.1 1.1a1 1 0 0 1 0 1.4l-.02.02A1.8 1.8 0 0 0 19.4 9" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <h1 className={activeStyles.overlayTitle}>EN CONSTRUCCIÓN</h1>

              <p className={activeStyles.overlaySubtitle}>El servicio estará disponible próximamente.</p>

              <div className={activeStyles.dotsBox}>
                <p className={activeStyles.dotsText}>Configurando inteligencia artificial{dots}</p>
              </div>

              <div className={activeStyles.featuresGrid}>
                {features.map((f, idx) => (
                  <div key={idx} className={activeStyles.featureCard}>
                    <div className={activeStyles.featureMark} aria-hidden="true" />
                    <div>
                      <p className={activeStyles.featureText}>{f.title}</p>
                      <p className={activeStyles.featureSub}>{f.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className={activeStyles.progressWrap}>
                <div className={activeStyles.progressBar} style={{ width: '58%' }} />
              </div>
            </div>

            {/* Mensajes de ejemplo (desenfocados) */}
            {chatMessages.map((msg, index) => (
              <div key={index} className={activeStyles.blurredMessage}>
                <div
                  className={`${activeStyles.messageBubble} ${msg.type === 'user' ? activeStyles.messageUser : activeStyles.messageBot}`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
          </section>

          <footer className={activeStyles.inputArea}>
            <div className={activeStyles.inputRow}>
              <input
                type="text"
                placeholder="El chat estará disponible próximamente..."
                disabled
                className={activeStyles.inputField}
                aria-disabled="true"
              />
              <button disabled className={activeStyles.sendBtn} aria-disabled="true">Enviar</button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Chatbot;
