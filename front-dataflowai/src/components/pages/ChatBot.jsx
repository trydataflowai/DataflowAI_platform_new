// src/components/pages/ChatBot.jsx
import React, { useEffect, useState, useRef } from "react";
import darkStyles from '../../styles/ChatBotDark.module.css';
import lightStyles from '../../styles/ChatBotLight.module.css';
import { useTheme } from '../componentes/ThemeContext';
import { sendMessageToBackend } from '../../api/ChatBot';
import { obtenerInfoUsuario } from '../../api/Usuario';

const ALLOWED_USER_IDS = [1, 2, 3, 20];

const Chatbot = () => {
  const { theme } = useTheme(); // 'dark' | 'light'
  const [activeStyles, setActiveStyles] = useState(darkStyles);

  const [planId, setPlanId] = useState(null); // <- AÑADIR ESTADO PARA planId
  const [dots, setDots] = useState('');
  const [particles, setParticles] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([
    { id: 'sys-1', role: 'bot', text: 'Bienvenido. Soy su asistente virtual.' }
  ]);
  const [isSending, setIsSending] = useState(false);

  // --- autorización usuario ---
  const [userId, setUserId] = useState(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const messagesEndRef = useRef(null);

  // puntos animación
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // partículas
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

  // OBTENER INFORMACIÓN DEL USUARIO Y PLAN - AÑADIR ESTE useEffect
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userInfo = await obtenerInfoUsuario();
        const pid = userInfo.empresa?.plan?.id;
        setPlanId(pid);
        
        // También establecer el userId para la autorización
        const id = userInfo?.id ?? null;
        setUserId(id);
        const allowed = ALLOWED_USER_IDS.includes(id);
        setIsAllowed(allowed);
      } catch (err) {
        console.error('Error al obtener info del usuario:', err);
        // Si no se puede obtener el plan, usar modo oscuro por defecto
        setPlanId(null);
        setIsAllowed(false);
      } finally {
        setAuthLoading(false);
      }
    };
    
    fetchUserInfo();
  }, []);

  // estilos segun theme/plan - CORREGIR ESTE useEffect
  useEffect(() => {
    if (planId === 3 || planId === 6) {
      // Si el plan permite cambiar el tema
      setActiveStyles(theme === 'dark' ? darkStyles : lightStyles);
    } else {
      // Si el plan no lo permite, forzar modo oscuro
      setActiveStyles(darkStyles);
    }
  }, [theme, planId]); // <- Añadir planId como dependencia

  // scroll al final cuando hay mensajes nuevos
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text) return;

    // bloqueo por permisos: sólo enviar si isAllowed === true
    if (!isAllowed) {
      // agregar un mensaje del bot explicando que no tiene permiso
      setMessages(prev => [
        ...prev,
        { id: `b-block-${Date.now()}`, role: 'bot', text: 'No tienes permiso para enviar prompts en este chat.' }
      ]);
      setInputValue('');
      return;
    }

    const userMsg = { id: `u-${Date.now()}`, role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsSending(true);

    try {
      const res = await sendMessageToBackend(text);
      const botReply = res?.reply ?? "No hay respuesta.";
      const botMsg = { id: `b-${Date.now()}`, role: 'bot', text: botReply };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errText = (err && err.message) ? err.message : "Error enviando mensaje";
      const botMsg = { id: `b-err-${Date.now()}`, role: 'bot', text: `Error: ${errText}` };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSending) sendMessage();
    }
  };

  return (
    <div className={activeStyles.container}>
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

      <div className={activeStyles.layout}>
        <aside className={activeStyles.leftPanel}>
          <header className={activeStyles.leftHeader}>
            <div>
              <h2 className={activeStyles.headerTitle}>ChatBot AI</h2>
              <p className={activeStyles.headerSubtitle}>Asistente virtual</p>
            </div>
          </header>

          <div className={activeStyles.newChatWrap}>
            <button
              className={activeStyles.newChatBtn}
              type="button"
              onClick={() => {
                setMessages([{ id: 'sys-1', role: 'bot', text: 'Bienvenido. Soy su asistente virtual.' }]);
              }}
            >Nuevo chat</button>
          </div>

          <nav className={activeStyles.chatList} aria-label="Chats recientes">
            {['Consulta sobre facturación', 'Problema técnico', 'Información de productos', 'Soporte general'].map((chat, index) => (
              <div key={index} className={activeStyles.chatItem} role="button" tabIndex={0}>
                {chat}
              </div>
            ))}
          </nav>
        </aside>

        <main className={activeStyles.mainPanel}>
          <div className={activeStyles.chatHeader}>
            <div className={activeStyles.headerRow}>
              <div className={activeStyles.avatarCircle} aria-hidden="true">AV</div>
              <div className={activeStyles.headerMeta}>
                <h3 className={activeStyles.assistantName}>Asistente Virtual</h3>
                <p className={activeStyles.statusLine}>
                  <span className={activeStyles.statusDot} /> En línea
                </p>
                {/* Estado de autorización mostrado de forma discreta */}
                <p className={activeStyles.smallNote} aria-live="polite">
                  {authLoading ? 'Validando usuario...' : (
                    isAllowed
                      ? `Acceso permitido (user id: ${userId})`
                      : authError ? `Acceso denegado: ${authError}` : `Acceso denegado (user id: ${userId ?? 'desconocido'})`
                  )}
                </p>
              </div>
            </div>
          </div>

          <section className={activeStyles.messagesArea} aria-live="polite">
            {/* Mensajes */}
            {messages.map((msg) => (
              <div key={msg.id} className={activeStyles.blurredMessage}>
                <div
                  className={`${activeStyles.messageBubble} ${msg.role === 'user' ? activeStyles.messageUser : activeStyles.messageBot}`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </section>

          <footer className={activeStyles.inputArea}>
            <div className={activeStyles.inputRow}>
              {/* Si el usuario no está permitido, el textarea se deshabilita y mostramos placeholder explicativo */}
              <textarea
                rows={1}
                placeholder={
                  authLoading
                    ? 'Validando usuario...'
                    : isAllowed
                      ? 'Escribe un mensaje...'
                      : 'No tienes permiso para enviar prompts en este chat'
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                className={activeStyles.inputField}
                disabled={isSending || !isAllowed || authLoading}
                aria-disabled={isSending || !isAllowed || authLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isSending || !isAllowed || authLoading}
                className={activeStyles.sendBtn}
                aria-disabled={isSending || !isAllowed || authLoading}
                type="button"
                title={(!isAllowed && !authLoading) ? 'No tienes permiso para enviar prompts' : 'Enviar'}
              >
                {isSending ? `Enviando${dots}` : 'Enviar'}
              </button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Chatbot;
