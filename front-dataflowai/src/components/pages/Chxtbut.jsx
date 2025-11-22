// File: src/components/pages/Chxtbut.jsx
import React, { useEffect, useRef, useState } from "react";
import styles from "../../styles/Chxtbut.module.css";
import { sendChatMessage } from "../../api/ChatPg";
import { obtenerProductosUsuario } from "../../api/ProductoUsuario";

export default function ChatPostgrePremium() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 0, role: "system", text: "Selecciona un dashboard (⋯) para comenzar." },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [showProducts, setShowProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("selectedProduct")) || null;
    } catch {
      return null;
    }
  });

  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleOpenProducts = async () => {
    setShowProducts((s) => !s);
    if (products.length === 0 && !showProducts) {
      try {
        const list = await obtenerProductosUsuario();
        setProducts(list || []);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los dashboards del usuario.");
      }
    }
  };

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    localStorage.setItem("selectedProduct", JSON.stringify(prod));
    setShowProducts(false);

    const infoMsg = {
      id: Date.now(),
      role: "system",
      text: `Conectado al dashboard "${prod.producto}" (tabla: ${prod.db_name}). Ahora puedes escribir.`,
    };
    setMessages((m) => [...m, infoMsg]);
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
    localStorage.removeItem("selectedProduct");
    setMessages((m) => [
      ...m,
      { id: Date.now(), role: "system", text: "Selección eliminada. Selecciona un dashboard para habilitar el chat." },
    ]);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    if (!selectedProduct) {
      setError("Selecciona un dashboard antes de enviar mensajes.");
      return;
    }

    setError(null);
    const userMsg = { id: Date.now(), role: "user", text, time: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const reply = await sendChatMessage(text, selectedProduct.db_name);
      const replyText = typeof reply === "string" ? reply : JSON.stringify(reply, null, 2);
      const botMsg = { id: Date.now() + 1, role: "bot", text: replyText, time: new Date().toISOString() };
      // small UX delay for typing feel
      await new Promise((r) => setTimeout(r, 180));
      setMessages((m) => [...m, botMsg]);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Error conectando con el servidor");
      const errMsg = { id: Date.now() + 2, role: "bot", text: "Error: " + (err?.message || "Error al solicitar respuesta") };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setLoading(false);
    }
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
            <p className={styles.subtitle}>Interroga tu dashboard — diseño light premium</p>
          </div>

          <div className={styles.controls}>
            <div className={styles.productInfo}>
              {selectedProduct ? (
                <>
                  <div className={styles.selectedLabel}>
                    <strong>{selectedProduct.producto}</strong>
                    <span className={styles.dbName}>{selectedProduct.db_name}</span>
                  </div>
                  <button className={styles.clearBtn} onClick={handleClearSelection} aria-label="Quitar selección">
                    Quitar
                  </button>
                </>
              ) : (
                <div className={styles.noProduct}>Ningún dashboard seleccionado</div>
              )}
            </div>

            <button
              className={styles.ellipsisBtn}
              onClick={handleOpenProducts}
              title="Elegir dashboard"
              aria-expanded={showProducts}
            >
              ⋯
            </button>
          </div>
        </header>

        {showProducts && (
          <div className={styles.productList}>
            <div className={styles.productListTitle}>Selecciona un dashboard</div>
            {products.length === 0 ? (
              <div className={styles.productEmpty}>Cargando o no hay dashboards...</div>
            ) : (
              <div className={styles.productGrid}>
                {products.map((p) => {
                  const active = selectedProduct && selectedProduct.db_name === p.db_name;
                  return (
                    <button
                      key={p.id_producto || p.db_name || Math.random()}
                      onClick={() => handleSelectProduct(p)}
                      className={`${styles.productCard} ${active ? styles.productActive : ""}`}
                    >
                      <div className={styles.prodTitle}>{p.producto}</div>
                      <div className={styles.prodMeta}>{p.db_name}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <main className={styles.chatWindow} aria-live="polite">
          <div className={styles.messages}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`${styles.messageRow} ${m.role === "user" ? styles.rowUser : m.role === "bot" ? styles.rowBot : styles.rowSystem}`}
              >
                {m.role === "system" ? (
                  <div className={styles.systemBubble}>{m.text}</div>
                ) : (
                  <div className={styles.bubbleWrap}>
                    <div className={`${styles.bubble} ${m.role === "user" ? styles.userBubble : styles.botBubble}`}>
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
              placeholder={selectedProduct ? "Escribe tu mensaje..." : "Selecciona un dashboard para habilitar el chat..."}
              rows={2}
              disabled={loading || !selectedProduct}
              aria-label="Escribir mensaje"
            />
            <div className={styles.footerRight}>
              <button
                className={`${styles.sendBtn} ${loading || !selectedProduct ? styles.disabled : ""}`}
                onClick={handleSend}
                disabled={loading || !selectedProduct}
                aria-label="Enviar mensaje"
              >
                {loading ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.footerNote}>
            <span>Conexión segura • Diseño light</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
