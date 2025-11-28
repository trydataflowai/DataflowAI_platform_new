// front-dataflowai/src/components/pages/FormPrevisualizar.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from '../../styles/FormBuilder.module.css'; // uso de estilos del form builder para consistencia

const FormsPrevisualizado = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const form = location?.state?.form || null;
  const returnTo = location?.state?.returnTo || null;

  // estado para respuestas (opcional, solo para previsualizar interacción)
  const [answers, setAnswers] = useState(() => {
    if (!form?.preguntas) return {};
    const initial = {};
    form.preguntas.forEach((p, i) => {
      if (p.tipo === 'checkbox') initial[i] = [];
      else initial[i] = '';
    });
    return initial;
  });

  if (!form) {
    return (
      <div className={styles.FormBuildercontainer || ''} style={{ padding: 24 }}>
        <h2>Previsualización</h2>
        <p>No hay datos para previsualizar. Regresa al editor y haz clic en "Previsualizar".</p>
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => {
              // si tengo returnTo intento volver ahí, sino back
              if (returnTo) navigate(returnTo, { state: { form: null } });
              else navigate(-1);
            }}
            className={styles.FormBuildercreateBtn}
          >
            Volver al editor
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (index, value, tipo, optionValue) => {
    setAnswers(prev => {
      const next = { ...prev };
      if (tipo === 'checkbox') {
        const arr = new Set(next[index] || []);
        if (arr.has(optionValue)) arr.delete(optionValue);
        else arr.add(optionValue);
        next[index] = Array.from(arr);
      } else {
        next[index] = value;
      }
      return next;
    });
  };

  const handleSimularSubmit = (e) => {
    e.preventDefault();
    // simplemente mostramos las respuestas en consola — puedes conectarlo a un submit real si quieres
    console.log('Respuestas simuladas:', answers);
    alert('Simulación enviada (revisa la consola).');
  };

  const handleVolverAlEditor = () => {
    // si tenemos returnTo (ruta de donde vino), navegamos a esa ruta pasando el mismo form en state
    if (returnTo) {
      navigate(returnTo, { state: { form } });
    } else {
      // fallback: ir atrás en historial (no garantiza que el editor reciba el state)
      navigate(-1);
    }
  };

  return (
    <main className={styles.FormBuildercontainer || ''} style={{ padding: 20 }}>
      <section className={styles.FormBuilderheader}>
        <div className={styles.FormBuilderheaderContent} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className={styles.FormBuildertitle}>{form.nombre || 'Formulario (sin título)'}</h1>
            {form.descripcion && <p className={styles.FormBuildersubtitle}>{form.descripcion}</p>}
          </div>
          <div>
            <button onClick={handleVolverAlEditor} className={styles.FormBuilderaddQuestionBtn}>Volver al editor</button>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <form onSubmit={handleSimularSubmit}>
          {form.preguntas && form.preguntas.length > 0 ? (
            form.preguntas.map((p, idx) => (
              <div key={idx} className={styles.FormBuilderquestionCard} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
                  {p.texto || `Pregunta ${idx + 1}`} {p.requerido ? <span aria-hidden="true" style={{ color: 'red' }}>*</span> : null}
                </label>

                {/* render según tipo */}
                {p.tipo === 'text' && (
                  <input
                    type="text"
                    className={styles.FormBuilderinput}
                    value={answers[idx] || ''}
                    onChange={(e) => handleChange(idx, e.target.value, p.tipo)}
                    placeholder={p.texto || `Pregunta ${idx + 1}`}
                    required={!!p.requerido}
                  />
                )}

                {p.tipo === 'textarea' && (
                  <textarea
                    className={styles.FormBuildertextarea}
                    value={answers[idx] || ''}
                    onChange={(e) => handleChange(idx, e.target.value, p.tipo)}
                    rows={4}
                    placeholder={p.texto || `Pregunta ${idx + 1}`}
                    required={!!p.requerido}
                  />
                )}

                {p.tipo === 'date' && (
                  <input
                    type="date"
                    className={styles.FormBuilderinput}
                    value={answers[idx] || ''}
                    onChange={(e) => handleChange(idx, e.target.value, p.tipo)}
                    required={!!p.requerido}
                  />
                )}

                {p.tipo === 'int' && (
                  <input
                    type="number"
                    step="1"
                    className={styles.FormBuilderinput}
                    value={answers[idx] || ''}
                    onChange={(e) => handleChange(idx, e.target.value, p.tipo)}
                    required={!!p.requerido}
                  />
                )}

                {p.tipo === 'float' && (
                  <input
                    type="number"
                    step="any"
                    className={styles.FormBuilderinput}
                    value={answers[idx] || ''}
                    onChange={(e) => handleChange(idx, e.target.value, p.tipo)}
                    required={!!p.requerido}
                  />
                )}

                {p.tipo === 'email' && (
                  <input
                    type="email"
                    className={styles.FormBuilderinput}
                    value={answers[idx] || ''}
                    onChange={(e) => handleChange(idx, e.target.value, p.tipo)}
                    required={!!p.requerido}
                  />
                )}

                {p.tipo === 'select' && (
                  <select
                    className={styles.FormBuilderselect}
                    value={answers[idx] || ''}
                    onChange={(e) => handleChange(idx, e.target.value, p.tipo)}
                    required={!!p.requerido}
                  >
                    <option value="">-- seleccionar --</option>
                    {(p.opciones || []).map((opt, oi) => (
                      <option key={oi} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {p.tipo === 'checkbox' && (
                  <div>
                    {(p.opciones || []).map((opt, oi) => {
                      const checked = (answers[idx] || []).includes(opt);
                      return (
                        <label key={oi} style={{ display: 'block', marginBottom: 6 }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleChange(idx, null, p.tipo, opt)}
                          />{' '}
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* mostrar reglas de ramificación si existen (solo como info visual) */}
                {p.branching && p.branching.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 13, color: '#555' }}>
                    <strong>Ramificación:</strong>
                    <ul style={{ margin: '6px 0 0 16px' }}>
                      {p.branching.map((b, i) => (
                        <li key={i}>
                          Si <em>{String(b.when)}</em> → {b.goto === 'end' ? 'Terminar' : `Ir a pregunta ${Number(b.goto) + 1}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>No hay preguntas configuradas.</p>
          )}

          <div style={{ marginTop: 12 }}>
            <button type="submit" className={styles.FormBuildercreateBtn} style={{ marginRight: 8 }}>
              Simular envío
            </button>
            <button type="button" onClick={handleVolverAlEditor} className={styles.FormBuilderaddQuestionBtn}>
              Volver al editor
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default FormsPrevisualizado;
