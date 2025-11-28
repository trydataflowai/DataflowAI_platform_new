// front-dataflowai/src/components/pages/FormsPrevisualizado.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import defaultFormPublic from '../../styles/FormPublic.module.css';
import { useTheme } from '../componentes/ThemeContext';
import { useCompanyStyles } from '../componentes/ThemeContextEmpresa';

/**
 * FormsPrevisualizado.jsx
 * - Usa el objeto `form` que viene en location.state.form (desde el editor).
 * - Reutiliza las clases desde FormPublic.module.css (company styles si existen).
 * - Implementa el flujo con branching idéntico al FormPublic real.
 * - El botón "Enviar respuestas" en esta vista *simula* el envío (muestra success).
 */

const FormsPrevisualizado = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const styles = useCompanyStyles('FormPublic', defaultFormPublic);

  // helper defensivo para clases (devuelve clase disponible o string vacío)
  const C = (cls) => (styles && styles[cls]) || (defaultFormPublic && defaultFormPublic[cls]) || '';

  const form = location?.state?.form || null;
  const returnTo = location?.state?.returnTo || null;

  const lastInputRef = useRef(null);

  const [values, setValues] = useState({});
  const [visibleIndices, setVisibleIndices] = useState([]);
  const [ended, setEnded] = useState(false);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState(null);
  const [success, setSuccess] = useState(null);

  // Inicializar estado cuando llega el form desde location.state
  useEffect(() => {
    if (!form) {
      setValues({});
      setVisibleIndices([]);
      setEnded(false);
      return;
    }

    const init = {};
    (form.preguntas || []).forEach((p) => {
      init[String(p.id_pregunta ?? p.orden ?? Math.random())] = p.tipo === 'checkbox' ? [] : '';
    });
    setValues(init);

    if ((form.preguntas || []).length > 0) {
      setVisibleIndices([0]);
      setEnded(false);
    } else {
      setVisibleIndices([]);
      setEnded(true);
    }
  }, [form]);

  // focus automático al último input visible
  useEffect(() => {
    if (lastInputRef.current && typeof lastInputRef.current.focus === 'function') {
      try { lastInputRef.current.focus(); } catch (e) {}
    }
  }, [visibleIndices]);

  if (!form) {
    return (
      <div className={`${C('container')} ${theme === 'dark' ? C('darkTheme') : C('lightTheme')}`}>
        <div className={C('formContent')}>
          <h2 className={C('formTitle')}>Previsualización</h2>
          <p>No hay datos para previsualizar. Regresa al editor y haz clic en "Previsualizar".</p>
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => {
                if (returnTo) navigate(returnTo, { state: { form: null } });
                else navigate(-1);
              }}
              className={C('submitButton')}
            >
              Volver al editor
            </button>
          </div>
        </div>
      </div>
    );
  }

  const preguntas = form.preguntas || [];

  // Evalúa reglas de branching en una pregunta dada y un valor
  const evaluateBranching = (pregunta, answerValue) => {
    if (!pregunta || !pregunta.branching) return null;
    const rules = pregunta.branching || [];

    if (pregunta.tipo === 'checkbox' && Array.isArray(answerValue)) {
      for (const rule of rules) {
        if (!rule) continue;
        const when = rule.when;
        const goto = rule.goto;
        if (when == null || when === '') continue;
        for (const marked of answerValue) {
          if (String(marked) === String(when)) return goto;
        }
      }
      return null;
    }

    for (const rule of rules) {
      if (!rule) continue;
      const when = rule.when;
      const goto = rule.goto;
      if (when == null) continue;
      if (String(when) === String(answerValue)) return goto;
    }
    return null;
  };

  // recalcula la rama siguiente (sin enviar). Retorna [newVisibleIndices, endedFlag]
  const computeNextVisible = (baseVisible, idx, pregunta, answerValue) => {
    const basePos = baseVisible.indexOf(idx);
    const base = basePos === -1 ? baseVisible : baseVisible.slice(0, basePos + 1);

    const goto = evaluateBranching(pregunta, answerValue);

    if (goto === 'end') {
      return [base, true];
    }

    if (goto != null && goto !== '') {
      const targetIndex = Number(goto);
      if (!Number.isNaN(targetIndex) && targetIndex >= 0 && targetIndex < preguntas.length) {
        if (!base.includes(targetIndex)) {
          return [[...base, targetIndex], false];
        } else {
          const pos = base.indexOf(targetIndex);
          return [base.slice(0, pos + 1), false];
        }
      } else {
        return [base, true];
      }
    }

    const next = idx + 1;
    if (next >= preguntas.length) {
      return [base, true];
    }
    if (!base.includes(next)) {
      return [[...base, next], false];
    } else {
      const pos = base.indexOf(next);
      return [base.slice(0, pos + 1), false];
    }
  };

  // Cuando el usuario responde la pregunta en index `idx`, actualizamos values y recalculamos visibleIndices
  const handleAnswer = (idx, pregunta, newValue) => {
    setErrors(null);
    const pidStr = String(pregunta.id_pregunta ?? pregunta.orden ?? idx);

    setValues((prev) => ({ ...prev, [pidStr]: newValue }));

    setVisibleIndices((prevVisible) => {
      const [newVisible, isEnded] = computeNextVisible(prevVisible, idx, pregunta, newValue);
      setEnded(isEnded);
      return newVisible;
    });
  };

  // handlers por tipo
  const handleTextChange = (idx, pregunta, e) => {
    const val = e.target.value;
    const pidStr = String(pregunta.id_pregunta ?? pregunta.orden ?? idx);
    setValues((prev) => ({ ...prev, [pidStr]: val }));
  };

  const handleTextBlurOrEnter = (idx, pregunta) => {
    const pidStr = String(pregunta.id_pregunta ?? pregunta.orden ?? idx);
    const val = values[pidStr];
    if (pregunta.requerido && (val === '' || val == null)) {
      setErrors('Por favor responde la pregunta antes de continuar.');
      return;
    }
    handleAnswer(idx, pregunta, val);
  };

  const handleSelectChange = (idx, pregunta, e) => {
    const val = e.target.value;
    const pidStr = String(pregunta.id_pregunta ?? pregunta.orden ?? idx);
    setValues((prev) => ({ ...prev, [pidStr]: val }));
    if (pregunta.requerido && (val === '' || val == null)) {
      setErrors('Por favor selecciona una opción.');
      return;
    }
    handleAnswer(idx, pregunta, val);
  };

  const handleCheckboxToggle = (idx, pregunta, option, checked) => {
    const pidStr = String(pregunta.id_pregunta ?? pregunta.orden ?? idx);
    setValues((prev) => {
      const arr = Array.isArray(prev[pidStr]) ? [...prev[pidStr]] : [];
      if (checked) {
        if (!arr.includes(option)) arr.push(option);
      } else {
        const i = arr.indexOf(option);
        if (i > -1) arr.splice(i, 1);
      }
      const newArr = arr;
      setTimeout(() => {
        if (pregunta.requerido && (!newArr || newArr.length === 0)) {
          setErrors('Por favor selecciona al menos una opción.');
          return;
        }
        setErrors(null);
        handleAnswer(idx, pregunta, newArr);
      }, 0);
      return { ...prev, [pidStr]: newArr };
    });
  };

  const handleOtherChange = (idx, pregunta, e) => {
    const val = e.target.value;
    const pidStr = String(pregunta.id_pregunta ?? pregunta.orden ?? idx);
    setValues((prev) => ({ ...prev, [pidStr]: val }));
    if (pregunta.requerido && (val === '' || val == null)) {
      setErrors('Por favor responde la pregunta antes de continuar.');
      return;
    }
    handleAnswer(idx, pregunta, val);
  };

  // En esta vista de previsualización simulamos el envío (no llamamos al backend)
  const submitAll = async () => {
    setSending(true);
    setErrors(null);
    setSuccess(null);

    try {
      for (const idx of visibleIndices) {
        const pregunta = preguntas[idx];
        if (!pregunta) continue;
        const pid = String(pregunta.id_pregunta ?? pregunta.orden ?? idx);
        const val = values[pid];
        const isEmpty = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
        if (pregunta.requerido && isEmpty) {
          setErrors(`Falta responder: "${pregunta.texto || `Pregunta ${idx + 1}`}"`);
          setSending(false);
          return;
        }
      }

      // Simulación: mostramos respuestas en consola y un mensaje de éxito
      const answers = {};
      for (const idx of visibleIndices) {
        const pregunta = preguntas[idx];
        if (!pregunta) continue;
        const pid = String(pregunta.id_pregunta ?? pregunta.orden ?? idx);
        const val = values[pid];
        if (val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0)) {
          answers[pid] = val;
        }
      }
      console.log('Simulated submit (preview):', answers);

      // mostrar success (simulado)
      setSuccess('Simulación enviada — (vista de previsualización)');

      // opcional: resetear (como en el ejemplo)
      const resetValues = {};
      preguntas.forEach((p) => {
        resetValues[String(p.id_pregunta ?? p.orden ?? Math.random())] = p.tipo === 'checkbox' ? [] : '';
      });
      setValues(resetValues);
      setVisibleIndices(preguntas.length > 0 ? [0] : []);
      setEnded(false);
    } catch (err) {
      setErrors(err?.message || 'Error en la simulación');
    } finally {
      setSending(false);
    }
  };

  // tema fallback
  const themeClass =
    theme === 'dark'
      ? (styles && (styles.darkTheme || styles.FormPublicDark)) || defaultFormPublic.darkTheme || defaultFormPublic.FormPublicDark || ''
      : (styles && (styles.lightTheme || styles.FormPublicLight)) || defaultFormPublic.lightTheme || defaultFormPublic.FormPublicLight || '';

  return (
    <div className={`${C('container')} ${themeClass}`}>
      <div className={C('formContent')}>
        <h1 className={C('formTitle')}>{form.nombre || 'Formulario (sin título)'}</h1>
        {form.descripcion && <p className={C('formDescription')}>{form.descripcion}</p>}

        <div className={C('questionsContainer')}>
          {visibleIndices.map((idx, pos) => {
            const pregunta = preguntas[idx];
            if (!pregunta) return null;
            const pidStr = String(pregunta.id_pregunta ?? pregunta.orden ?? idx);
            const value = values[pidStr];
            const isLast = pos === visibleIndices.length - 1;

            return (
              <div key={pidStr} className={C('questionCard')}>
                <label className={C('questionLabel')}>
                  {pregunta.texto || `Pregunta ${idx + 1}`} {pregunta.requerido && <span className={C('required')}>*</span>}
                </label>

                {pregunta.tipo === 'text' && (
                  <input
                    ref={isLast ? lastInputRef : null}
                    className={C('input')}
                    value={value || ''}
                    onChange={(e) => handleTextChange(idx, pregunta, e)}
                    onBlur={() => handleTextBlurOrEnter(idx, pregunta)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTextBlurOrEnter(idx, pregunta);
                      }
                    }}
                  />
                )}

                {pregunta.tipo === 'textarea' && (
                  <textarea
                    ref={isLast ? lastInputRef : null}
                    className={C('textarea')}
                    value={value || ''}
                    onChange={(e) => handleTextChange(idx, pregunta, e)}
                    onBlur={() => handleTextBlurOrEnter(idx, pregunta)}
                  />
                )}

                {pregunta.tipo === 'date' && (
                  <input
                    ref={isLast ? lastInputRef : null}
                    type="date"
                    className={C('input')}
                    value={value || ''}
                    onChange={(e) => handleOtherChange(idx, pregunta, e)}
                  />
                )}

                {pregunta.tipo === 'int' && (
                  <input
                    ref={isLast ? lastInputRef : null}
                    type="number"
                    step="1"
                    className={C('input')}
                    value={value || ''}
                    onChange={(e) => handleOtherChange(idx, pregunta, e)}
                  />
                )}

                {pregunta.tipo === 'float' && (
                  <input
                    ref={isLast ? lastInputRef : null}
                    type="number"
                    step="any"
                    className={C('input')}
                    value={value || ''}
                    onChange={(e) => handleOtherChange(idx, pregunta, e)}
                  />
                )}

                {pregunta.tipo === 'email' && (
                  <input
                    ref={isLast ? lastInputRef : null}
                    type="email"
                    className={C('input')}
                    value={value || ''}
                    onChange={(e) => handleOtherChange(idx, pregunta, e)}
                  />
                )}

                {pregunta.tipo === 'select' && (
                  <select
                    ref={isLast ? lastInputRef : null}
                    className={C('select')}
                    value={value || ''}
                    onChange={(e) => handleSelectChange(idx, pregunta, e)}
                  >
                    <option value="">-- seleccionar --</option>
                    {(pregunta.opciones || []).map((opt, i) => (
                      <option key={i} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                {pregunta.tipo === 'checkbox' && (
                  <div className={C('checkboxGroup')}>
                    {(pregunta.opciones || []).map((opt, i) => {
                      const checked = Array.isArray(value) && value.includes(opt);
                      return (
                        <label key={i} className={C('checkboxLabel')}>
                          <input
                            type="checkbox"
                            value={opt}
                            checked={checked}
                            onChange={(e) => handleCheckboxToggle(idx, pregunta, opt, e.target.checked)}
                            className={C('checkboxInput')}
                          />
                          <span className={C('checkboxText')}>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {pregunta.branching && pregunta.branching.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 13, color: '#555' }}>
                    <strong>Ramificación:</strong>
                    <ul style={{ margin: '6px 0 0 16px' }}>
                      {pregunta.branching.map((b, i) => {
                        let destino = 'Terminar';
                        if (b.goto !== 'end') {
                          const idxNum = Number(b.goto);
                          const destPregunta = preguntas[idxNum];
                          destino = destPregunta ? (`Ir a: ${destPregunta.texto || `Pregunta ${idxNum + 1}`}`) : `Ir a: pregunta ${idxNum + 1}`;
                        }
                        return (
                          <li key={i}>
                            Si <em>{String(b.when)}</em> → {destino}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={C('footer')}>
          {errors && <div className={C('errorMessage')}>{errors}</div>}
          {success && <div className={C('successMessage')}>{success}</div>}

          <div className={C('actions')}>
            <button type="button" onClick={() => submitAll()} disabled={sending} className={C('submitButton')}>
              {sending ? (
                <>
                  <div className={C('spinner')}></div>
                  <span>Enviando...</span>
                </>
              ) : (
                'Enviar respuestas (simulado)'
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (returnTo) navigate(returnTo, { state: { form } });
                else navigate(-1);
              }}
              className={C('secondaryButton') || C('addQuestionBtn') || C('submitButton')}
              style={{ marginLeft: 12 }}
            >
              Volver al editor
            </button>
          </div>

          {ended && <div className={C('endMessage')}>Has llegado al final. Pulsa "Enviar respuestas" para terminar.</div>}
        </div>
      </div>
    </div>
  );
};

export default FormsPrevisualizado;
