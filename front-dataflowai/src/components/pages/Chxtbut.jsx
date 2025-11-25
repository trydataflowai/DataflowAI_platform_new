import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../componentes/ThemeContext";
import styles from "../../styles/Chxtbut.module.css";
import { sendChatMessage } from "../../api/ChatPg";
import { obtenerProductosUsuario } from "../../api/ProductoUsuario";

export default function ChatPostgre() {
  const { theme } = useTheme();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 0, role: "system", text: "Selecciona un dashboard para comenzar." },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [showProducts, setShowProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleOpenProducts = async () => {
    if (products.length === 0 && !showProducts) {
      try {
        let list = await obtenerProductosUsuario();
        if (Array.isArray(list)) {
          list = list.filter((p) => {
            const v = p?.db_name;
            return v !== null && v !== undefined && v !== "" && v !== 0 && v !== "0";
          });
        } else {
          list = [];
        }
        setProducts(list || []);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los dashboards.");
      }
    }
    setShowProducts(!showProducts);
  };

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    try {
      localStorage.setItem("selectedProduct", JSON.stringify(prod));
    } catch {}
    setShowProducts(false);

    const infoMsg = {
      id: Date.now(),
      role: "system",
      text: `Conectado al dashboard "${prod.producto}". Ahora puedes hacer preguntas.`,
    };
    setMessages((m) => [...m, infoMsg]);
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
    try {
      localStorage.removeItem("selectedProduct");
    } catch {}
    setMessages([
      { id: Date.now(), role: "system", text: "Dashboard desconectado. Selecciona uno para comenzar." },
    ]);
  };

  const sendPromptToBackend = async (promptText) => {
    if (!selectedProduct) {
      setError("Selecciona un dashboard primero.");
      return;
    }
    setError(null);
    const userMsg = { id: Date.now(), role: "user", text: promptText };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      const reply = await sendChatMessage(promptText, selectedProduct.db_name);

      let isEmpty = false;
      if (!reply) isEmpty = true;
      else if (typeof reply === "object") {
        if (Array.isArray(reply) && reply.length === 0) isEmpty = true;
        else if (!Array.isArray(reply) && Object.keys(reply).length === 0) isEmpty = true;
      } else if (typeof reply === "string") {
        const trimmed = reply.trim();
        if (trimmed === "" || trimmed === "{}" || trimmed === "null") isEmpty = true;
      }

      if (isEmpty) {
        const botEmpty = {
          id: Date.now() + 1,
          role: "bot",
          text: "No encontré información relevante para tu pregunta.",
          emptyAction: true,
          actionLabel: "click aquí",
        };
        setMessages((m) => [...m, botEmpty]);
      } else {
        const replyText = typeof reply === "string" ? reply : JSON.stringify(reply, null, 2);
        const botMsg = { id: Date.now() + 1, role: "bot", text: replyText };
        await new Promise((r) => setTimeout(r, 180));
        setMessages((m) => [...m, botMsg]);
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Error de conexión");
      const errMsg = { id: Date.now() + 2, role: "bot", text: "Error: " + (err?.message || "No se pudo procesar la solicitud") };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    await sendPromptToBackend(text);
    setInput("");
  };

  const handleEmptyActionClick = async () => {
    const followUp = "¿En qué puedo ayudarte con los datos disponibles?";
    await sendPromptToBackend(followUp);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) handleSend();
    }
  };

  const variantClass = theme === 'light' ? styles.ChatpostgreLight : styles.ChatpostgreDark;

  return (
    <main className={`${styles.Chatpostgrecontainer} ${variantClass}`}>
      
      {/* Header Minimalista */}
      <header className={styles.Chatpostgreheader}>
        <div className={styles.ChatpostgreheaderMain}>
          <div className={styles.ChatpostgreheaderTitle}>
            <h1 className={styles.Chatpostgretitle}>Data Chat</h1>
            <p className={styles.Chatpostgresubtitle}>Consulta inteligente de datos</p>
          </div>
          
          <div className={styles.ChatpostgreheaderActions}>
            {selectedProduct ? (
              <div className={styles.ChatpostgreproductBadge}>
                <span className={styles.ChatpostgreproductName}>{selectedProduct.producto}</span>
                <button 
                  className={styles.ChatpostgreclearButton}
                  onClick={handleClearSelection}
                  aria-label="Desconectar dashboard"
                >
                  ×
                </button>
              </div>
            ) : null}
            
            <button
              className={styles.ChatpostgreproductsToggle}
              onClick={handleOpenProducts}
              aria-expanded={showProducts}
            >
              {showProducts ? '▲' : '▼'} Dashboards
            </button>
          </div>
        </div>

        {/* Panel de Dashboards Compacto */}
        {showProducts && (
          <div className={styles.ChatpostgreproductsCompact}>
            <div className={styles.ChatpostgreproductsList}>
              {products.length === 0 ? (
                <div className={styles.ChatpostgreproductsEmpty}>
                  Cargando dashboards...
                </div>
              ) : (
                products.map((product) => {
                  const isActive = selectedProduct && selectedProduct.db_name === product.db_name;
                  return (
                    <button
                      key={product.id_producto || product.db_name}
                      className={`${styles.ChatpostgreproductItem} ${
                        isActive ? styles.ChatpostgreproductItemActive : ''
                      }`}
                      onClick={() => handleSelectProduct(product)}
                    >
                      <span className={styles.ChatpostgreproductItemName}>{product.producto}</span>
                      <span className={styles.ChatpostgreproductItemDb}>{product.db_name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mensajes del Chat */}
      <section className={styles.ChatpostgrechatSection}>
        <div className={styles.Chatpostgremessages}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.Chatpostgremessage} ${
                message.role === 'user'
                  ? styles.ChatpostgremessageUser
                  : message.role === 'bot'
                  ? styles.ChatpostgremessageBot
                  : styles.ChatpostgremessageSystem
              }`}
            >
              {message.role === 'system' ? (
                <div className={styles.ChatpostgresystemMessage}>
                  <div className={styles.ChatpostgresystemIcon}>💡</div>
                  <p className={styles.ChatpostgresystemText}>{message.text}</p>
                </div>
              ) : message.role === 'bot' && message.emptyAction ? (
                <div className={styles.ChatpostgreactionMessage}>
                  <div className={styles.ChatpostgremessageContent}>
                    <div className={styles.ChatpostgremessageHeader}>
                      <span className={styles.ChatpostgremessageRole}>Asistente</span>
                    </div>
                    <p className={styles.ChatpostgremessageText}>
                      {message.text}, {' '}
                      <button
                        className={styles.ChatpostgreactionButton}
                        onClick={handleEmptyActionClick}
                      >
                        {message.actionLabel}
                      </button>{' '}
                      para más ayuda.
                    </p>
                  </div>
                </div>
              ) : (
                <div className={styles.ChatpostgremessageContent}>
                  <div className={styles.ChatpostgremessageHeader}>
                    <span className={styles.ChatpostgremessageRole}>
                      {message.role === 'user' ? 'Tú' : 'Asistente'}
                    </span>
                  </div>
                  <pre className={styles.ChatpostgremessageText}>{message.text}</pre>
                </div>
              )}
            </div>
          ))}
          
          {/* Indicador de Typing */}
          {loading && (
            <div className={`${styles.Chatpostgremessage} ${styles.ChatpostgremessageBot}`}>
              <div className={styles.ChatpostgremessageContent}>
                <div className={styles.ChatpostgremessageHeader}>
                  <span className={styles.ChatpostgremessageRole}>Asistente</span>
                </div>
                <div className={styles.ChatpostgretypingIndicator}>
                  <div className={styles.Chatpostgredot}></div>
                  <div className={styles.Chatpostgredot}></div>
                  <div className={styles.Chatpostgredot}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </section>

      {/* Área de Input */}
      <footer className={styles.ChatpostgreinputSection}>
        <div className={styles.ChatpostgreinputContainer}>
          <div className={styles.ChatpostgreinputWrapper}>
            <textarea
              className={styles.Chatpostgretextarea}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                selectedProduct
                  ? "Escribe tu pregunta sobre los datos..."
                  : "Selecciona un dashboard para comenzar"
              }
              rows={2}
              disabled={loading || !selectedProduct}
            />
            <button
              className={`${styles.ChatpostgresendButton} ${
                loading || !selectedProduct ? styles.ChatpostgresendButtonDisabled : ''
              }`}
              onClick={handleSend}
              disabled={loading || !selectedProduct}
            >
              {loading ? (
                <>
                  <span className={styles.Chatpostgrespinner}></span>
                </>
              ) : (
                <span className={styles.ChatpostgresendIcon}>↑</span>
              )}
            </button>
          </div>
          
          {error && (
            <div className={styles.Chatpostgreerror}>
              <div className={styles.ChatpostgreerrorIcon}>⚠️</div>
              <div className={styles.ChatpostgreerrorText}>{error}</div>
            </div>
          )}
        </div>
      </footer>
    </main>
  );
}