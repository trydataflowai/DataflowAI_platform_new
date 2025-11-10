// ChatDashboardChurn.jsx
import React, { useState, useRef } from 'react';
import styles from '../../styles/dashboard_chat/ChatDashboardChurn.module.css';
import { enviarMensajeChatDashboardChurn } from '../../api/dashboard_chat/ChatDashboardChurnKpi';

const ChatDashboardChurn = () => {
  const [data, setData] = useState(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  // Mantener scroll abajo
  React.useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(e) {
    e && e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setSending(true);
    try {
      const resp = await enviarMensajeChatDashboardChurn(text);
      const assistant = resp.assistant || 'Sin respuesta del asistente.';
      setMessages(prev => [...prev, { role: 'assistant', text: assistant }]);
      if (resp.contexto) {
        setData(resp.contexto);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${err.message}` }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Chat — Churn</h3>
        <div className={styles.actions}>
          {/* Se quitó el botón actualizar */}
        </div>
      </div>

      <div className={styles.chat}>
        <div className={styles.messages} ref={listRef}>
          {messages.length === 0 && (
            <div className={styles.placeholder}>
              Pregunta algo como: "¿Cuántos clientes inactivos tengo?"
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`${styles.msg} ${
                m.role === 'user' ? styles.user : styles.assistant
              }`}
            >
              <div className={styles.msgText}>{m.text}</div>
            </div>
          ))}

          {sending && (
            <div className={`${styles.msg} ${styles.assistant}`}>
              <div className={styles.msgText}>Pensando...</div>
            </div>
          )}
        </div>

        <form className={styles.inputRow} onSubmit={handleSend}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            disabled={sending}
          />
          <button type="submit" disabled={sending || !input.trim()}>
            {sending ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatDashboardChurn;
