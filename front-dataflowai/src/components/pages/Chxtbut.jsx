// File: src/components/pages/Chxtbut.jsx
import React, { useEffect, useRef, useState } from "react";
import darkStylesDefault from "../../styles/ChxtbutDark.module.css";
import lightStylesDefault from "../../styles/ChxtbutLight.module.css";
import { useTheme } from "../componentes/ThemeContext";
import { sendChatMessage } from "../../api/ChatPg";
import { obtenerProductosUsuario } from "../../api/ProductoUsuario";
import { obtenerInfoUsuario } from '../../api/Usuario';

const ALLOWED_USER_IDS = [1, 2, 3];

// Importar estilos de empresas
const empresaLightModules = import.meta.glob(
  '../../styles/empresas/*/ChxtbutLight.module.css',
  { eager: true }
);
const empresaDarkModules = import.meta.glob(
  '../../styles/empresas/*/ChxtbutDark.module.css',
  { eager: true }
);

export default function ChatPostgrePremium() {
  const { theme } = useTheme();
  const [activeStyles, setActiveStyles] = useState(lightStylesDefault);

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

  // Nuevos estados para el sistema de temas
  const [planId, setPlanId] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // OBTENER INFORMACIÓN DEL USUARIO Y PLAN
  useEffect(() => {
    let mounted = true;
    const fetchUserInfo = async () => {
      try {
        const userInfo = await obtenerInfoUsuario();
        if (!mounted || !userInfo) return;

        const pid = userInfo.empresa?.plan?.id ?? null;
        const cid = userInfo.empresa?.id ?? null;
        const id = userInfo?.id ?? null;

        setPlanId(pid);
        setCompanyId(cid);
        setUserId(id);

        const allowed = ALLOWED_USER_IDS.includes(id);
        setIsAllowed(allowed);

        setAuthError(null);
      } catch (err) {
        console.error('Error al obtener info del usuario:', err);
        setPlanId(null);
        setCompanyId(null);
        setUserId(null);
        setIsAllowed(false);
        setAuthError('No se pudo validar usuario');
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    fetchUserInfo();
    return () => { mounted = false; };
  }, []);

  // estilos segun theme/plan/company
  useEffect(() => {
    const useCompanyStyles = (planId === 3 || planId === 6) && companyId;

    const lightKey = `../../styles/empresas/${companyId}/ChxtbutLight.module.css`;
    const darkKey = `../../styles/empresas/${companyId}/ChxtbutDark.module.css`;

    const foundCompanyLight = empresaLightModules[lightKey];
    const foundCompanyDark = empresaDarkModules[darkKey];

    const extract = (mod) => {
      if (!mod) return null;
      return mod.default ?? mod;
    };

    const companyLight = extract(foundCompanyLight);
    const companyDark = extract(foundCompanyDark);

    let chosenStyles = darkStylesDefault;
    if (theme === 'dark') {
      if (useCompanyStyles && companyDark) {
        chosenStyles = companyDark;
      } else {
        chosenStyles = darkStylesDefault;
      }
    } else {
      if (useCompanyStyles && companyLight) {
        chosenStyles = companyLight;
      } else {
        chosenStyles = lightStylesDefault;
      }
    }

    setActiveStyles(chosenStyles);
  }, [theme, planId, companyId]);

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

    if (!isAllowed) {
      setMessages(prev => [
        ...prev,
        { id: Date.now(), role: "system", text: 'No tienes permiso para enviar prompts en este chat.' }
      ]);
      setInput("");
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
    <div className={activeStyles.wrapper}>
      <div className={activeStyles.card} role="region" aria-label="Chat con base de datos">
        <header className={activeStyles.header}>
          <div className={activeStyles.titleWrap}>
            <h1 className={activeStyles.title}>Flow Data Chat</h1>
            <p className={activeStyles.subtitle}>
              Interroga tu dashboard — {theme === 'dark' ? 'diseño dark premium' : 'diseño light premium'}
            </p>
            <p className={activeStyles.authNote} aria-live="polite">
              {authLoading ? 'Validando usuario...' : (
                isAllowed
                  ? `Acceso permitido (user id: ${userId})`
                  : authError ? `Acceso denegado: ${authError}` : `Acceso denegado (user id: ${userId ?? 'desconocido'})`
              )}
            </p>
          </div>

          <div className={activeStyles.controls}>
            <div className={activeStyles.productInfo}>
              {selectedProduct ? (
                <>
                  <div className={activeStyles.selectedLabel}>
                    <strong>{selectedProduct.producto}</strong>
                    <span className={activeStyles.dbName}>{selectedProduct.db_name}</span>
                  </div>
                  <button className={activeStyles.clearBtn} onClick={handleClearSelection} aria-label="Quitar selección">
                    Quitar
                  </button>
                </>
              ) : (
                <div className={activeStyles.noProduct}>Ningún dashboard seleccionado</div>
              )}
            </div>

            <button
              className={activeStyles.ellipsisBtn}
              onClick={handleOpenProducts}
              title="Elegir dashboard"
              aria-expanded={showProducts}
            >
              ⋯
            </button>
          </div>
        </header>

        {showProducts && (
          <div className={activeStyles.productList}>
            <div className={activeStyles.productListTitle}>Selecciona un dashboard</div>
            {products.length === 0 ? (
              <div className={activeStyles.productEmpty}>Cargando o no hay dashboards...</div>
            ) : (
              <div className={activeStyles.productGrid}>
                {products.map((p) => {
                  const active = selectedProduct && selectedProduct.db_name === p.db_name;
                  return (
                    <button
                      key={p.id_producto || p.db_name || Math.random()}
                      onClick={() => handleSelectProduct(p)}
                      className={`${activeStyles.productCard} ${active ? activeStyles.productActive : ""}`}
                    >
                      <div className={activeStyles.prodTitle}>{p.producto}</div>
                      <div className={activeStyles.prodMeta}>{p.db_name}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <main className={activeStyles.chatWindow} aria-live="polite">
          <div className={activeStyles.messages}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`${activeStyles.messageRow} ${m.role === "user" ? activeStyles.rowUser : m.role === "bot" ? activeStyles.rowBot : activeStyles.rowSystem}`}
              >
                {m.role === "system" ? (
                  <div className={activeStyles.systemBubble}>{m.text}</div>
                ) : (
                  <div className={activeStyles.bubbleWrap}>
                    <div className={`${activeStyles.bubble} ${m.role === "user" ? activeStyles.userBubble : activeStyles.botBubble}`}>
                      <pre className={activeStyles.preText}>{m.text}</pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className={activeStyles.footer}>
          <div className={activeStyles.inputWrap}>
            <textarea
              className={activeStyles.textarea}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                authLoading
                  ? 'Validando usuario...'
                  : !isAllowed
                    ? 'No tienes permiso para enviar prompts en este chat'
                    : selectedProduct 
                      ? "Escribe tu mensaje..." 
                      : "Selecciona un dashboard para habilitar el chat..."
              }
              rows={2}
              disabled={loading || !selectedProduct || !isAllowed || authLoading}
              aria-label="Escribir mensaje"
            />
            <div className={activeStyles.footerRight}>
              <button
                className={`${activeStyles.sendBtn} ${loading || !selectedProduct || !isAllowed || authLoading ? activeStyles.disabled : ""}`}
                onClick={handleSend}
                disabled={loading || !selectedProduct || !isAllowed || authLoading}
                aria-label="Enviar mensaje"
              >
                {loading ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>

          {error && <div className={activeStyles.error}>{error}</div>}

          <div className={activeStyles.footerNote}>
            <span>Conexión segura • {theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}