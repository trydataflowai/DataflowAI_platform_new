// C:\...\front-dataflowai\src\components\pages\Chxtbut.jsx
import React, { useState, useRef, useEffect } from 'react';
import styles from '../../styles/CreacionUsuario.module.css';
import { sendChatMessage } from '../../api/ChatPg';

const ChatPostgre = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 0, role: 'system', text: 'Conecta con tu tabla. Escribe abajo y presiona Enviar.' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // auto-scroll al agregar mensajes
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setError(null);

    // push user message immediately
    const userMsg = { id: Date.now(), role: 'user', text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendChatMessage(text); // string or object
      const replyText = typeof reply === 'string' ? reply : JSON.stringify(reply, null, 2);
      const botMsg = { id: Date.now() + 1, role: 'bot', text: replyText };
      setMessages((m) => [...m, botMsg]);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error conectando con el servidor');
      const errMsg = { id: Date.now() + 2, role: 'bot', text: 'Error: ' + (err.message || 'Error al solicitar respuesta') };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading) handleSend();
    }
  };

  return (
    <div className={styles.container} style={{ maxWidth: 800, margin: '24px auto', padding: 20 }}>
      <h1 style={{ marginBottom: 12 }}>Chat con N8N</h1>

      <div
        className={styles.chatWindow}
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: 8,
          padding: 12,
          height: 420,
          overflowY: 'auto',
          background: '#fff'
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              marginBottom: 12,
              display: 'flex',
              flexDirection: 'column',
              alignItems: m.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                maxWidth: '85%',
                padding: '8px 12px',
                borderRadius: 8,
                background: m.role === 'user' ? '#0b84ff' : '#f1f3f5',
                color: m.role === 'user' ? '#fff' : '#111',
                whiteSpace: 'pre-wrap',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div style={{ color: 'crimson', marginTop: 8 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Escribe tu mensaje..."
          rows={2}
          style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #ddd', resize: 'vertical' }}
          disabled={loading}
        />

        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            minWidth: 110,
            padding: '10px 14px',
            borderRadius: 6,
            background: loading ? '#9bbffb' : '#0b84ff',
            color: '#fff',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
};

export default ChatPostgre;
