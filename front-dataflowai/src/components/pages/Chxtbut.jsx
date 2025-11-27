// src/components/.../ChatPostgre.jsx
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../componentes/ThemeContext";
import { useCompanyStyles } from "../componentes/ThemeContextEmpresa";
import defaultStyles from '../../styles/Chxtbut.module.css';
import { sendChatMessage } from "../../api/ChatPg";
import { obtenerProductosUsuario } from "../../api/ProductoUsuario";
import { obtenerInfoUsuario } from "../../api/Usuario";

const normalizeSegment = (nombreCorto) =>
  nombreCorto ? String(nombreCorto).trim().replace(/\s+/g, "") : "";

export default function ChatPostgre() {
  const { theme } = useTheme();
  // consume estilos ya resueltos por CompanyStylesProvider (evita parpadeo)
  const styles = useCompanyStyles('Chxtbut', defaultStyles);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 0, role: "system", text: "Selecciona un dashboard para comenzar." },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [showProducts, setShowProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Nuevos estados para la empresa (seguir manteniendo para routing/logic)
  const [companySegment, setCompanySegment] = useState("");
  const [planId, setPlanId] = useState(null);
  const [companyId, setCompanyId] = useState(null);

  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Effect para obtener información del usuario y empresa (solo para datos, NO para estilos)
  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        const data = await obtenerInfoUsuario();
        if (!mounted || !data) return;

        const nombreCorto = data?.empresa?.nombre_corto ?? "";
        const pid = data?.empresa?.plan?.id ?? null;
        const cid = data?.empresa?.id ?? null;

        setCompanySegment(normalizeSegment(nombreCorto));
        setPlanId(pid);
        setCompanyId(cid);
      } catch (err) {
        console.error("No se pudo obtener info de usuario:", err);
        if (mounted) {
          setCompanySegment("");
          setPlanId(null);
          setCompanyId(null);
        }
      }
    };

    fetchUser();
    return () => {
      mounted = false;
    };
  }, []);

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

  // Variante aplicada usando fallback defensivo (evita error si el css no trae la clase)
  const variantClass = theme === "dark"
    ? (styles?.ChatpostgreDark || defaultStyles.ChatpostgreDark)
    : (styles?.ChatpostgreLight || defaultStyles.ChatpostgreLight);

  return (
    <main className={`${styles.Chatpostgrecontainer || defaultStyles.Chatpostgrecontainer} ${variantClass}`}>
      
      {/* Header Minimalista */}
      <header className={styles.Chatpostgreheader || defaultStyles.Chatpostgreheader}>
        <div className={styles.ChatpostgreheaderMain || defaultStyles.ChatpostgreheaderMain}>
          <div className={styles.ChatpostgreheaderTitle || defaultStyles.ChatpostgreheaderTitle}>
            <h1 className={styles.Chatpostgretitle || defaultStyles.Chatpostgretitle}>Data Chat</h1>
            <p className={styles.Chatpostgresubtitle || defaultStyles.Chatpostgresubtitle}>Consulta inteligente de datos</p>
          </div>
          
          <div className={styles.ChatpostgreheaderActions || defaultStyles.ChatpostgreheaderActions}>
            {selectedProduct ? (
              <div className={styles.ChatpostgreproductBadge || defaultStyles.ChatpostgreproductBadge}>
                <span className={styles.ChatpostgreproductName || defaultStyles.ChatpostgreproductName}>{selectedProduct.producto}</span>
                <button 
                  className={styles.ChatpostgreclearButton || defaultStyles.ChatpostgreclearButton}
                  onClick={handleClearSelection}
                  aria-label="Desconectar dashboard"
                >
                  ×
                </button>
              </div>
            ) : null}
            
            <button
              className={styles.ChatpostgreproductsToggle || defaultStyles.ChatpostgreproductsToggle}
              onClick={handleOpenProducts}
              aria-expanded={showProducts}
            >
              {showProducts ? '▲' : '▼'} Dashboards
            </button>
          </div>
        </div>

        {/* Panel de Dashboards Compacto */}
        {showProducts && (
          <div className={styles.ChatpostgreproductsCompact || defaultStyles.ChatpostgreproductsCompact}>
            <div className={styles.ChatpostgreproductsList || defaultStyles.ChatpostgreproductsList}>
              {products.length === 0 ? (
                <div className={styles.ChatpostgreproductsEmpty || defaultStyles.ChatpostgreproductsEmpty}>
                  Cargando dashboards...
                </div>
              ) : (
                products.map((product) => {
                  const isActive = selectedProduct && selectedProduct.db_name === product.db_name;
                  return (
                    <button
                      key={product.id_producto || product.db_name}
                      className={`${styles.ChatpostgreproductItem || defaultStyles.ChatpostgreproductItem} ${
                        isActive ? (styles.ChatpostgreproductItemActive || defaultStyles.ChatpostgreproductItemActive) : ''
                      }`}
                      onClick={() => handleSelectProduct(product)}
                    >
                      <span className={styles.ChatpostgreproductItemName || defaultStyles.ChatpostgreproductItemName}>{product.producto}</span>
                      <span className={styles.ChatpostgreproductItemDb || defaultStyles.ChatpostgreproductItemDb}>{product.db_name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mensajes del Chat */}
      <section className={styles.ChatpostgrechatSection || defaultStyles.ChatpostgrechatSection}>
        <div className={styles.Chatpostgremessages || defaultStyles.Chatpostgremessages}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.Chatpostgremessage || defaultStyles.Chatpostgremessage} ${
                message.role === 'user'
                  ? (styles.ChatpostgremessageUser || defaultStyles.ChatpostgremessageUser)
                  : message.role === 'bot'
                  ? (styles.ChatpostgremessageBot || defaultStyles.ChatpostgremessageBot)
                  : (styles.ChatpostgremessageSystem || defaultStyles.ChatpostgremessageSystem)
              }`}
            >
              {message.role === 'system' ? (
                <div className={styles.ChatpostgresystemMessage || defaultStyles.ChatpostgresystemMessage}>
                  <div className={styles.ChatpostgresystemIcon || defaultStyles.ChatpostgresystemIcon}>💡</div>
                  <p className={styles.ChatpostgresystemText || defaultStyles.ChatpostgresystemText}>{message.text}</p>
                </div>
              ) : message.role === 'bot' && message.emptyAction ? (
                <div className={styles.ChatpostgreactionMessage || defaultStyles.ChatpostgreactionMessage}>
                  <div className={styles.ChatpostgremessageContent || defaultStyles.ChatpostgremessageContent}>
                    <div className={styles.ChatpostgremessageHeader || defaultStyles.ChatpostgremessageHeader}>
                      <span className={styles.ChatpostgremessageRole || defaultStyles.ChatpostgremessageRole}>Asistente</span>
                    </div>
                    <p className={styles.ChatpostgremessageText || defaultStyles.ChatpostgremessageText}>
                      {message.text}, {' '}
                      <button
                        className={styles.ChatpostgreactionButton || defaultStyles.ChatpostgreactionButton}
                        onClick={handleEmptyActionClick}
                      >
                        {message.actionLabel}
                      </button>{' '}
                      para más ayuda.
                    </p>
                  </div>
                </div>
              ) : (
                <div className={styles.ChatpostgremessageContent || defaultStyles.ChatpostgremessageContent}>
                  <div className={styles.ChatpostgremessageHeader || defaultStyles.ChatpostgremessageHeader}>
                    <span className={styles.ChatpostgremessageRole || defaultStyles.ChatpostgremessageRole}>
                      {message.role === 'user' ? 'Tú' : 'Asistente'}
                    </span>
                  </div>
                  <pre className={styles.ChatpostgremessageText || defaultStyles.ChatpostgremessageText}>{message.text}</pre>
                </div>
              )}
            </div>
          ))}
          
          {/* Indicador de Typing */}
          {loading && (
            <div className={`${styles.Chatpostgremessage || defaultStyles.Chatpostgremessage} ${styles.ChatpostgremessageBot || defaultStyles.ChatpostgremessageBot}`}>
              <div className={styles.ChatpostgremessageContent || defaultStyles.ChatpostgremessageContent}>
                <div className={styles.ChatpostgremessageHeader || defaultStyles.ChatpostgremessageHeader}>
                  <span className={styles.ChatpostgremessageRole || defaultStyles.ChatpostgremessageRole}>Asistente</span>
                </div>
                <div className={styles.ChatpostgretypingIndicator || defaultStyles.ChatpostgretypingIndicator}>
                  <div className={styles.Chatpostgredot || defaultStyles.Chatpostgredot}></div>
                  <div className={styles.Chatpostgredot || defaultStyles.Chatpostgredot}></div>
                  <div className={styles.Chatpostgredot || defaultStyles.Chatpostgredot}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </section>

      {/* Área de Input */}
      <footer className={styles.ChatpostgreinputSection || defaultStyles.ChatpostgreinputSection}>
        <div className={styles.ChatpostgreinputContainer || defaultStyles.ChatpostgreinputContainer}>
          <div className={styles.ChatpostgreinputWrapper || defaultStyles.ChatpostgreinputWrapper}>
            <textarea
              className={styles.Chatpostgretextarea || defaultStyles.Chatpostgretextarea}
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
              className={`${styles.ChatpostgresendButton || defaultStyles.ChatpostgresendButton} ${
                loading || !selectedProduct ? (styles.ChatpostgresendButtonDisabled || defaultStyles.ChatpostgresendButtonDisabled) : ''
              }`}
              onClick={handleSend}
              disabled={loading || !selectedProduct}
            >
              {loading ? (
                <>
                  <span className={styles.Chatpostgrespinner || defaultStyles.Chatpostgrespinner}></span>
                </>
              ) : (
                <span className={styles.ChatpostgresendIcon || defaultStyles.ChatpostgresendIcon}>↑</span>
              )}
            </button>
          </div>
          
          {error && (
            <div className={styles.Chatpostgreerror || defaultStyles.Chatpostgreerror}>
              <div className={styles.ChatpostgreerrorIcon || defaultStyles.ChatpostgreerrorIcon}>⚠️</div>
              <div className={styles.ChatpostgreerrorText || defaultStyles.ChatpostgreerrorText}>{error}</div>
            </div>
          )}
        </div>
      </footer>
    </main>
  );
}
