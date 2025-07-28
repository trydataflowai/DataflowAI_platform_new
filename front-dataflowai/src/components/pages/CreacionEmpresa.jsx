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
  1: {
    label: 'Annual Basic',
    descripcion: 'Ideal for small businesses starting their annual journey with essential tools.'
  },
  4: {
    label: 'Monthly Basic',
    descripcion: 'Light monthly subscription for those who want to try without annual commitment.'
  },
  2: {
    label: 'Annual Professional',
    descripcion: 'Comprehensive annual solution for medium teams with advanced support.'
  },
  5: {
    label: 'Monthly Professional',
    descripcion: 'Professional month-to-month flexibility with all features included.'
  },
};
const ALLOWED_PLAN_IDS = Object.keys(PlanDetails).map(id => parseInt(id, 10));

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CreacionEmpresa = () => {
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [planMessage, setPlanMessage] = useState('');
  const [activeSection, setActiveSection] = useState('company');

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

  const infoMessage = 'Please complete all required fields to proceed to payment';

  useEffect(() => {
    fetchCategorias().then(setCategorias);
    fetchPlanes()
      .then(pls => setPlanes(pls.filter(p => ALLOWED_PLAN_IDS.includes(p.id_plan))));
  }, []);

  useEffect(() => {
    const dirty = Object.values(formE).some(v => v) || Object.values(formU).some(v => v);
    setIsDirty(dirty);
  }, [formE, formU]);

  useEffect(() => {
    window.onbeforeunload = e => {
      if (isDirty) {
        const msg = 'Do you want to lose the entered information?';
        e.preventDefault(); e.returnValue = msg;
        return msg;
      }
    };
    return () => { window.onbeforeunload = null; };
  }, [isDirty]);

  const confirmLeave = () => isDirty ? window.confirm('Do you want to lose the entered information?') : true;
  const handleLogoClick = e => {
    if (!confirmLeave()) e.preventDefault();
    else window.location.href = '/#home';
  };

  const handleChangeE = e => {
    const { name, value } = e.target;
    setFormE(prev => ({ ...prev, [name]: value }));

    if (name === 'pais') {
      const sel = countries.find(c => c.code === value);
      setFormE(prev => ({ ...prev, prefijo_pais: sel?.dial_code || '', ciudad: '' }));
    }

    if (name === 'id_plan') {
      const planId = +value;
      const pd = PlanDetails[planId];
      const apiPlan = planes.find(p => p.id_plan === planId);
      if (pd && apiPlan) {
        setPlanMessage(
          `You have selected "${pd.label}". ${pd.descripcion} — Price: $${apiPlan.valor_plan}`
        );
      } else {
        setPlanMessage('');
      }
    }
  };

  const handleChangeU = e => {
    const { name, value } = e.target;
    setFormU(prev => ({ ...prev, [name]: value }));
    if (name === 'correo') {
      setErrorsU(err => ({ ...err, correo: emailRegex.test(value) ? '' : 'Invalid email.' }));
    }
    if (name === 'contrasena' || name === 'confirma') {
      const match = name === 'confirma'
        ? value === formU.contrasena
        : formU.confirma === value;
      setErrorsU(err => ({ ...err, contrasena: match ? '' : 'Passwords do not match.' }));
    }
  };

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

  const cityList = cities[formE.pais] || [];

  return (
    <div className={styles.container}>
      <div className={styles.gradientBackground}></div>
      
      <div className={styles.contentWrapper}>
        <a href="/#home" onClick={handleLogoClick} className={styles.logoLink}>
          <img src={logo} alt="Dataflow AI" className={styles.logo} />
          <span className={styles.brandName}>DATAFLOW<span className={styles.brandHighlight}>AI</span></span>
        </a>

        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Create Your Account</h1>
            <p className={styles.formSubtitle}>Join DataflowAI's ecosystem of intelligent data solutions</p>
          </div>

          <div className={styles.progressSteps}>
            <div 
              className={`${styles.step} ${activeSection === 'company' ? styles.activeStep : ''}`}
              onClick={() => setActiveSection('company')}
            >
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepLabel}>Company Info</div>
            </div>
            <div 
              className={`${styles.step} ${activeSection === 'user' ? styles.activeStep : ''}`}
              onClick={() => setActiveSection('user')}
            >
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepLabel}>User Info</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={`${styles.formSection} ${activeSection === 'company' ? styles.activeSection : ''}`}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>🏢</span>
                Company Information
              </h2>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>
                    Category <span className={styles.required}>*</span>
                  </label>
                  <select 
                    name="id_categoria" 
                    value={formE.id_categoria} 
                    onChange={handleChangeE} 
                    className={styles.selectInput}
                    required
                  >
                    <option value="">Select Category</option>
                    {categorias.map(c => (
                      <option key={c.id_categoria} value={c.id_categoria}>
                        {c.descripcion_categoria}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>
                    Plan <span className={styles.required}>*</span>
                  </label>
                  <select 
                    name="id_plan" 
                    value={formE.id_plan} 
                    onChange={handleChangeE} 
                    className={styles.selectInput}
                    required
                  >
                    <option value="">Select Plan</option>
                    {planes.map(p => (
                      <option key={p.id_plan} value={p.id_plan}>
                        {PlanDetails[p.id_plan].label}
                      </option>
                    ))}
                  </select>
                  {planMessage && (
                    <div className={styles.planMessage}>
                      <div className={styles.infoIcon}>ℹ️</div>
                      {planMessage}
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>
                    Company Name <span className={styles.required}>*</span>
                  </label>
                  <input 
                    name="nombre_empresa" 
                    value={formE.nombre_empresa} 
                    onChange={handleChangeE} 
                    className={styles.textInput}
                    required 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>
                    Address <span className={styles.required}>*</span>
                  </label>
                  <input 
                    name="direccion" 
                    value={formE.direccion} 
                    onChange={handleChangeE} 
                    className={styles.textInput}
                    required 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>
                    Phone <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.phoneInputGroup}>
                    <input 
                      name="prefijo_pais" 
                      value={formE.prefijo_pais} 
                      className={styles.countryCodeInput}
                      readOnly 
                    />
                    <input 
                      name="telefono" 
                      value={formE.telefono} 
                      onChange={handleChangeE} 
                      className={styles.phoneInput}
                      required 
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>
                    Country <span className={styles.required}>*</span>
                  </label>
                  <select 
                    name="pais" 
                    value={formE.pais} 
                    onChange={handleChangeE} 
                    className={styles.selectInput}
                    required
                  >
                    <option value="">Select Country</option>
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>
                    City <span className={styles.required}>*</span>
                  </label>
                  <select 
                    name="ciudad" 
                    value={formE.ciudad} 
                    onChange={handleChangeE} 
                    className={styles.selectInput}
                    required
                  >
                    <option value="">Select City</option>
                    {cityList.map(ci => (
                      <option key={ci} value={ci}>{ci}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>Company Email</label>
                  <input 
                    type="email" 
                    name="correo" 
                    value={formE.correo} 
                    onChange={handleChangeE} 
                    className={styles.textInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>Website</label>
                  <input 
                    type="url" 
                    name="pagina_web" 
                    value={formE.pagina_web} 
                    onChange={handleChangeE} 
                    className={styles.textInput}
                  />
                </div>
              </div>

              <button 
                type="button" 
                className={styles.nextButton}
                onClick={() => setActiveSection('user')}
                disabled={!formE.id_categoria || !formE.id_plan || !formE.nombre_empresa || !formE.direccion || !formE.telefono || !formE.pais || !formE.ciudad}
              >
                Continue to User Information
                <span className={styles.buttonArrow}>→</span>
              </button>
            </div>

            <div className={`${styles.formSection} ${activeSection === 'user' ? styles.activeSection : ''}`}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>👤</span>
                User Information
              </h2>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>
                    First Name <span className={styles.required}>*</span>
                  </label>
                  <input 
                    name="nombres" 
                    value={formU.nombres} 
                    onChange={handleChangeU} 
                    className={styles.textInput}
                    required 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>Last Name</label>
                  <input 
                    name="apellidos" 
                    value={formU.apellidos} 
                    onChange={handleChangeU} 
                    className={styles.textInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>
                    User Email <span className={styles.required}>*</span>
                  </label>
                  <input 
                    type="email" 
                    name="correo" 
                    value={formU.correo} 
                    onChange={handleChangeU} 
                    className={styles.textInput}
                    required 
                  />
                  {errorsU.correo && (
                    <div className={styles.errorMessage}>
                      <span className={styles.errorIcon}>⚠️</span>
                      {errorsU.correo}
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>
                    Password <span className={styles.required}>*</span>
                  </label>
                  <input 
                    type="password" 
                    name="contrasena" 
                    value={formU.contrasena} 
                    onChange={handleChangeU} 
                    className={styles.textInput}
                    required 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>
                    Confirm Password <span className={styles.required}>*</span>
                  </label>
                  <input 
                    type="password" 
                    name="confirma" 
                    value={formU.confirma} 
                    onChange={handleChangeU} 
                    className={styles.textInput}
                    required 
                  />
                  {errorsU.contrasena && (
                    <div className={styles.errorMessage}>
                      <span className={styles.errorIcon}>⚠️</span>
                      {errorsU.contrasena}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formActions}>
                <button 
                  type="button" 
                  className={styles.backButton}
                  onClick={() => setActiveSection('company')}
                >
                  ← Back to Company Info
                </button>
                
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={!!errorsU.correo || !!errorsU.contrasena || !formU.nombres || !formU.correo || !formU.contrasena || !formU.confirma}
                >
                  Continue to Payment
                  <span className={styles.buttonArrow}>→</span>
                </button>
              </div>
            </div>
          </form>

          <div className={styles.infoMessage}>
            <div className={styles.infoIcon}>ℹ️</div>
            {infoMessage}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreacionEmpresa;