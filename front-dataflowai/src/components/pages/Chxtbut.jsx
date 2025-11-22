// C:\...\front-dataflowai\src\components\pages\Chxtbut.jsx
import React, { useState, useRef, useEffect } from 'react';
import styles from '../../styles/CreacionUsuario.module.css';
import { sendChatMessage } from '../../api/ChatPg';
import { obtenerProductosUsuario } from '../../api/ProductoUsuario';

const ChatPostgre = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 0, role: 'system', text: 'Selecciona un dashboard (⋯) para comenzar.' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [showProducts, setShowProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('selectedProduct')) || null;
    } catch {
      return null;
    }
  });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleOpenProducts = async () => {
    setShowProducts((s) => !s);
    if (products.length === 0 && !showProducts) {
      try {
        const list = await obtenerProductosUsuario();
        setProducts(list || []);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los dashboards del usuario.');
      }
    }
  };

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    localStorage.setItem('selectedProduct', JSON.stringify(prod));
    setShowProducts(false);

    // mensaje informativo en el chat
    const infoMsg = {
      id: Date.now(),
      role: 'system',
      text: `Conectado al dashboard "${prod.producto}" (tabla: ${prod.db_name}). Ahora puedes escribir.`
    };
    setMessages((m) => [...m, infoMsg]);
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
    localStorage.removeItem('selectedProduct');
    setMessages((m) => [...m, { id: Date.now(), role: 'system', text: 'Selección eliminada. Selecciona un dashboard para habilitar el chat.' }]);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    if (!selectedProduct) {
      setError('Selecciona un dashboard antes de enviar mensajes.');
      return;
    }

    setError(null);
    const userMsg = { id: Date.now(), role: 'user', text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendChatMessage(text, selectedProduct.db_name);
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
    <div className={styles.container} style={{ maxWidth: 900, margin: '24px auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ marginBottom: 12 }}>Chat con N8N</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 14, color: '#333' }}>
            {selectedProduct ? (
              <>
                <strong>Dashboard:</strong> {selectedProduct.producto}
                <button onClick={handleClearSelection} style={{ marginLeft: 8, fontSize: 12 }}>Quitar</button>
              </>
            ) : (
              <span style={{ opacity: 0.7 }}>Ningún dashboard seleccionado</span>
            )}
          </div>

          <button
            onClick={handleOpenProducts}
            title="Elegir dashboard"
            style={{
              border: '1px solid #ddd',
              background: '#fff',
              padding: '6px 8px',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            ⋯
          </button>
        </div>
      </div>

      {showProducts && (
        <div style={{ border: '1px solid #e6e6e6', borderRadius: 8, padding: 10, marginBottom: 12, background: '#fff' }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Selecciona un dashboard</div>
          {products.length === 0 ? (
            <div style={{ color: '#666' }}>Cargando o no hay dashboards asociados...</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {products.map((p) => (
                <button
                  key={p.id_producto}
                  onClick={() => handleSelectProduct(p)}
                  style={{
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid #f0f0f0',
                    background: selectedProduct && selectedProduct.db_name === p.db_name ? '#eef6ff' : '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{p.producto}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{p.db_name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
          placeholder={selectedProduct ? "Escribe tu mensaje..." : "Selecciona un dashboard para habilitar el chat..."}
          rows={2}
          style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #ddd', resize: 'vertical' }}
          disabled={loading || !selectedProduct}
        />

        <button
          onClick={handleSend}
          disabled={loading || !selectedProduct}
          style={{
            minWidth: 110,
            padding: '10px 14px',
            borderRadius: 6,
            background: (loading || !selectedProduct) ? '#9bbffb' : '#0b84ff',
            color: '#fff',
            border: 'none',
            cursor: (loading || !selectedProduct) ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
};

export default ChatPostgre;
