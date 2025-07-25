// src/components/pages/CreacionEmpresa.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchCategorias,
  fetchPlanes,
  crearEmpresa
} from '../../api/CrearUsuario';
import styles from '../../styles/CreacionEmpresa.module.css';
import countries from '../../data/countries';
import cities from '../../data/city';
import logo from '../../assets/Dataflow AI logo ajustado blanco.png';

const PlanDetails = {
  1: { label: 'Basic anual', valor: '300.00', descripcion: 'Ideal para pequeñas empresas que inician su camino anual con herramientas esenciales.' },
  4: { label: 'Basic mensual', valor: '39.99', descripcion: 'Suscripción mensual ligera para quienes quieren probar sin compromiso anual.' },
  2: { label: 'Professional anual', valor: '600.00', descripcion: 'Solución completa anual para equipos medianos con soporte avanzado.' },
  5: { label: 'Professional mensual', valor: '79.99', descripcion: 'Flexibilidad profesional mes a mes con todas las funcionalidades incluidas.' },
};
const ALLOWED_PLAN_IDS = Object.keys(PlanDetails).map(id => parseInt(id, 10));

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CreacionEmpresa = () => {
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState([]);
  const [planes, setPlanes] = useState([]);
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
    confirma: '',
  });

  const [errorsU, setErrorsU] = useState({ correo: '', contrasena: '' });
  const [isDirty, setIsDirty] = useState(false);

  const infoMessage = '🛈 Por favor, diligencia primero la información de tu empresa y después la del usuario.';

  // Carga inicial
  useEffect(() => {
    fetchCategorias().then(setCategorias);
    fetchPlanes().then(pls => setPlanes(pls.filter(p => ALLOWED_PLAN_IDS.includes(p.id_plan))));
  }, []);

  // Marcar dirty
  useEffect(() => {
    const dirty = Object.values(formE).some(v => v) || Object.values(formU).some(v => v);
    setIsDirty(dirty);
  }, [formE, formU]);

  // Confirmar recarga
  useEffect(() => {
    window.onbeforeunload = e => {
      if (isDirty) {
        const msg = '¿Deseas perder la información ingresada?';
        e.preventDefault(); e.returnValue = msg;
        return msg;
      }
    };
    return () => { window.onbeforeunload = null; };
  }, [isDirty]);

  // Confirmar al logo
  const confirmLeave = () => isDirty ? window.confirm('¿Deseas perder la información ingresada?') : true;
  const handleLogoClick = e => {
    if (!confirmLeave()) e.preventDefault();
    else window.location.href = '/#home';
  };

  // Cambios formulario empresa
  const handleChangeE = e => {
    const { name, value } = e.target;
    setFormE(prev => ({ ...prev, [name]: value }));
    if (name === 'pais') {
      const sel = countries.find(c => c.code === value);
      setFormE(prev => ({ ...prev, prefijo_pais: sel?.dial_code || '', ciudad: '' }));
    }
    if (name === 'id_plan') {
      const plan = PlanDetails[+value];
      setPlanMessage(plan ? `Has seleccionado "${plan.label}". ${plan.descripcion} — Precio: $${plan.valor}` : '');
    }
  };

  // Cambios formulario usuario
  const handleChangeU = e => {
    const { name, value } = e.target;
    setFormU(prev => ({ ...prev, [name]: value }));
    if (name === 'correo') {
      setErrorsU(err => ({ ...err, correo: emailRegex.test(value) ? '' : 'Correo inválido.' }));
    }
    if (name === 'contrasena' || name === 'confirma') {
      const match = name === 'confirma' ? value === formU.contrasena : formU.confirma === value;
      setErrorsU(err => ({ ...err, contrasena: match ? '' : 'Las contraseñas no coinciden.' }));
    }
  };

  // Enviar
  const handleSubmit = async e => {
    e.preventDefault();
    if (errorsU.correo || errorsU.contrasena) return;
    try {
      const empresa = await crearEmpresa(formE);
      localStorage.setItem('pendingUser', JSON.stringify(formU));
      navigate(`/pagos?id_empresa=${empresa.id_empresa}&id_plan=${formE.id_plan}`);
    } catch (err) {
      console.error(err);
    }
  };

  const listaCiudades = cities[formE.pais] || [];

  return (
    <div className={styles.container}>
      <a href="/#home" onClick={handleLogoClick}>
        <img src={logo} alt="Dataflow AI" className={styles.logo} />
      </a>
      <h1>Crear Empresa y Usuario</h1>
      <p className={styles.info}>{infoMessage}</p>
      <form onSubmit={handleSubmit} className={styles.form}>

        <h2>Datos de la Empresa</h2>
        <label>
          Categoría
          <select name="id_categoria" value={formE.id_categoria} onChange={handleChangeE} required>
            <option value="">-- Selecciona --</option>
            {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.descripcion_categoria}</option>)}
          </select>
        </label>
        <label>
          Plan
          <select name="id_plan" value={formE.id_plan} onChange={handleChangeE} required>
            <option value="">-- Selecciona --</option>
            {planes.map(p => <option key={p.id_plan} value={p.id_plan}>{PlanDetails[p.id_plan].label}</option>)}
          </select>
        </label>
        {planMessage && <div className={styles.planMessage}>{planMessage}</div>}

        <label>Nombre Empresa<input name="nombre_empresa" value={formE.nombre_empresa} onChange={handleChangeE} required /></label>
        <label>Dirección<input name="direccion" value={formE.direccion} onChange={handleChangeE} required /></label>
        <label>Teléfono<input name="telefono" value={formE.telefono} onChange={handleChangeE} required /></label>
        <label>País<select name="pais" value={formE.pais} onChange={handleChangeE} required>
          <option value="">-- Selecciona País --</option>
          {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select></label>
        <label>Prefijo País<input name="prefijo_pais" value={formE.prefijo_pais} readOnly /></label>
        <label>Ciudad<select name="ciudad" value={formE.ciudad} onChange={handleChangeE} required>
          <option value="">-- Selecciona Ciudad --</option>
          {listaCiudades.map(ci => <option key={ci} value={ci}>{ci}</option>)}
        </select></label>
        <label>Correo Empresa<input type="email" name="correo" value={formE.correo} onChange={handleChangeE} /></label>
        <label>Página Web<input type="url" name="pagina_web" value={formE.pagina_web} onChange={handleChangeE} /></label>

        <h2>Datos del Usuario</h2>
        <label>Nombres<input name="nombres" value={formU.nombres} onChange={handleChangeU} required /></label>
        <label>Apellidos<input name="apellidos" value={formU.apellidos} onChange={handleChangeU} /></label>
        <label>Correo Usuario<input type="email" name="correo" value={formU.correo} onChange={handleChangeU} required />{errorsU.correo && <span className={styles.errorMsg}>{errorsU.correo}</span>}</label>
        <label>Contraseña<input type="password" name="contrasena" value={formU.contrasena} onChange={handleChangeU} required /></label>
        <label>Confirma Contraseña<input type="password" name="confirma" value={formU.confirma} onChange={handleChangeU} required />{errorsU.contrasena && <span className={styles.errorMsg}>{errorsU.contrasena}</span>}</label>

        <button type="submit" disabled={!!errorsU.correo || !!errorsU.contrasena}>Continuar a Pago</button>
      </form>
    </div>
  );
};

export default CreacionEmpresa;