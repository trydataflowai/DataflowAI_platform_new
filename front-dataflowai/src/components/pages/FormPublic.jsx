// front-dataflowai/src/components/pages/FormPublic.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getForm, submitForm } from '../../api/FormBuilder';
import { useTheme } from '../componentes/ThemeContext';
import { useCompanyStyles } from '../componentes/ThemeContextEmpresa';
import defaultFormPublic from '../../styles/FormPublic.module.css';

const FormPublic = () => {
  const { slug } = useParams();
  const { theme } = useTheme();

  // obtener estilos (empresa o default) desde CompanyStylesProvider
  const styles = useCompanyStyles('FormPublic', defaultFormPublic);

  // helper defensivo para clases (devuelve clase disponible o string vacío)
  const C = (cls) => (styles && styles[cls]) || (defaultFormPublic && defaultFormPublic[cls]) || '';

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  // values: { "<id_pregunta>": value }
  const [values, setValues] = useState({});
  // visibleIndices: array de índices (0-based en preguntas[]) que se están mostrando, en orden.
  const [visibleIndices, setVisibleIndices] = useState([]);
  const [ended, setEnded] = useState(false); // marca si el flujo decidió "end" o llegó al final
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState(null);
  const [success, setSuccess] = useState(null);

  // focus ref for the last visible question input
  const lastInputRef = useRef(null);

  // Determinar la clase del tema (fall back defensivo)
  const themeClass =
    theme === 'dark'
      ? (styles && (styles.darkTheme || styles.FormPublicDark) ) || (defaultFormPublic.darkTheme || defaultFormPublic.FormPublicDark) || ''
      : (styles && (styles.lightTheme || styles.FormPublicLight) ) || (defaultFormPublic.lightTheme || defaultFormPublic.FormPublicLight) || '';

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await getForm(slug);
        setForm(data);
        // inicializar values con '' o [] para checkbox
        const init = {};
        (data?.preguntas || []).forEach((p) => {
          init[String(p.id_pregunta)] = p.tipo === 'checkbox' ? [] : '';
        });
        setValues(init);

        // comenzar mostrando la primera pregunta (si existe)
        if ((data?.preguntas || []).length > 0) {
          setVisibleIndices([0]);
          setEnded(false);
        } else {
          setVisibleIndices([]);
          setEnded(true);
        }
      } catch (err) {
        console.error('Error fetching form:', err);
        setForm(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    // focus al último input visible (si existe)
    if (lastInputRef.current && typeof lastInputRef.current.focus === 'function') {
      lastInputRef.current.focus();
    }
  }, [visibleIndices, form]);

  if (loading) return <div className={`${C('container')} ${themeClass}`}>Cargando...</div>;
  if (!form) return <div className={`${C('container')} ${themeClass}`}>Formulario no encontrado</div>;

  const preguntas = form.preguntas || [];

  // Evalúa reglas de branching en una pregunta dada y un valor
  const evaluateBranching = (pregunta, answerValue) => {
    if (!pregunta || !pregunta.branching) return null;
    const rules = pregunta.branching || [];

    // checkbox: answerValue es array; aplicamos la primera regla que coincida con cualquier opción marcada
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

    // otros tipos: comparar igualdad por string
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
        // append targetIndex if not present; if present, recortamos hasta su posición
        if (!base.includes(targetIndex)) {
          return [[...base, targetIndex], false];
        } else {
          const pos = base.indexOf(targetIndex);
          return [base.slice(0, pos + 1), false];
        }
      } else {
        // índice inválido -> consideramos flujo terminado (pero no enviamos)
        return [base, true];
      }
    }

    // sin branching -> siguiente secuencial
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
    const pidStr = String(pregunta.id_pregunta);

    // Guardar la respuesta
    setValues((prev) => ({ ...prev, [pidStr]: newValue }));

    // recortar y calcular siguiente (sin enviar)
    setVisibleIndices((prevVisible) => {
      const [newVisible, isEnded] = computeNextVisible(prevVisible, idx, pregunta, newValue);
      setEnded(isEnded);
      return newVisible;
    });
  };

  // manejadores por tipo de input
  const handleTextChange = (idx, pregunta, e) => {
    const val = e.target.value;
    setValues((prev) => ({ ...prev, [String(pregunta.id_pregunta)]: val }));
    // No avanzamos aquí; avanzamos en blur o Enter
  };

  const handleTextBlurOrEnter = (idx, pregunta) => {
    const pidStr = String(pregunta.id_pregunta);
    const val = values[pidStr];
    if (pregunta.requerido && (val === '' || val == null)) {
      setErrors('Por favor responde la pregunta antes de continuar.');
      return;
    }
    handleAnswer(idx, pregunta, val);
  };

  const handleSelectChange = (idx, pregunta, e) => {
    const val = e.target.value;
    setValues((prev) => ({ ...prev, [String(pregunta.id_pregunta)]: val }));
    if (pregunta.requerido && (val === '' || val == null)) {
      setErrors('Por favor selecciona una opción.');
      return;
    }
    handleAnswer(idx, pregunta, val);
  };

  const handleCheckboxToggle = (idx, pregunta, option, checked) => {
    const pidStr = String(pregunta.id_pregunta);
    setValues((prev) => {
      const arr = Array.isArray(prev[pidStr]) ? [...prev[pidStr]] : [];
      if (checked) {
        if (!arr.includes(option)) arr.push(option);
      } else {
        const i = arr.indexOf(option);
        if (i > -1) arr.splice(i, 1);
      }
      const newArr = arr;
      // Actualizamos visibleIndices usando el nuevo valor (no enviamos)
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
    // date, number, email -> advance immediately but do not send
    const val = e.target.value;
    setValues((prev) => ({ ...prev, [String(pregunta.id_pregunta)]: val }));
    if (pregunta.requerido && (val === '' || val == null)) {
      setErrors('Por favor responde la pregunta antes de continuar.');
      return;
    }
    handleAnswer(idx, pregunta, val);
  };

  // Enviar todas las respuestas visitadas al backend (solo cuando el usuario hace click)
  const submitAll = async () => {
    setSending(true);
    setErrors(null);
    try {
      // validación cliente: asegurarnos que todas las preguntas visitadas y requeridas están respondidas
      for (const idx of visibleIndices) {
        const pregunta = preguntas[idx];
        if (!pregunta) continue;
        const pid = String(pregunta.id_pregunta);
        const val = values[pid];
        const isEmpty = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
        if (pregunta.requerido && isEmpty) {
          setErrors(`Falta responder: "${pregunta.texto}"`);
          setSending(false);
          return;
        }
      }

      const answers = {};
      for (const idx of visibleIndices) {
        const pregunta = preguntas[idx];
        if (!pregunta) continue;
        const pid = String(pregunta.id_pregunta);
        const val = values[pid];
        if (val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0)) {
          answers[pid] = val;
        }
      }

      await submitForm(slug, answers);
      setSuccess('Gracias — tu respuesta ha sido registrada.');
      // opcional: resetear estado si quieres que el usuario pueda completar otra vez
      const resetValues = {};
      preguntas.forEach((p) => {
        resetValues[String(p.id_pregunta)] = p.tipo === 'checkbox' ? [] : '';
      });
      setValues(resetValues);
      setVisibleIndices(preguntas.length > 0 ? [0] : []);
      setEnded(false);
    } catch (err) {
      console.error('Error enviando respuestas:', err);
      setErrors(err?.message || 'Error enviando respuestas');
    } finally {
      setSending(false);
    }
  };

  // Render de cada pregunta visible (en orden)
  return (
    <div className={`${C('container')} ${themeClass}`}>
      <div className={C('formContent')}>
        <h1 className={C('formTitle')}>{form.nombre}</h1>
        {form.descripcion && <p className={C('formDescription')}>{form.descripcion}</p>}

        <div className={C('questionsContainer')}>
          {visibleIndices.map((idx, pos) => {
            const pregunta = preguntas[idx];
            if (!pregunta) return null;
            const pidStr = String(pregunta.id_pregunta);
            const value = values[pidStr];

            // El último visible recibe el ref para focus automático
            const isLast = pos === visibleIndices.length - 1;

            return (
              <div key={pidStr} className={C('questionCard')}>
                <label className={C('questionLabel')}>
                  {pregunta.texto} {pregunta.requerido && <span className={C('required')}>*</span>}
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
                'Enviar respuestas'
              )}
            </button>

            {/* mostrar estado si el flujo indicó 'end' o llegó al final (informativo) */}
            {ended && <div className={C('endMessage')}>Has llegado al final. Pulsa "Enviar respuestas" para terminar.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormPublic;
