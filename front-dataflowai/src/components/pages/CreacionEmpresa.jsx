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
  1: { label: 'Basic Annual', value: '300.00', description: 'Essential tools for startups beginning their digital journey', features: ['Up to 5 users', 'Basic analytics', 'Email support'] },
  4: { label: 'Basic Monthly', value: '39.99', description: 'Flexible monthly access to core features', features: ['Up to 5 users', 'Basic analytics', 'Email support'] },
  2: { label: 'Professional Annual', value: '600.00', description: 'Complete annual solution for medium teams', features: ['Up to 20 users', 'Advanced analytics', 'Priority support'] },
  5: { label: 'Professional Monthly', value: '79.99', description: 'Premium features with monthly flexibility', features: ['Up to 20 users', 'Advanced analytics', 'Priority support'] },
};

const ALLOWED_PLAN_IDS = Object.keys(PlanDetails).map(id => parseInt(id, 10));
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CreacionEmpresa = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('company');
  const [categorias, setCategorias] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [planMessage, setPlanMessage] = useState(null);

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

  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    fetchCategorias().then(setCategorias);
    fetchPlanes().then(pls => setPlanes(pls.filter(p => ALLOWED_PLAN_IDS.includes(p.id_plan))));
  }, []);

  useEffect(() => {
    const dirty = Object.values(formE).some(v => v) || Object.values(formU).some(v => v);
    setIsDirty(dirty);
  }, [formE, formU]);

  const handleChangeE = (e) => {
    const { name, value } = e.target;
    setFormE(prev => ({ ...prev, [name]: value }));
    
    if (name === 'pais') {
      const sel = countries.find(c => c.code === value);
      setFormE(prev => ({ ...prev, prefijo_pais: sel?.dial_code || '', ciudad: '' }));
    }
    
    if (name === 'id_plan') {
      setPlanMessage(PlanDetails[value] || null);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formE.nombre_empresa) newErrors.companyName = 'Company name is required';
    if (!formE.id_plan) newErrors.plan = 'Please select a plan';
    if (!emailRegex.test(formU.correo)) newErrors.email = 'Invalid email format';
    if (formU.contrasena.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formU.contrasena !== formU.confirma) newErrors.confirm = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      const empresa = await crearEmpresa(formE);
      localStorage.setItem('pendingUser', JSON.stringify(formU));
      navigate(`/pagos?id_empresa=${empresa.id_empresa}&id_plan=${formE.id_plan}`);
    } catch (err) {
      console.error('Creation error:', err);
    }
  };

  const listaCiudades = cities[formE.pais] || [];

  return (
    <div className={styles.container}>
      <div className={styles.background}></div>
      
      <div className={styles.card}>
        <div className={styles.illustration}>
          <div className={styles.gradientBg}>
            <div className={styles.circle}></div>
            <div className={styles.circle}></div>
          </div>
          <div className={styles.logoContainer}>
            <img src={logo} alt="Dataflow AI" className={styles.logo} />
            <h2>Transform Your Business with AI</h2>
            <p>Join thousands of companies optimizing their operations</p>
            <div className={styles.features}>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>⚡</span>
                <span>Real-time Analytics</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>🤖</span>
                <span>AI Automation</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>🔒</span>
                <span>Enterprise Security</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.formContainer}>
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'company' ? styles.active : ''}`}
              onClick={() => setActiveTab('company')}
            >
              <span className={styles.tabIcon}>🏢</span> Company
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'user' ? styles.active : ''}`}
              onClick={() => setActiveTab('user')}
            >
              <span className={styles.tabIcon}>👤</span> User
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {activeTab === 'company' && (
              <div className={styles.formSection}>
                <h3>Company Information</h3>
                
                <div className={styles.inputGroup}>
                  <label>Company Name *</label>
                  <input 
                    type="text" 
                    name="nombre_empresa" 
                    value={formE.nombre_empresa} 
                    onChange={handleChangeE} 
                    className={errors.companyName ? styles.error : ''}
                  />
                  {errors.companyName && <span className={styles.errorText}>{errors.companyName}</span>}
                </div>

                <div className={styles.grid}>
                  <div className={styles.inputGroup}>
                    <label>Category *</label>
                    <select name="id_categoria" value={formE.id_categoria} onChange={handleChangeE}>
                      <option value="">Select category</option>
                      {categorias.map(c => (
                        <option key={c.id_categoria} value={c.id_categoria}>
                          {c.descripcion_categoria}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Plan *</label>
                    <select name="id_plan" value={formE.id_plan} onChange={handleChangeE} className={errors.plan ? styles.error : ''}>
                      <option value="">Select plan</option>
                      {planes.map(p => (
                        <option key={p.id_plan} value={p.id_plan}>
                          {PlanDetails[p.id_plan].label}
                        </option>
                      ))}
                    </select>
                    {errors.plan && <span className={styles.errorText}>{errors.plan}</span>}
                  </div>
                </div>

                {planMessage && (
                  <div className={styles.planCard}>
                    <h4>{planMessage.label} - ${planMessage.value}</h4>
                    <p>{planMessage.description}</p>
                    <ul>
                      {planMessage.features.map((f, i) => (
                        <li key={i}><span className={styles.checkIcon}>✓</span> {f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className={styles.grid}>
                  <div className={styles.inputGroup}>
                    <label>Country *</label>
                    <select name="pais" value={formE.pais} onChange={handleChangeE}>
                      <option value="">Select country</option>
                      {countries.map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>City *</label>
                    <select name="ciudad" value={formE.ciudad} onChange={handleChangeE}>
                      <option value="">Select city</option>
                      {listaCiudades.map(ci => (
                        <option key={ci} value={ci}>{ci}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Address</label>
                  <input type="text" name="direccion" value={formE.direccion} onChange={handleChangeE} />
                </div>

                <div className={styles.grid}>
                  <div className={styles.inputGroup}>
                    <label>Country Code</label>
                    <input type="text" name="prefijo_pais" value={formE.prefijo_pais} readOnly />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Phone *</label>
                    <input type="tel" name="telefono" value={formE.telefono} onChange={handleChangeE} />
                  </div>
                </div>

                <button type="button" className={styles.nextButton} onClick={() => setActiveTab('user')}>
                  Continue to User <span className={styles.arrowIcon}>→</span>
                </button>
              </div>
            )}

            {activeTab === 'user' && (
              <div className={styles.formSection}>
                <h3>Admin Account</h3>
                
                <div className={styles.grid}>
                  <div className={styles.inputGroup}>
                    <label>First Name *</label>
                    <input type="text" name="nombres" value={formU.nombres} onChange={(e) => setFormU({...formU, nombres: e.target.value})} />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Last Name</label>
                    <input type="text" name="apellidos" value={formU.apellidos} onChange={(e) => setFormU({...formU, apellidos: e.target.value})} />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Email *</label>
                  <input 
                    type="email" 
                    name="correo" 
                    value={formU.correo} 
                    onChange={(e) => setFormU({...formU, correo: e.target.value})} 
                    className={errors.email ? styles.error : ''}
                  />
                  {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                </div>

                <div className={styles.grid}>
                  <div className={styles.inputGroup}>
                    <label>Password *</label>
                    <input 
                      type="password" 
                      name="contrasena" 
                      value={formU.contrasena} 
                      onChange={(e) => setFormU({...formU, contrasena: e.target.value})} 
                      className={errors.password ? styles.error : ''}
                    />
                    {errors.password && <span className={styles.errorText}>{errors.password}</span>}
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Confirm Password *</label>
                    <input 
                      type="password" 
                      name="confirma" 
                      value={formU.confirma} 
                      onChange={(e) => setFormU({...formU, confirma: e.target.value})} 
                      className={errors.confirm ? styles.error : ''}
                    />
                    {errors.confirm && <span className={styles.errorText}>{errors.confirm}</span>}
                  </div>
                </div>

                <div className={styles.buttonGroup}>
                  <button type="button" className={styles.backButton} onClick={() => setActiveTab('company')}>
                    <span className={styles.arrowIcon}>←</span> Back
                  </button>
                  <button type="submit" className={styles.submitButton}>
                    Complete Registration <span className={styles.rocketIcon}>🚀</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreacionEmpresa;