// front-dataflowai/src/components/pages/FormBuilder.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from "react-router-dom";
import defaultStyles from '../../styles/FormBuilder.module.css';
import { obtenerInfoUsuario, createForm } from '../../api/FormBuilder';
import { useTheme } from "../componentes/ThemeContext";

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

const FormBuilder = () => {
  const { theme } = useTheme();
  const [companySegment, setCompanySegment] = useState("");
  const [planId, setPlanId] = useState(null);
  const [planName, setPlanName] = useState("");
  const [rol, setRol] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  
  const [styles, setStyles] = useState(defaultStyles);
  const [usuarioInfo, setUsuarioInfo] = useState(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [preguntas, setPreguntas] = useState([emptyQuestion(0)]);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        const data = await obtenerInfoUsuario();
        if (!mounted || !data) return;

        const nombreCorto = data?.empresa?.nombre_corto ?? "";
        const pid = data?.empresa?.plan?.id ?? null;
        const pName = data?.empresa?.plan?.tipo ?? "";
        const r = data?.rol ?? data?.role ?? null;
        const cid = data?.empresa?.id ?? null;

        setCompanySegment(normalizeSegment(nombreCorto));
        setPlanId(pid);
        setPlanName(pName);
        setRol(r);
        setCompanyId(cid);
        setUsuarioInfo(data || null);
      } catch (err) {
        console.error("No se pudo obtener info de usuario:", err);
        if (mounted) {
          setCompanySegment("");
          setPlanId(null);
          setPlanName("");
          setRol(null);
          setCompanyId(null);
        }
      }
    };

    fetchUser();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadCompanyStyles = async () => {
      if ((planId === 3 || planId === 6) && companyId) {
        try {
          const module = await import(`../../styles/empresas/${companyId}/FormBuilder.module.css`);
          if (mounted && module && (module.default || module)) {
            const cssMap = module.default || module;
            setStyles(cssMap);
            return;
          }
        } catch (err) {
          console.warn(`No se encontró CSS custom para la empresa ${companyId}. Usando estilos por defecto.`, err);
        }
      }

      if (mounted) setStyles(defaultStyles);
    };

    loadCompanyStyles();

    return () => {
      mounted = false;
    };
  }, [planId, companyId]);

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

  const handleCreate = async () => {
    setCreating(true); setError(null); setCreated(null);
    if (!nombre || nombre.trim() === '') { setError('Nombre del formulario requerido'); setCreating(false); return; }

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
      const data = await createForm(payload);
      setCreated(data);
      setNombre(''); setDescripcion(''); setPreguntas([emptyQuestion(0)]);
    } catch (err) {
      console.error('Error creando formulario:', err);
      setError(err.message || 'Error creando formulario');
    } finally {
      setCreating(false);
    }
  };

  // --- FIX: elegir la variante siempre en base al theme (evita fallback oscuro mientras planId está null)
  // además aplicamos fallback defensivo a las clases por si faltan en styles cargado dinámicamente
  const variantClass = theme === "dark"
    ? (styles?.FormBuilderDark || defaultStyles.FormBuilderDark || '')
    : (styles?.FormBuilderLight || defaultStyles.FormBuilderLight || '');

  return (
    <main className={`${styles.FormBuildercontainer} ${variantClass}`} aria-labelledby="form-builder-title">
      
      {/* Header Section */}
      <section className={styles.FormBuilderheader}>
        <div className={styles.FormBuilderheaderContent}>
          <h1 id="form-builder-title" className={styles.FormBuildertitle}>
            Constructor de Formularios
          </h1>
          <p className={styles.FormBuildersubtitle}>
            Crea formularios dinámicos con ramificación condicional
          </p>
        </div>
      </section>

      {/* Main Content */}
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
                value={descripcion} 
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
              <p className={styles.FormBuildersectionSubtitle}>
                Configura las preguntas y la lógica de ramificación
              </p>
            </div>

            {preguntas.map((q, idx) => (
              <div key={idx} className={styles.FormBuilderquestionCard}>
                <div className={styles.FormBuilderquestionHeader}>
                  <div className={styles.FormBuilderquestionBadge}>
                    Pregunta {idx + 1}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeQuestion(idx)}
                    className={styles.FormBuilderremoveBtn}
                    aria-label="Eliminar pregunta"
                  >
                    <span className={styles.FormBuilderremoveIcon}>×</span>
                    Eliminar
                  </button>
                </div>

                {/* Question Text */}
                <div className={styles.FormBuilderinputGroup}>
                  <input 
                    placeholder="Texto de la pregunta..." 
                    value={q.texto} 
                    onChange={(e) => updateQuestion(idx, 'texto', e.target.value)} 
                    className={styles.FormBuilderinput}
                  />
                </div>

                {/* Question Type & Required */}
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

                {/* Options for select/checkbox */}
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
                    <button 
                      type="button" 
                      onClick={() => addOption(idx)}
                      className={styles.FormBuilderaddOptionBtn}
                    >
                      + Agregar opción
                    </button>
                  </div>
                )}

                {/* Branching Section */}
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
                      >
                        <option value="end">Terminar formulario</option>
                        {preguntas.map((_, qi) => (
                          qi === idx ? null : (
                            <option key={qi} value={qi}>Ir a Pregunta {qi + 1}</option>
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

                  <button 
                    type="button" 
                    onClick={() => addBranchRule(idx)}
                    className={styles.FormBuilderaddBranchBtn}
                  >
                    + Agregar regla de ramificación
                  </button>
                </div>
              </div>
            ))}

            {/* Action Buttons */} 
            <div className={styles.FormBuilderactions}>
              <button 
                type="button" 
                onClick={addQuestion}
                className={styles.FormBuilderaddQuestionBtn}
              >
                + Agregar pregunta
              </button>
              <button 
                type="button" 
                onClick={handleCreate} 
                disabled={creating}
                className={styles.FormBuildercreateBtn}
              >
                {creating ? 'Creando formulario...' : 'Crear formulario'}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className={styles.FormBuildererror} role="alert">
                {error}
              </div>
            )}

            {/* Success Message */}
            {created && (
              <div className={styles.FormBuildersuccess}>
                <h4 className={styles.FormBuildersuccessTitle}>¡Formulario creado exitosamente!</h4>
                <div className={styles.FormBuildersuccessInfo}>
                  <p><strong>Nombre:</strong> {created.nombre}</p>
                  <p><strong>Slug:</strong> {created.slug}</p>
                  <p className={styles.FormBuilderurl}>
                    <strong>URL pública:</strong>{' '}
                    <a 
                      target="_blank" 
                      rel="noreferrer" 
                      href={`${import.meta.env.VITE_FRONT_URL || window.location.origin}/forms/${created.slug}`}
                      className={styles.FormBuilderurlLink}
                    >
                      {`${import.meta.env.VITE_FRONT_URL || window.location.origin}/forms/${created.slug}`}
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default FormBuilder;
