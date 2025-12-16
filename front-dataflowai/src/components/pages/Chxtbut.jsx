import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../componentes/ThemeContext";
import { useCompanyStyles } from "../componentes/ThemeContextEmpresa";
import defaultStyles from '../../styles/Chxtbut.module.css';
import { sendChatMessage, fetchDashboardContexts } from "../../api/ChatPg";
import { obtenerInfoUsuario } from "../../api/Usuario";

const normalizeSegment = (nombreCorto) =>
  nombreCorto ? String(nombreCorto).trim().replace(/\s+/g, "") : "";

export default function ChatPostgre() {
  const { theme } = useTheme();
  const styles = useCompanyStyles('Chxtbut', defaultStyles);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 0, role: "system", text: "Selecciona un dashboard para comenzar." },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contexts, setContexts] = useState([]);
  const [showContexts, setShowContexts] = useState(false);
  const [selectedContext, setSelectedContext] = useState(null);

  const [companySegment, setCompanySegment] = useState("");
  const [planId, setPlanId] = useState(null);
  const [companyId, setCompanyId] = useState(null);

  const messagesEndRef = useRef(null);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

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
    return () => { mounted = false; };
  }, []);

  const handleOpenContexts = async () => {
    if (contexts.length === 0 && !showContexts) {
      try {
        const list = await fetchDashboardContexts();
        // list es array de DashboardContext (ver serializer backend)
        setContexts(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los dashboards.");
      }
    }
    setShowContexts(!showContexts);
  };

  const handleSelectContext = (ctx) => {
    setSelectedContext(ctx);
    try { localStorage.setItem("selectedContext", JSON.stringify(ctx)); } catch {}
    setShowContexts(false);
    const infoMsg = {
      id: Date.now(),
      role: "system",
      text: `Conectado al dashboard "${ctx.dashboard_name}". Ahora puedes hacer preguntas.`,
    };
    setMessages((m) => [...m, infoMsg]);
  };

  const handleClearSelection = () => {
    setSelectedContext(null);
    try { localStorage.removeItem("selectedContext"); } catch {}
    setMessages([{ id: Date.now(), role: "system", text: "Dashboard desconectado. Selecciona uno para comenzar." }]);
  };

  const sendPromptToBackend = async (promptText) => {
    if (!selectedContext) {
      setError("Selecciona un dashboard primero.");
      return;
    }
    setError(null);
    const userMsg = { id: Date.now(), role: "user", text: promptText };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      const reply = await sendChatMessage(selectedContext.id_registro, promptText);

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

  const variantClass = theme === "dark"
    ? (styles?.ChatpostgreDark || defaultStyles.ChatpostgreDark)
    : (styles?.ChatpostgreLight || defaultStyles.ChatpostgreLight);

  return (
    <main className={`${styles.Chatpostgrecontainer || defaultStyles.Chatpostgrecontainer} ${variantClass}`}>
      <header className={styles.Chatpostgreheader || defaultStyles.Chatpostgreheader}>
        <div className={styles.ChatpostgreheaderMain || defaultStyles.ChatpostgreheaderMain}>
          <div className={styles.ChatpostgreheaderTitle || defaultStyles.ChatpostgreheaderTitle}>
            <h1 className={styles.Chatpostgretitle || defaultStyles.Chatpostgretitle}>Data Chat</h1>
            <p className={styles.Chatpostgresubtitle || defaultStyles.Chatpostgresubtitle}>Consulta inteligente de datos</p>
          </div>
          <div className={styles.ChatpostgreheaderActions || defaultStyles.ChatpostgreheaderActions}>
            {selectedContext ? (
              <div className={styles.ChatpostgreproductBadge || defaultStyles.ChatpostgreproductBadge}>
                <span className={styles.ChatpostgreproductName || defaultStyles.ChatpostgreproductName}>{selectedContext.dashboard_name}</span>
                <button className={styles.ChatpostgreclearButton || defaultStyles.ChatpostgreclearButton} onClick={handleClearSelection} aria-label="Desconectar dashboard">×</button>
              </div>
            ) : null}
            <button className={styles.ChatpostgreproductsToggle || defaultStyles.ChatpostgreproductsToggle} onClick={handleOpenContexts} aria-expanded={showContexts}>
              {showContexts ? '▲' : '▼'} Dashboards
            </button>
          </div>
        </div>

        {showContexts && (
          <div className={styles.ChatpostgreproductsCompact || defaultStyles.ChatpostgreproductsCompact}>
            <div className={styles.ChatpostgreproductsList || defaultStyles.ChatpostgreproductsList}>
              {contexts.length === 0 ? (
                <div className={styles.ChatpostgreproductsEmpty || defaultStyles.ChatpostgreproductsEmpty}>Cargando dashboards...</div>
              ) : (
                contexts.map((ctx) => {
                  const isActive = selectedContext && selectedContext.id_registro === ctx.id_registro;
                  return (
                    <button
                      key={ctx.id_registro}
                      className={`${styles.ChatpostgreproductItem || defaultStyles.ChatpostgreproductItem} ${isActive ? (styles.ChatpostgreproductItemActive || defaultStyles.ChatpostgreproductItemActive) : ''}`}
                      onClick={() => handleSelectContext(ctx)}
                    >
                      <span className={styles.ChatpostgreproductItemName || defaultStyles.ChatpostgreproductItemName}>{ctx.dashboard_name}</span>
                      <span className={styles.ChatpostgreproductItemDb || defaultStyles.ChatpostgreproductItemDb}>ID {ctx.id_registro}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </header>

      <section className={styles.ChatpostgrechatSection || defaultStyles.ChatpostgrechatSection}>
        <div className={styles.Chatpostgremessages || defaultStyles.Chatpostgremessages}>
          {messages.map((message) => (
            <div key={message.id} className={`${styles.Chatpostgremessage || defaultStyles.Chatpostgremessage} ${message.role === 'user' ? (styles.ChatpostgremessageUser || defaultStyles.ChatpostgremessageUser) : message.role === 'bot' ? (styles.ChatpostgremessageBot || defaultStyles.ChatpostgremessageBot) : (styles.ChatpostgremessageSystem || defaultStyles.ChatpostgremessageSystem)}`}>
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
                      <button className={styles.ChatpostgreactionButton || defaultStyles.ChatpostgreactionButton} onClick={handleEmptyActionClick}>{message.actionLabel}</button>{' '}
                      para más ayuda.
                    </p>
                  </div>
                </div>
              ) : (
                <div className={styles.ChatpostgremessageContent || defaultStyles.ChatpostgremessageContent}>
                  <div className={styles.ChatpostgremessageHeader || defaultStyles.ChatpostgremessageHeader}>
                    <span className={styles.ChatpostgremessageRole || defaultStyles.ChatpostgremessageRole}>{message.role === 'user' ? 'Tú' : 'Asistente'}</span>
                  </div>
                  <pre className={styles.ChatpostgremessageText || defaultStyles.ChatpostgremessageText}>{message.text}</pre>
                </div>
              )}
            </div>
          ))}
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

      <footer className={styles.ChatpostgreinputSection || defaultStyles.ChatpostgreinputSection}>
        <div className={styles.ChatpostgreinputContainer || defaultStyles.ChatpostgreinputContainer}>
          <div className={styles.ChatpostgreinputWrapper || defaultStyles.ChatpostgreinputWrapper}>
            <textarea className={styles.Chatpostgretextarea || defaultStyles.Chatpostgretextarea}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={ selectedContext ? "Escribe tu pregunta sobre los datos..." : "Selecciona un dashboard para comenzar" }
              rows={2}
              disabled={loading || !selectedContext}
            />
            <button className={`${styles.ChatpostgresendButton || defaultStyles.ChatpostgresendButton} ${loading || !selectedContext ? (styles.ChatpostgresendButtonDisabled || defaultStyles.ChatpostgresendButtonDisabled) : ''}`}
              onClick={handleSend} disabled={loading || !selectedContext}>
              {loading ? (<span className={styles.Chatpostgrespinner || defaultStyles.Chatpostgrespinner}></span>) : (<span className={styles.ChatpostgresendIcon || defaultStyles.ChatpostgresendIcon}>↑</span>)}
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
