import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import defaultStyles from '../../styles/FormBuilder.module.css';
import { obtenerInfoUsuario } from '../../api/FormBuilder'; // para buildTo / estilos por empresa
import { obtenerFormularioParaEditar, guardarEdicionFormulario } from '../../api/EditarFormulario';
import { useTheme } from '../componentes/ThemeContext';
import { useCompanyStyles } from '../componentes/ThemeContextEmpresa';

const NO_PREFIX = [
  "/homeLogin",
  "/login",
  "/crear-empresa",
  "/crear-usuario",
  "/pagos",
  "/",
];

const normalizeSegment = (nombreCorto) =>
  nombreCorto ? String(nombreCorto).trim().replace(/\s+/g, "") : "";

const QUESTION_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'textarea', label: 'Área de texto' },
  { value: 'date', label: 'Fecha' },
  { value: 'int', label: 'Número entero' },
  { value: 'float', label: 'Número decimal' },
  { value: 'email', label: 'Email' },
  { value: 'select', label: 'Selección' },
  { value: 'checkbox', label: 'Checkbox' },
];

const emptyQuestion = (i = 0) => ({
  texto: '',
  tipo: 'text',
  orden: i,
  requerido: false,
  opciones: [],
  branching: [],
});

// Exit modal (igual que en FormBuilder)
const ExitModal = ({ open, onCancel, onDiscard }) => {
  if (!open) return null;
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modalCard">
        <h3>¿Estás seguro?</h3>
        <p>Si sales ahora perderás los cambios no guardados.</p>
        <div className="modalActions">
          <button className="btnSecondary" onClick={onCancel}>Continuar editando</button>
          <button className="btnDanger" onClick={onDiscard}>Salir y perder cambios</button>
        </div>
      </div>
    </div>
  );
};

