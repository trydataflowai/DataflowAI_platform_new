// front-dataflowai/src/components/pages/CreacionEmpresa.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchCategorias,
  fetchPlanes,
  crearEmpresa
} from '../../api/CrearUsuario';
import styles from '../../styles/CreacionEmpresa.module.css';

// Detalles de cada plan
const PlanDetails = {
  1: { label: 'Basic anual', valor: '300.00', descripcion: 'Ideal para pequeñas empresas que inician su camino anual con herramientas esenciales.' },
  4: { label: 'Basic mensual', valor: '39.99', descripcion: 'Suscripción mensual ligera para quienes quieren probar sin compromiso anual.' },
  2: { label: 'Professional anual', valor: '600.00', descripcion: 'Solución completa anual para equipos medianos con soporte avanzado.' },
  5: { label: 'Professional mensual', valor: '79.99', descripcion: 'Flexibilidad profesional mes a mes con todas las funcionalidades incluidas.' },
};
const ALLOWED_PLAN_IDS = Object.keys(PlanDetails).map(id => parseInt(id, 10));

const CreacionEmpresa = () => {
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState([]);
  const [planes, setPlanes]         = useState([]);
  const [error, setError]           = useState(null);
  const [planMessage, setPlanMessage] = useState('');

  const [formE, setFormE] = useState({
    id_categoria: '',
    id_plan: '',
    nombre_empresa: '',
    direccion: '',
    telefono: '',
    ciudad: '',
    pais: '',
    prefijo_pais: '',
    correo: '',
    pagina_web: '',
  });

  const [formU, setFormU] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    contrasena: '',
  });

  useEffect(() => {
    fetchCategorias().then(setCategorias);
    fetchPlanes().then(allPlanes =>
      setPlanes(allPlanes.filter(p => ALLOWED_PLAN_IDS.includes(p.id_plan)))
    );
  }, []);

  const handleChangeE = e => {
    const { name, value } = e.target;
    setFormE(prev => ({ ...prev, [name]: value }));
    if (name === 'id_plan') {
      const planId = parseInt(value, 10);
      if (PlanDetails[planId]) {
        const { label, valor, descripcion } = PlanDetails[planId];
        setPlanMessage(`Has seleccionado "${label}". ${descripcion} — Precio: $${valor}`);
      } else {
        setPlanMessage('');
      }
    }
  };

  const handleChangeU = e => {
    const { name, value } = e.target;
    setFormU(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);

    try {
      // 1) Crear empresa
      const empresa = await crearEmpresa(formE);

      // 2) Guardar datos de usuario en localStorage para después
      localStorage.setItem('pendingUser', JSON.stringify(formU));

      // 3) Redirigir a pagos
      navigate(`/pagos?id_empresa=${empresa.id_empresa}&id_plan=${formE.id_plan}`);
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Crear Empresa y Usuario</h1>
      <form onSubmit={handleSubmit} className={styles.form}>

        <h2>Datos de la Empresa</h2>

        <label>
          Categoría
          <select name="id_categoria" value={formE.id_categoria} onChange={handleChangeE} required>
            <option value="">-- Selecciona --</option>
            {categorias.map(c => (
              <option key={c.id_categoria} value={c.id_categoria}>
                {c.descripcion_categoria}
              </option>
            ))}
          </select>
        </label>

        <label>
          Plan
          <select name="id_plan" value={formE.id_plan} onChange={handleChangeE} required>
            <option value="">-- Selecciona --</option>
            {planes.map(p => (
              <option key={p.id_plan} value={p.id_plan}>
                {PlanDetails[p.id_plan].label}
              </option>
            ))}
          </select>
        </label>
        {planMessage && <div className={styles.planMessage}>{planMessage}</div>}

        <label>
          Nombre Empresa
          <input name="nombre_empresa" value={formE.nombre_empresa} onChange={handleChangeE} required />
        </label>

        <label>
          Dirección
          <input name="direccion" value={formE.direccion} onChange={handleChangeE} required />
        </label>

        <label>
          Teléfono
          <input name="telefono" value={formE.telefono} onChange={handleChangeE} required />
        </label>

        <label>
          Ciudad
          <input name="ciudad" value={formE.ciudad} onChange={handleChangeE} required />
        </label>

        <label>
          País
          <input name="pais" value={formE.pais} onChange={handleChangeE} required />
        </label>

        <label>
          Prefijo País
          <input name="prefijo_pais" value={formE.prefijo_pais} onChange={handleChangeE} />
        </label>

        <label>
          Correo Empresa
          <input type="email" name="correo" value={formE.correo} onChange={handleChangeE} />
        </label>

        <label>
          Página Web
          <input type="url" name="pagina_web" value={formE.pagina_web} onChange={handleChangeE} />
        </label>

        <h2>Datos del Usuario (se crean después del pago)</h2>

        <label>
          Nombres
          <input name="nombres" value={formU.nombres} onChange={handleChangeU} required />
        </label>

        <label>
          Apellidos
          <input name="apellidos" value={formU.apellidos} onChange={handleChangeU} />
        </label>

        <label>
          Correo Usuario
          <input type="email" name="correo" value={formU.correo} onChange={handleChangeU} required />
        </label>

        <label>
          Contraseña
          <input type="password" name="contrasena" value={formU.contrasena} onChange={handleChangeU} required />
        </label>

        <button type="submit">Continuar a Pago</button>
      </form>

      {error && (
        <pre className={styles.error}>
          {JSON.stringify(error, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default CreacionEmpresa;
