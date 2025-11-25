import React, { useEffect, useRef, useState } from "react";
import styles from "../../styles/dashboard_chat/ChatModal.module.css";
import { sendChatMessage } from "../../api/ChatPg";

export default function ChatModal() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Función para obtener parámetros de la URL
  const getUrlParams = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return {
        tabla: params.get('tabla')
      };
    }
    return {};
  };

  // Efecto para conectar automáticamente al cargar el componente
  useEffect(() => {
    const connectAutomatically = () => {
      const params = getUrlParams();
      const tableName = params.tabla || "dashboard_arpu"; // Valor por defecto
      
      // Crear un producto temporal con la tabla del dashboard
      const tempProduct = {
        producto: `Dashboard`,
        db_name: tableName,
        id_producto: `auto-${tableName}`
      };
      
      setSelectedProduct(tempProduct);
      
      // Guardar en localStorage para persistencia
      try {
        localStorage.setItem("selectedProduct", JSON.stringify(tempProduct));
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
      
      // Mostrar mensaje de bienvenida y botones de inicio
      setMessages([
        { 
          id: 1, 
          role: "system", 
          text: "¡Hola! Soy tu asistente de análisis. Estoy aquí para ayudarte a analizar y entender los datos de tu negocio." 
        }
      ]);
    };

    connectAutomatically();
  }, []);

  // Función para manejar clicks en los botones de inicio
  const handleQuickQuestion = async (question) => {
    setInput(question);
    await sendPromptToBackend(question);
  };

  // Helper to send any prompt to backend and append messages
  const sendPromptToBackend = async (promptText) => {
    if (!selectedProduct) {
      setError("No hay dashboard conectado.");
      return;
    }
    setError(null);
    const userMsg = { 
      id: Date.now(), 
      role: "user", 
      text: promptText, 
      time: new Date().toISOString() 
    };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      const reply = await sendChatMessage(promptText, selectedProduct.db_name);

      // determine if reply contains useful info
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
          text: "Lo siento, no puedo ayudarte con eso.",
          emptyAction: true,
          actionLabel: "da click acá",
        };
        setMessages((m) => [...m, botEmpty]);
      } else {
        const replyText = typeof reply === "string" ? reply : JSON.stringify(reply, null, 2);
        const botMsg = { 
          id: Date.now() + 1, 
          role: "bot", 
          text: replyText, 
          time: new Date().toISOString() 
        };
        await new Promise((r) => setTimeout(r, 180));
        setMessages((m) => [...m, botMsg]);
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Error conectando con el servidor");
      const errMsg = { 
        id: Date.now() + 2, 
        role: "bot", 
        text: "Error: " + (err?.message || "Error al solicitar respuesta") 
      };
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
    const followUp = "Indicame en que puedes ayudarme basado en los datos disponibles";
    await sendPromptToBackend(followUp);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) handleSend();
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card} role="region" aria-label="Chat con base de datos">
        <header className={styles.header}>
          <div className={styles.titleWrap}>
            <h1 className={styles.title}>Flow Data Chat</h1>
            <p className={styles.subtitle}>
              Asistente AI - Análisis de Datos
            </p>
          </div>
        </header>

        <main className={styles.chatWindow} aria-live="polite">
          <div className={styles.messages}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`${styles.messageRow} ${
                  m.role === "user" ? styles.rowUser : 
                  m.role === "bot" ? styles.rowBot : 
                  styles.rowSystem
                }`}
              >
                {m.role === "system" ? (
                  <div className={styles.systemBubble}>
                    <div className={styles.welcomeMessage}>
                      {m.text}
                      <div className={styles.quickActions}>
                        <h3 className={styles.quickActionsTitle}>¿Cómo podemos empezar?</h3>
                        <div className={styles.quickActionsGrid}>
                          <button 
                            className={styles.quickActionBtn}
                            onClick={() => handleQuickQuestion("¿En qué me puedes ayudar con el análisis?")}
                          >
                            <span className={styles.quickActionIcon}>💡</span>
                            <span className={styles.quickActionText}>En qué me puedes ayudar</span>
                          </button>
                          <button 
                            className={styles.quickActionBtn}
                            onClick={() => handleQuickQuestion("¿Qué informes puedes generar?")}
                          >
                            <span className={styles.quickActionIcon}>📊</span>
                            <span className={styles.quickActionText}>Qué informes puedes generar</span>
                          </button>
                          <button 
                            className={styles.quickActionBtn}
                            onClick={() => handleQuickQuestion("Analiza las tendencias en los últimos meses")}
                          >
                            <span className={styles.quickActionIcon}>📈</span>
                            <span className={styles.quickActionText}>Analizar tendencias</span>
                          </button>
                          <button 
                            className={styles.quickActionBtn}
                            onClick={() => handleQuickQuestion("Identifica los factores principales que afectan los resultados")}
                          >
                            <span className={styles.quickActionIcon}>🔍</span>
                            <span className={styles.quickActionText}>Identificar factores clave</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : m.role === "bot" && m.emptyAction ? (
                  <div className={styles.bubbleWrap}>
                    <div className={`${styles.bubble} ${styles.botBubble}`}>
                      <div className={styles.botTextInline}>
                        <span>{m.text} , si quieres </span>
                        <button
                          className={styles.actionBtn}
                          onClick={handleEmptyActionClick}
                          aria-label="Solicitar ayuda basada en los datos disponibles"
                        >
                          {m.actionLabel}
                        </button>
                        <span> para indicarte en qué puedo ayudarte.</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.bubbleWrap}>
                    <div className={`${styles.bubble} ${
                      m.role === "user" ? styles.userBubble : styles.botBubble
                    }`}>
                      <pre className={styles.preText}>{m.text}</pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className={styles.footer}>
          <div className={styles.inputWrap}>
            <textarea
              className={styles.textarea}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Escribe tu consulta sobre el análisis de datos..."
              rows={2}
              disabled={loading}
              aria-label="Escribir mensaje"
            />
            <div className={styles.footerRight}>
              <button
                className={`${styles.sendBtn} ${loading ? styles.disabled : ""}`}
                onClick={handleSend}
                disabled={loading}
                aria-label="Enviar mensaje"
              >
                {loading ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.footerNote}>
            <span>Conectado al dashboard • Conexión segura</span>
          </div>
        </footer>
      </div>
    </div>
  );
}