const FormsEdit = () => {
  const { theme } = useTheme();
  const styles = useCompanyStyles('FormBuilder', defaultStyles);

  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // company / theme segment (para buildTo)
  const [companySegment, setCompanySegment] = useState("");

  // estado del formulario
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [preguntas, setPreguntas] = useState([emptyQuestion(0)]);

  // exit modal / dirty handling
  const [showExitModal, setShowExitModal] = useState(false);
  const pendingDiscardRef = useRef(false);
  const isDirtyRef = useRef(false);

  // Marca dirty cuando hay cambios relevantes
  useEffect(() => {
    isDirtyRef.current = Boolean(
      (nombre && nombre.trim() !== '') ||
      (descripcion && descripcion.trim() !== '') ||
      (preguntas && preguntas.length > 1) ||
      (preguntas && preguntas.some(q => q.texto || (q.opciones || []).some(Boolean)))
    );
  }, [nombre, descripcion, preguntas]);

  // Recupera companySegment (igual que FormBuilder) para buildTo
  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        const data = await obtenerInfoUsuario();
        if (!mounted || !data) return;
        const nombreCorto = data?.empresa?.nombre_corto ?? "";
        setCompanySegment(normalizeSegment(nombreCorto));
      } catch (err) {
        if (!mounted) return;
        setCompanySegment('');
      }
    };
    fetchUser();
    return () => { mounted = false; };
  }, []);

  // buildTo (idéntico a FormBuilder) para respetar rutas por empresa si las usas
  const buildTo = (to) => {
    const [baseRaw, hash] = to.split("#");
    const base = baseRaw.startsWith("/") ? baseRaw : `/${baseRaw}`;

    if (NO_PREFIX.includes(base)) {
      return hash ? `${base}#${hash}` : base;
    }

    if (companySegment && base.startsWith(`/${companySegment}`)) {
      return hash ? `${base}#${hash}` : base;
    }

    const fullBase = companySegment ? `/${companySegment}${base}` : base;
    return hash ? `${fullBase}#${hash}` : fullBase;
  };

  // fetch formulario (GET)
  useEffect(() => {
    let mounted = true;
    const fetchForm = async () => {
      try {
        setLoading(true);
        const data = await obtenerFormularioParaEditar(slug);
        if (!mounted) return;
        setNombre(data.nombre || '');
        setDescripcion(data.descripcion || '');
        if (Array.isArray(data.preguntas) && data.preguntas.length > 0) {
          const mapped = data.preguntas.map((p, i) => ({
            texto: p.texto || '',
            tipo: p.tipo || 'text',
            orden: p.orden != null ? p.orden : i,
            requerido: !!p.requerido,
            opciones: Array.isArray(p.opciones) ? p.opciones : [],
            branching: Array.isArray(p.branching) ? p.branching.map(b => ({ ...b })) : [],
          }));
          setPreguntas(mapped);
        } else {
          setPreguntas([emptyQuestion(0)]);
        }
      } catch (err) {
        setError(err.message || 'Error al cargar formulario');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchForm();
    return () => { mounted = false; };
  }, [slug]);

  // Manejo de navegación/refresh (beforeunload + popstate)
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    try { window.history.pushState({ ms: Date.now() }, ''); } catch (err) {}

    const onPopState = () => {
      if (!isDirtyRef.current) return;
      setShowExitModal(true);
      try { window.history.pushState({ ms: Date.now() }, ''); } catch (err) {}
      pendingDiscardRef.current = true;
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  const handleDiscard = () => {
    isDirtyRef.current = false;
    setShowExitModal(false);
    if (pendingDiscardRef.current) {
      pendingDiscardRef.current = false;
      window.history.back();
    }
  };

  const handleCancelExit = () => {
    setShowExitModal(false);
    pendingDiscardRef.current = false;
  };

  // Preguntas: añadir / eliminar / actualizar
  const addQuestion = () => setPreguntas(prev => [...prev, emptyQuestion(prev.length)]);
  
  const removeQuestion = (index) => {
    setPreguntas(prev => {
      const next = prev.filter((_, i) => i !== index).map((q, i) => ({ ...q, orden: i }));
      return next.map(q => {
        const nextBranching = (q.branching || []).map(b => {
          if (b.goto === 'end') return b;
          const goto = Number(b.goto);
          if (goto === index) return { ...b, goto: 'end' };
          if (goto > index) return { ...b, goto: goto - 1 };
          return b;
        });
        return { ...q, branching: nextBranching };
      });
    });
  };

  const updateQuestion = (index, field, value) => setPreguntas(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));

  // Opciones
  const addOption = (qIndex) => setPreguntas(prev => prev.map((q, i) => i === qIndex ? { ...q, opciones: [...(q.opciones || []), ''] } : q));
  
  const updateOption = (qIndex, optIndex, value) => setPreguntas(prev => prev.map((q, i) => {
    if (i !== qIndex) return q;
    const opciones = [...(q.opciones || [])]; opciones[optIndex] = value;
    return { ...q, opciones };
  }));
  
  const removeOption = (qIndex, optIndex) => setPreguntas(prev => prev.map((q, i) => {
    if (i !== qIndex) return q;
    const opciones = [...(q.opciones || [])]; opciones.splice(optIndex, 1);
    const branching = (q.branching || []).filter(b => b.when !== (q.opciones || [])[optIndex]);
    return { ...q, opciones, branching };
  }));

  // Branching rules
  const addBranchRule = (qIndex) => {
    setPreguntas(prev => prev.map((q, i) => i === qIndex ? { ...q, branching: [...(q.branching || []), { when: '', goto: 'end' }] } : q));
  };
  
  const updateBranchRule = (qIndex, ruleIndex, field, value) => {
    setPreguntas(prev => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const branching = [...(q.branching || [])];
      branching[ruleIndex] = { ...branching[ruleIndex], [field]: value };
      return { ...q, branching };
    }));
  };
  
  const removeBranchRule = (qIndex, ruleIndex) => {
    setPreguntas(prev => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const branching = [...(q.branching || [])];
      branching.splice(ruleIndex, 1);
      return { ...q, branching };
    }));
  };

  // PREVISUALIZAR: arma payload y navega a FormPrevisualizado
  const handlePreview = () => {
    const payloadPreview = {
      nombre: nombre.trim() || 'Formulario sin título',
      descripcion: descripcion || '',
      preguntas: preguntas.map((p, idx) => ({
        texto: p.texto || `Pregunta ${idx + 1}`,
        tipo: p.tipo,
        orden: idx,
        requerido: !!p.requerido,
        opciones: (p.tipo === 'select' || p.tipo === 'checkbox') ? (p.opciones || []).filter(Boolean) : null,
        branching: (p.branching || []).map(b => ({ when: b.when, goto: b.goto }))
      }))
    };

    navigate(buildTo("/FormPrevisualizado"), { state: { form: payloadPreview, returnTo: location.pathname } });
  };

  // GUARDAR CAMBIOS (PUT)
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (!nombre || nombre.trim() === '') {
      setError('Nombre del formulario requerido');
      setSaving(false);
      return;
    }

    const payload = {
      nombre: nombre.trim(),
      descripcion: descripcion || null,
      preguntas: preguntas.map((p, idx) => ({
        texto: p.texto || `Pregunta ${idx + 1}`,
        tipo: p.tipo,
        orden: idx,
        requerido: !!p.requerido,
        opciones: (p.tipo === 'select' || p.tipo === 'checkbox') ? (p.opciones || []).filter(Boolean) : null,
        branching: (p.branching || []).map(b => ({ when: b.when, goto: b.goto }))
      }))
    };

    try {
      const updated = await guardarEdicionFormulario(slug, payload);
      setSuccess('Cambios guardados correctamente');
      isDirtyRef.current = false;
      // Actualizar estado local con la respuesta (por si backend normaliza algo)
      setNombre(updated.nombre || nombre);
      setDescripcion(updated.descripcion || descripcion);
      if (Array.isArray(updated.preguntas) && updated.preguntas.length > 0) {
        const mapped = updated.preguntas.map((p, i) => ({
          texto: p.texto || '',
          tipo: p.tipo || 'text',
          orden: p.orden != null ? p.orden : i,
          requerido: !!p.requerido,
          opciones: Array.isArray(p.opciones) ? p.opciones : [],
          branching: Array.isArray(p.branching) ? p.branching.map(b => ({ ...b })) : [],
        }));
        setPreguntas(mapped);
      }

      // --- REDIRIGIR AL LISTADO (ruta que usas en tus Routes con p("/FormsListado"))
      navigate(buildTo("/FormsListado"), { replace: true });

    } catch (err) {
      setError(err.message || 'Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className={styles.FormBuildercontainer || ''} style={{ padding: 20 }}>
        <p>Cargando formulario...</p>
      </main>
    );
  }

  // Variante de tema
  const variantClass = theme === "dark"
    ? (styles?.FormBuilderDark || defaultStyles.FormBuilderDark || '')
    : (styles?.FormBuilderLight || defaultStyles.FormBuilderLight || '');

  const containerClass = styles?.FormBuildercontainer || defaultStyles.FormBuildercontainer || '';

  return (
    <main className={`${containerClass} ${variantClass}`} aria-labelledby="form-builder-title" style={{ paddingBottom: 40 }}>
      <section className={styles.FormBuilderheader}>
        <div className={styles.FormBuilderheaderContent}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', justifyContent: 'space-between' }}>
            <div>
              <h1 id="form-builder-title" className={styles.FormBuildertitle}>Editar Formulario</h1>
              <p className={styles.FormBuildersubtitle}>Modifica el formulario y su lógica de ramificación</p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handlePreview}
                className={styles.FormBuilderpreviewBtn || styles.FormBuildercreateBtn}
                title="Previsualizar formulario"
              >
                Previsualizar
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={styles.FormBuildercreateBtn}
              >
                {saving ? 'Guardando cambios...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.FormBuildercontent}>
        <div className={styles.FormBuilderformSection}>
          {/* Form Info */}
          <div className={styles.FormBuildercard}>
            <h3 className={styles.FormBuildercardTitle}>Información del Formulario</h3>

            <div className={styles.FormBuilderinputGroup}>
              <label className={styles.FormBuilderlabel}>Nombre del formulario</label>
              <input
                className={styles.FormBuilderinput}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Encuesta de satisfacción de clientes"
              />
            </div>

            <div className={styles.FormBuilderinputGroup}>
              <label className={styles.FormBuilderlabel}>Descripción</label>
              <textarea
                className={styles.FormBuildertextarea}
                value={descripcion || ''}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe el propósito de este formulario..."
                rows="3"
              />
            </div>
          </div>

          {/* Questions Section */}
          <div className={styles.FormBuilderquestionsSection}>
            <div className={styles.FormBuildersectionHeader}>
              <h3 className={styles.FormBuildersectionTitle}>Preguntas</h3>
              <p className={styles.FormBuildersectionSubtitle}>Configura las preguntas y la lógica de ramificación</p>
            </div>

            {preguntas.map((q, idx) => (
              <div key={idx} className={styles.FormBuilderquestionCard}>
                <div className={styles.FormBuilderquestionHeader}>
                  <div className={styles.FormBuilderquestionBadge}>Pregunta {idx + 1}</div>

                  <button
                    type="button"
                    onClick={() => removeQuestion(idx)}
                    className={styles.FormBuilderremoveBtn}
                    aria-label="Eliminar pregunta"
                  >
                    <span className={styles.FormBuilderremoveIcon}>×</span> Eliminar
                  </button>
                </div>

                <div className={styles.FormBuilderinputGroup}>
                  <input
                    placeholder="Texto de la pregunta..."
                    value={q.texto}
                    onChange={(e) => updateQuestion(idx, 'texto', e.target.value)}
                    className={styles.FormBuilderinput}
                  />
                </div>

                <div className={styles.FormBuilderquestionConfig}>
                  <select
                    value={q.tipo}
                    onChange={(e) => updateQuestion(idx, 'tipo', e.target.value)}
                    className={styles.FormBuilderselect}
                  >
                    {QUESTION_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>

                  <label className={styles.FormBuildercheckboxLabel}>
                    <input
                      type="checkbox"
                      checked={q.requerido}
                      onChange={(e) => updateQuestion(idx, 'requerido', e.target.checked)}
                      className={styles.FormBuildercheckbox}
                    />
                    <span className={styles.FormBuildercheckmark}></span>
                    Requerido
                  </label>
                </div>

                {(q.tipo === 'select' || q.tipo === 'checkbox') && (
                  <div className={styles.FormBuilderoptionsSection}>
                    <h4 className={styles.FormBuilderoptionsTitle}>Opciones</h4>
                    {(q.opciones || []).map((opt, oi) => (
                      <div key={oi} className={styles.FormBuilderoptionRow}>
                        <input
                          value={opt}
                          onChange={(e) => updateOption(idx, oi, e.target.value)}
                          className={styles.FormBuilderinput}
                          placeholder={`Opción ${oi + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(idx, oi)}
                          className={styles.FormBuilderremoveOptionBtn}
                          aria-label="Eliminar opción"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addOption(idx)} className={styles.FormBuilderaddOptionBtn}>
                      + Agregar opción
                    </button>
                  </div>
                )}

                {/* Branching */}
                <div className={styles.FormBuilderbranchingSection}>
                  <h4 className={styles.FormBuilderbranchingTitle}>Ramificación Condicional</h4>
                  <p className={styles.FormBuilderbranchingDesc}>
                    Define reglas: "Si la respuesta es X → ir a la pregunta Y". Usa "end" para terminar el formulario.
                  </p>

                  {(q.branching || []).map((rule, ri) => (
                    <div key={ri} className={styles.FormBuilderbranchRule}>
                      {(q.tipo === 'select' || q.tipo === 'checkbox') ? (
                        <select
                          className={styles.FormBuilderselect}
                          value={rule.when}
                          onChange={(e) => updateBranchRule(idx, ri, 'when', e.target.value)}
                        >
                          <option value=''>-- seleccionar valor --</option>
                          {(q.opciones || []).map((opt, oi) => (
                            <option key={oi} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className={styles.FormBuilderinput}
                          placeholder="Valor que dispara la regla"
                          value={rule.when}
                          onChange={(e) => updateBranchRule(idx, ri, 'when', e.target.value)}
                        />
                      )}

                      <select
                        className={styles.FormBuilderselect}
                        value={String(rule.goto)}
                        onChange={(e) => updateBranchRule(idx, ri, 'goto', e.target.value)}
                        aria-label={`Destino de la regla ${ri + 1}`}
                      >
                        <option value="end">Terminar formulario</option>
                        {preguntas.map((p, qi) => (
                          qi === idx ? null : (
                            <option key={qi} value={String(qi)}>
                              {p.texto ? `Ir a: ${p.texto}` : `Ir a: Pregunta ${qi + 1}`}
                            </option>
                          )
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => removeBranchRule(idx, ri)}
                        className={styles.FormBuilderremoveBranchBtn}
                        aria-label="Eliminar regla"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  <button type="button" onClick={() => addBranchRule(idx)} className={styles.FormBuilderaddBranchBtn}>
                    + Agregar regla de ramificación
                  </button>
                </div>
              </div>
            ))}

            <div className={styles.FormBuilderactions}>
              <button type="button" onClick={addQuestion} className={styles.FormBuilderaddQuestionBtn}>
                + Agregar pregunta
              </button>
            </div>

            {error && <div className={styles.FormBuildererror} role="alert">{error}</div>}
            {success && <div className={styles.FormBuildersuccess}><strong>{success}</strong></div>}
          </div>
        </div>
      </section>

      <ExitModal open={showExitModal} onCancel={handleCancelExit} onDiscard={handleDiscard} />

      <style>{`
        .modalOverlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);z-index:9999}
        .modalCard{background:#fff;padding:20px;border-radius:8px;max-width:420px;width:90%;box-shadow:0 8px 24px rgba(0,0,0,0.12);}
        .modalCard h3{margin:0 0 8px;font-size:18px}
        .modalCard p{margin:0 0 16px;color:#333}
        .modalActions{display:flex;gap:8px;justify-content:flex-end}
        .btnSecondary{background:#f3f4f6;border:1px solid #d1d5db;padding:8px 12px;border-radius:6px}
        .btnDanger{background:#ef4444;color:#fff;border:none;padding:8px 12px;border-radius:6px}
      `}</style>
    </main>
  );
};

export default FormsEdit;
