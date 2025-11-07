// src/components/pages/ChatBot.jsx
import React, { useEffect, useState, useRef } from "react";
import darkStylesDefault from '../../styles/ChatBotDark.module.css';
import lightStylesDefault from '../../styles/ChatBotLight.module.css';
import { useTheme } from '../componentes/ThemeContext';
import { sendMessageToBackend } from '../../api/ChatBot';
import { obtenerInfoUsuario } from '../../api/Usuario';

const ALLOWED_USER_IDS = [1, 2, 3];

const empresaLightModules = import.meta.glob(
  '../../styles/empresas/*/ChatBotLight.module.css',
  { eager: true }
);
const empresaDarkModules = import.meta.glob(
  '../../styles/empresas/*/ChatBot.module.css',
  { eager: true }
);

const Chatbot = () => {
  const { theme } = useTheme();
  const [activeStyles, setActiveStyles] = useState(darkStylesDefault);

  const [planId, setPlanId] = useState(null);
  const [companyId, setCompanyId] = useState(null);

  const [dots, setDots] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([
    { id: 'sys-1', role: 'bot', text: 'Bienvenido. Soy su asistente virtual.' }
  ]);
  const [isSending, setIsSending] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);

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

  // OBTENER INFORMACIÓN DEL USUARIO Y PLAN
  useEffect(() => {
    let mounted = true;
    const fetchUserInfo = async () => {
      try {
        const userInfo = await obtenerInfoUsuario();
        if (!mounted || !userInfo) return;

        const pid = userInfo.empresa?.plan?.id ?? null;
        const cid = userInfo.empresa?.id ?? null;
        const id = userInfo?.id ?? null;

        setPlanId(pid);
        setCompanyId(cid);
        setUserId(id);

        const allowed = ALLOWED_USER_IDS.includes(id);
        setIsAllowed(allowed);

        setAuthError(null);
      } catch (err) {
        console.error('Error al obtener info del usuario:', err);
        setPlanId(null);
        setCompanyId(null);
        setUserId(null);
        setIsAllowed(false);
        setAuthError('No se pudo validar usuario');
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    fetchUserInfo();
    return () => { mounted = false; };
  }, []);

  // estilos segun theme/plan/company
  useEffect(() => {
    const useCompanyStyles = (planId === 3 || planId === 6) && companyId;

    const lightKey = `../../styles/empresas/${companyId}/ChatBotLight.module.css`;
    const darkKey = `../../styles/empresas/${companyId}/ChatBot.module.css`;

    const foundCompanyLight = empresaLightModules[lightKey];
    const foundCompanyDark = empresaDarkModules[darkKey];

    const extract = (mod) => {
      if (!mod) return null;
      return mod.default ?? mod;
    };

    const companyLight = extract(foundCompanyLight);
    const companyDark = extract(foundCompanyDark);

    let chosenStyles = darkStylesDefault;
    if (theme === 'dark') {
      if (useCompanyStyles && companyDark) {
        chosenStyles = companyDark;
      } else {
        chosenStyles = darkStylesDefault;
      }
    } else {
      if (useCompanyStyles && companyLight) {
        chosenStyles = companyLight;
      } else {
        chosenStyles = lightStylesDefault;
      }
    }

    setActiveStyles(chosenStyles);
  }, [theme, planId, companyId]);

  // scroll al final cuando hay mensajes nuevos
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isBotTyping]);

  // Simular typing del bot
  const simulateBotTyping = async (text, delay = 1000) => {
    setIsBotTyping(true);
    
    // Simular tiempo de escritura basado en la longitud del texto
    const typingTime = Math.min(Math.max(text.length * 20, 1000), 3000);
    
    await new Promise(resolve => setTimeout(resolve, typingTime));
    
    const botMsg = { id: `b-${Date.now()}`, role: 'bot', text };
    setMessages(prev => [...prev, botMsg]);
    setIsBotTyping(false);
  };

  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text) return;

    if (!isAllowed) {
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
      
      // Simular typing effect en lugar de mostrar mensaje inmediatamente
      await simulateBotTyping(botReply);
      
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
      if (!isSending && !isBotTyping) sendMessage();
    }
  };

  // Función para formatear texto con saltos de línea
  const formatMessageText = (text) => {
    return text.split('\n').map((line, index) => (
      <div key={index} className={activeStyles.messageLine}>
        {line}
      </div>
    ));
  };

  return (
    <div className={activeStyles.container}>
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
                  <span className={activeStyles.statusDot} /> 
                  {isBotTyping ? 'Escribiendo...' : 'En línea'}
                </p>
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
              <div 
                key={msg.id} 
                className={`${activeStyles.messageContainer} ${
                  msg.role === 'user' ? activeStyles.messageContainerUser : activeStyles.messageContainerBot
                }`}
              >
                <div
                  className={`${activeStyles.messageBubble} ${
                    msg.role === 'user' ? activeStyles.messageUser : activeStyles.messageBot
                  }`}
                >
                  <div className={activeStyles.messageContent}>
                    {formatMessageText(msg.text)}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Efecto de typing del bot */}
            {isBotTyping && (
              <div className={`${activeStyles.messageContainer} ${activeStyles.messageContainerBot}`}>
                <div className={`${activeStyles.messageBubble} ${activeStyles.messageBot} ${activeStyles.typingIndicator}`}>
                  <div className={activeStyles.typingDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </section>

          <footer className={activeStyles.inputArea}>
            <div className={activeStyles.inputRow}>
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
                disabled={isSending || !isAllowed || authLoading || isBotTyping}
                aria-disabled={isSending || !isAllowed || authLoading || isBotTyping}
              />
              <button
                onClick={sendMessage}
                disabled={isSending || !isAllowed || authLoading || isBotTyping}
                className={activeStyles.sendBtn}
                aria-disabled={isSending || !isAllowed || authLoading || isBotTyping}
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