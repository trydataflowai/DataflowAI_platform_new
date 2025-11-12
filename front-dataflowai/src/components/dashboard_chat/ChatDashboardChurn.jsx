import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import styles from '../../styles/dashboard_chat/ChatDashboardChurn.module.css';
import { enviarMensajeChatDashboardChurn } from '../../api/dashboard_chat/ChatDashboardChurnKpi';

const SCROLL_THRESHOLD = 150; // px desde el bottom para considerar "estás en el final"

const ChatDashboardChurn = () => {
  const [data, setData] = useState(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const userScrolledUpRef = useRef(false); // marca si el usuario está leyendo arriba

  // Mantener referencia del último scrollTop para detectar scroll manual
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const onScroll = () => {
      const distanceToBottom = list.scrollHeight - (list.scrollTop + list.clientHeight);
      userScrolledUpRef.current = distanceToBottom > SCROLL_THRESHOLD;
    };
    list.addEventListener('scroll', onScroll, { passive: true });
    // inicial check
    onScroll();
    return () => list.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll al final cuando cambian mensajes o cambia sending,
  // pero solo si el usuario está *cerca* del final (no forzar si leyó hacia arriba)
  useLayoutEffect(() => {
    const shouldAuto = !userScrolledUpRef.current;
    if (!bottomRef.current) return;

    // espera al layout, luego usa requestAnimationFrame
    const raf = requestAnimationFrame(() => {
      try {
        if (shouldAuto) {
          bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      } catch (e) {
        // fallback
        const list = listRef.current;
        if (list && shouldAuto) {
          try {
            list.scrollTop = list.scrollHeight;
          } catch (err) { /* ignore */ }
        }
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [messages.length, sending]);

  // Focus al cargar
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  async function handleSend(e) {
    e && e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const userMessage = { role: 'user', text, id: `u-${Date.now()}` };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const resp = await enviarMensajeChatDashboardChurn(text);

      const assistant = (resp && (resp.assistant || resp.text)) || 'Sin respuesta del asistente.';
      const assistantMessage = { role: 'assistant', text: assistant, id: `a-${Date.now() + 1}` };

      // añadir con pequeño timeout para simular streaming y dar chance al scroll
      setTimeout(() => setMessages(prev => [...prev, assistantMessage]), 80);

      if (resp && resp.contexto) setData(resp.contexto);
    } catch (err) {
      console.error(err);
      const errorMessage = {
        role: 'assistant',
        text: `Error: ${err.message || 'falló la petición'}`,
        id: `err-${Date.now()}`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
      // re-focus input
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sending && input.trim()) handleSend();
    }
  }

  const clearChat = () => {
    setMessages([]);
    // asegurar scroll al top (vacío)
    if (listRef.current) listRef.current.scrollTop = 0;
  };

  // helper para renderizar texto (evita HTML injection)
  const renderText = (text) => text;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <div className={styles.chatIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h3>Asistente Churn</h3>
              <p className={styles.subtitle}>Analiza el comportamiento de tus clientes</p>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              className={styles.clearButton}
              onClick={clearChat}
              aria-label="Limpiar conversación"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-6 10v4m-4-4v4m8-4v4"
                      strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className={styles.chat}>
        <div className={styles.messages} ref={listRef} aria-live="polite">
          {messages.length === 0 && (
            <div className={styles.placeholder}>
              <div className={styles.placeholderIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4>Inicia una conversación</h4>
              <p>Pregunta sobre análisis de churn, clientes inactivos o tendencias</p>
              <div className={styles.suggestions}>
                <div className={styles.suggestion} onClick={() => setInput("¿Qué puedes hacer??")}>
                  ¿Qué puedes hacer?
                </div>
                <div className={styles.suggestion} onClick={() => setInput("Muestra la tendencia de churn por segmento")}>
                  Tendencias de churn por segmento
                </div>
                <div className={styles.suggestion} onClick={() => setInput("¿Cuál es nuestra tasa de retención?")}>
                  Tasa de retención actual
                </div>
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`${styles.msg} ${m.role === 'user' ? styles.user : styles.assistant}`}
            >
              <div className={styles.msgContent}>
                {m.role === 'assistant' && (
                  <div className={styles.assistantIndicator} aria-hidden>
                    <span>AI</span>
                  </div>
                )}
                <div className={styles.msgBubble}>
                  <div className={styles.msgText}>
                    {renderText(m.text)}
                  </div>
                </div>
                {m.role === 'user' && (
                  <div className={styles.userIndicator} aria-hidden>
                    <span>Tú</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className={`${styles.msg} ${styles.assistant}`}>
              <div className={styles.msgContent}>
                <div className={styles.assistantIndicator}>
                  <span>AI</span>
                </div>
                <div className={styles.msgBubble}>
                  <div className={styles.typingAnimation}>
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* sentinel */}
          <div ref={bottomRef} style={{ height: 1, width: '100%' }} />
        </div>

        <form className={styles.inputRow} onSubmit={handleSend}>
          <div className={styles.inputContainer}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta sobre análisis de churn..."
              disabled={sending}
              className={styles.chatInput}
              aria-label="Escribe un mensaje"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className={styles.sendButton}
              aria-label="Enviar mensaje"
            >
              {sending ? (
                <div className={styles.sendSpinner} aria-hidden />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatDashboardChurn;
