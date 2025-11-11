import React, { useState, useRef, useEffect } from 'react';
import styles from '../../styles/dashboard_chat/ChatDashboardChurn.module.css';
import { enviarMensajeChatDashboardChurn } from '../../api/dashboard_chat/ChatDashboardChurnKpi';

const ChatDashboardChurn = () => {
  const [data, setData] = useState(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // Efecto de scroll suave
  useEffect(() => {
    if (listRef.current) {
      const scrollToBottom = () => {
        listRef.current.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: 'smooth'
        });
      };
      
      const timeoutId = setTimeout(scrollToBottom, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, sending]);

  // Efecto de focus al cargar
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, []);

  async function handleSend(e) {
    e && e.preventDefault();
    const text = input.trim();
    if (!text) return;

    // Agregar mensaje del usuario
    const userMessage = { role: 'user', text, id: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const resp = await enviarMensajeChatDashboardChurn(text);
      
      const assistant = (resp && (resp.assistant || resp.text)) || 'Sin respuesta del asistente.';
      const assistantMessage = { role: 'assistant', text: assistant, id: Date.now() + 1 };
      
      setMessages(prev => [...prev, assistantMessage]);

      if (resp && resp.contexto) {
        setData(resp.contexto);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = { 
        role: 'assistant', 
        text: `Error: ${err.message || 'falló la petición'}`,
        id: Date.now() + 1
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
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
  };

  return (
    <div className={styles.container}>
      {/* Header limpio y minimalista */}
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

      {/* Chat area minimalista */}
      <div className={styles.chat}>
        <div className={styles.messages} ref={listRef}>
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
                <div className={styles.suggestion} onClick={() => setInput("¿Cuántos clientes inactivos tengo este mes?")}>
                  ¿Cuántos clientes inactivos tengo?
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

          {messages.map((m, i) => (
            <div
              key={m.id}
              className={`${styles.msg} ${m.role === 'user' ? styles.user : styles.assistant}`}
            >
              <div className={styles.msgContent}>
                {m.role === 'assistant' && (
                  <div className={styles.assistantIndicator}>
                    <span>AI</span>
                  </div>
                )}
                <div className={styles.msgBubble}>
                  <div className={styles.msgText}>
                    {m.text}
                  </div>
                </div>
                {m.role === 'user' && (
                  <div className={styles.userIndicator}>
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
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area limpia */}
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
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className={styles.sendButton}
            >
              {sending ? (
                <div className={styles.sendSpinner}></div>
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