// front-dataflowai/src/components/pages/FormBuilder.jsx
import React, { useEffect, useState } from 'react';
import styles from '../../styles/CreacionUsuario.module.css';
import { obtenerInfoUsuario, createForm } from '../../api/FormBuilder';

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
  branching: [], // new -> array of { when: <value>, goto: <questionIndex or 'end'> }
});

const FormBuilder = () => {
  const [usuarioInfo, setUsuarioInfo] = useState(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [preguntas, setPreguntas] = useState([emptyQuestion(0)]);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await obtenerInfoUsuario();
        setUsuarioInfo(user || null);
      } catch (err) {
        console.warn('No se pudo obtener info de usuario (quizá no autenticado):', err);
      }
    })();
  }, []);

  const addQuestion = () => setPreguntas(prev => [...prev, emptyQuestion(prev.length)]);
  const removeQuestion = (index) => {
    setPreguntas(prev => {
      const next = prev.filter((_, i) => i !== index).map((q, i) => ({ ...q, orden: i }));
      // If someone removed a question, update branching references that pointed to later indices:
      return next.map(q => {
        const nextBranching = (q.branching || []).map(b => {
          if (b.goto === 'end') return b;
          const goto = Number(b.goto);
          if (goto === index) return { ...b, goto: 'end' }; // if target removed, go to end
          if (goto > index) return { ...b, goto: goto - 1 }; // shift indexes down
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
    // Also cleanup branching that references removed option value (best-effort)
    const branching = (q.branching || []).filter(b => b.when !== (q.opciones || [])[optIndex]);
    return { ...q, opciones, branching };
  }));

  // Branching helpers
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

    // Prepare payload: include branching as-is
    const payload = {
      nombre: nombre.trim(),
      descripcion: descripcion || null,
      preguntas: preguntas.map((p, idx) => ({
        texto: p.texto || `Pregunta ${idx + 1}`,
        tipo: p.tipo,
        orden: idx,
        requerido: !!p.requerido,
        opciones: (p.tipo === 'select' || p.tipo === 'checkbox') ? (p.opciones || []).filter(Boolean) : null,
        branching: (p.branching || []).map(b => ({ when: b.when, goto: b.goto })) // normalized
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

  return (
    <div className={styles.container} style={{ padding: 20 }}>
      <h1>Constructor de Formularios</h1>

      {usuarioInfo && (
        <div style={{ marginBottom: 12 }}>
          Creando como: <strong>{usuarioInfo.nombres || usuarioInfo.correo || usuarioInfo.id_usuario}</strong>
        </div>
      )}

      <div style={{ maxWidth: 1000 }}>
        <label>Nombre del formulario</label>
        <input className={styles.input} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Encuesta clientes" />

        <label>Descripción</label>
        <textarea className={styles.textarea} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />

        <h3>Preguntas</h3>
        {preguntas.map((q, idx) => (
          <div key={idx} style={{ border: '1px solid #eee', padding: 12, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Pregunta {idx + 1}</strong>
              <button type="button" onClick={() => removeQuestion(idx)} style={{ color: 'red', background: 'transparent', border: 'none' }}>Eliminar</button>
            </div>

            <input placeholder="Texto de la pregunta" value={q.texto} onChange={(e) => updateQuestion(idx, 'texto', e.target.value)} className={styles.input} />

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <select value={q.tipo} onChange={(e) => updateQuestion(idx, 'tipo', e.target.value)}>
                {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={q.requerido} onChange={(e) => updateQuestion(idx, 'requerido', e.target.checked)} />
                Requerido
              </label>
            </div>

            {/* Opciones (para select/checkbox) */}
            {(q.tipo === 'select' || q.tipo === 'checkbox') && (
              <div style={{ marginTop: 8 }}>
                <strong>Opciones</strong>
                {(q.opciones || []).map((opt, oi) => (
                  <div key={oi} style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <input value={opt} onChange={(e) => updateOption(idx, oi, e.target.value)} className={styles.input} placeholder={`Opción ${oi + 1}`} />
                    <button type="button" onClick={() => removeOption(idx, oi)} style={{ color: 'red', background: 'transparent', border: 'none' }}>X</button>
                  </div>
                ))}
                <button type="button" onClick={() => addOption(idx)} style={{ marginTop: 8 }}>Agregar opción</button>
              </div>
            )}

            {/* Ramificación (branching) */}
            <div style={{ marginTop: 12, background: '#fafafa', padding: 10, borderRadius: 6 }}>
              <strong>Ramificación</strong>
              <p style={{ marginTop: 6, marginBottom: 10, color: '#555', fontSize: 13 }}>
                Agrega reglas: "Si la respuesta es X → ir a la pregunta Y". Usa "end" para terminar.
              </p>

              {(q.branching || []).map((rule, ri) => (
                <div key={ri} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  {/* When: si la pregunta tiene opciones, mostramos un select con opciones; sino, input libre */}
                  { (q.tipo === 'select' || q.tipo === 'checkbox') ? (
                    <select className={styles.input} value={rule.when} onChange={(e) => updateBranchRule(idx, ri, 'when', e.target.value)}>
                      <option value=''>-- seleccionar valor --</option>
                      {(q.opciones || []).map((opt, oi) => <option key={oi} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input className={styles.input} placeholder="Valor que dispara la regla" value={rule.when} onChange={(e) => updateBranchRule(idx, ri, 'when', e.target.value)} />
                  )}

                  {/* Goto: lista de preguntas destino */}
                  <select className={styles.input} value={String(rule.goto)} onChange={(e) => updateBranchRule(idx, ri, 'goto', e.target.value)}>
                    {/* opciones: preguntas posteriores y 'end' */}
                    <option value="end">Terminar (end)</option>
                    {preguntas.map((_, qi) => (
                      qi === idx ? null : <option key={qi} value={qi}>Ir a Pregunta {qi + 1}</option>
                    ))}
                  </select>

                  <button type="button" onClick={() => removeBranchRule(idx, ri)} style={{ color: 'red', background: 'transparent', border: 'none' }}>Eliminar</button>
                </div>
              ))}

              <div>
                <button type="button" onClick={() => addBranchRule(idx)}>Agregar regla de ramificación</button>
              </div>
            </div>

          </div>
        ))}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={addQuestion}>Agregar pregunta</button>
          <button type="button" onClick={handleCreate} disabled={creating}>{creating ? 'Creando...' : 'Crear formulario'}</button>
        </div>

        {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}

        {created && (
          <div style={{ marginTop: 16, padding: 12, border: '1px solid #ddd' }}>
            <h4>Formulario creado</h4>
            <p><strong>Nombre:</strong> {created.nombre}</p>
            <p><strong>Slug:</strong> {created.slug}</p>
            <p>
              <strong>URL pública:</strong>{' '}
              <a target="_blank" rel="noreferrer" href={`${import.meta.env.VITE_FRONT_URL || window.location.origin}/forms/${created.slug}`}>
                {`${import.meta.env.VITE_FRONT_URL || window.location.origin}/forms/${created.slug}`}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormBuilder;
