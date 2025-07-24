import { useEffect, useRef, useState } from 'react';
import styles from '../../styles/Index.module.css';
import { Link } from 'react-router-dom'; // Asegúrate de importar esto arriba
//Funcion de index
const Index = () => {
    const sectionRefs = useRef([]);
    const [activeSection, setActiveSection] = useState(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(styles.visible);
                        setActiveSection(entry.target.id);

                        // Update URL with hash without scrolling
                        if (entry.target.id) {
                            window.history.replaceState(null, null, `#${entry.target.id}`);
                        }
                    }
                });
            },
            {
                threshold: 0.5, // Triggers when 50% of section is visible
                rootMargin: '0px'
            }
        );

        sectionRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        // Handle smooth scroll for navbar links
        const handleSmoothScroll = (e) => {
            if (e.target.hash && e.target.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(e.target.hash);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        };

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', handleSmoothScroll);
        });

        // Configure scroll snapping
        document.documentElement.style.scrollSnapType = 'y mandatory';
        document.querySelectorAll('section').forEach(section => {
            section.style.scrollSnapAlign = 'start';
        });

        return () => {
            sectionRefs.current.forEach((ref) => {
                if (ref) observer.unobserve(ref);
            });
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.removeEventListener('click', handleSmoothScroll);
            });
        };
    }, []);

    const addToRefs = (el) => {
        if (el && !sectionRefs.current.includes(el)) {
            sectionRefs.current.push(el);
        }
    };

    return (
        <div className={styles.inicio}>
            {/* Hero Section */}
            <section className={`${styles.hero} ${styles.section}`} id="home" ref={addToRefs}>
                <div className={`${styles.container} ${styles['hero-content']}`}>
                    <div className={styles['hero-text']}>
                        <h1>Transforming <span>Data</span> into Smart Decisions</h1>
                        <p>Dataflow AI transforms how businesses connect, process, and visualize real-time data, enabling actionable insights through intelligent data flows.</p>
                        <div className={styles['hero-buttons']}>
                            <a href="#pricing" className={`${styles.btn} ${styles['btn-primary']}`}>View Plans</a>
                            <a href="#contact" className={`${styles.btn} ${styles['btn-outline']}`}>Contact Sales</a>
                        </div>
                    </div>
                    <div className={styles['hero-image']}>
                        <div className={styles['tech-grid']}></div>
                        <div className={styles['data-visualization']}>
                            <div className={styles['data-point']} style={{ "--size": "0.6", "--x": "20%", "--y": "30%", "--color": "#4e54c8" }}></div>
                            <div className={styles['data-point']} style={{ "--size": "0.8", "--x": "50%", "--y": "50%", "--color": "#8f94fb" }}></div>
                            <div className={styles['data-point']} style={{ "--size": "1.2", "--x": "70%", "--y": "20%", "--color": "#00d2ff" }}></div>
                            <div className={styles['data-point']} style={{ "--size": "0.7", "--x": "40%", "--y": "70%", "--color": "#4e54c8" }}></div>
                            <div className={styles['data-point']} style={{ "--size": "0.9", "--x": "80%", "--y": "60%", "--color": "#8f94fb" }}></div>
                            <div className={styles.connection}></div>
                            <div className={styles.connection}></div>
                            <div className={styles.connection}></div>
                            <div className={styles.connection}></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className={`${styles.features} ${styles.section}`} id="features" ref={addToRefs}>

                <div className={styles.container}>
                    <div className={styles['section-title']}>
                        <h2>Advanced <span>Features</span></h2>
                        <p>Unlock the power of data with our platform's advanced features.</p>
                    </div>

                    <div className={styles['features-grid']}>
                        <div className={styles['feature-card']}>
                            <div className={styles['feature-icon']}>
                                <i className="fas fa-chart-network"></i>
                            </div>
                            <h3>Customizable Dashboards</h3>
                            <p>Customize your analysis with flexible, interactive dashboards to meet your business needs.</p>
                            <div className={styles['feature-divider']}></div>
                            <div className={styles['feature-highlight']}>
                                <strong>New:</strong> Now with drag and drop.
                            </div>
                        </div>

                        <div className={styles['feature-card']}>
                            <div className={styles['feature-icon']}>
                                <i className="fas fa-database"></i>
                            </div>
                            <h3>Data Integration</h3>
                            <p>Seamlessly connect and combine data from multiple sources for a holistic view.</p>
                        </div>

                        <div className={styles['feature-card']}>
                            <div className={styles['feature-icon']}>
                                <i className="fas fa-brain"></i>
                            </div>
                            <h3>AI Insights</h3>
                            <p>Discover hidden patterns, anomalies, and opportunities in your data with our advanced artificial intelligence.</p>
                            <div className={styles['feature-divider']}></div>
                            <div className={styles['feature-highlight']}>
                                <strong>Includes:</strong> Real-time updates.
                            </div>
                        </div>

                        <div className={styles['feature-card']}>
                            <div className={styles['feature-icon']}>
                                <i className="fas fa-bolt"></i>
                            </div>
                            <h3>Real-Time Updates</h3>
                            <p>Stay informed with real-time data updates and instant notifications.</p>
                        </div>

                        <div className={styles['feature-card']}>
                            <div className={styles['feature-icon']}>
                                <i className="fas fa-robot"></i>
                            </div>
                            <h3>Productive Automations</h3>
                            <p>Automate repetitive processes and workflows to increase your team's efficiency.</p>
                        </div>

                        <div className={styles['feature-card']}>
                            <div className={styles['feature-icon']}>
                                <i className="fas fa-shield-alt"></i>
                            </div>
                            <h3>Advanced Security</h3>
                            <p>Protect your data with enterprise-grade security measures and regulatory compliance.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className={`${styles.pricing} ${styles.section}`} id="pricing" ref={addToRefs}>
                <div className={styles.container}>
                    <div className={styles['section-title']}>
                        <h2>Plans for Teams of <span>All Sizes</span></h2>
                        <p>Choose the right plan for you and start organizing your data today.</p>
                    </div>

                    <div className={styles['pricing-grid']}>





                        <div className={`${styles['pricing-card']} ${styles.basic}`}>
                            <div className={styles['pricing-header']}>
                                <div className={styles['pricing-name']}>Basic</div>
                                <div className={styles['pricing-price']}>$24.99<span className={styles['pricing-period']}>/month</span></div>
                            </div>
                            <div className={styles['pricing-features']}>
                                <ul>
                                    <li><i className="fas fa-check-circle"></i> Dashboard</li>
                                    <li><i className="fas fa-check-circle"></i> Data visualization</li>
                                    <li><i className="fas fa-check-circle"></i> Automations</li>
                                    <li><i className="fas fa-check-circle"></i> Team support</li>
                                </ul>
                            </div>
                            <div className={styles['pricing-button']}>
                                <Link to="/crear-empresa" className={`${styles.btn} ${styles['btn-outline']}`}>Get Started</Link>
                            </div>
                        </div>

                        <div className={`${styles['pricing-card']} ${styles.pro}`}>
                            <div className={styles.popular}>POPULAR</div>
                            <div className={styles['pricing-header']}>
                                <div className={styles['pricing-name']}>Professional</div>
                                <div className={styles['pricing-price']}>$49.99<span className={styles['pricing-period']}>/month</span></div>
                            </div>
                            <div className={styles['pricing-features']}>
                                <ul>
                                    <li><i className="fas fa-check-circle"></i> Dashboard</li>
                                    <li><i className="fas fa-check-circle"></i> Data visualization</li>
                                    <li><i className="fas fa-check-circle"></i> Automations</li>
                                    <li><i className="fas fa-check-circle"></i> Team support</li>
                                    <li><i className="fas fa-check-circle"></i> Up to 5 data sources</li>
                                    <li><i className="fas fa-check-circle"></i> Custom alerts</li>
                                </ul>
                            </div>
                            <div className={styles['pricing-button']}>
                                <Link to="/crear-empresa" className={`${styles.btn} ${styles['btn-primary']}`}>Get Started</Link>
                            </div>
                        </div>


                        <div className={`${styles['pricing-card']} ${styles.enterprise}`}>
                            <div className={styles['pricing-header']}>
                                <div className={styles['pricing-name']}>Enterprise</div>
                                <div className={styles['pricing-price']}>Custom</div>
                            </div>
                            <div className={styles['pricing-features']}>
                                <ul>
                                    <li><i className="fas fa-check-circle"></i> Dashboard</li>
                                    <li><i className="fas fa-check-circle"></i> Data visualization</li>
                                    <li><i className="fas fa-check-circle"></i> Automations</li>
                                    <li><i className="fas fa-check-circle"></i> Team support</li>
                                    <li><i className="fas fa-check-circle"></i> Unlimited data sources</li>
                                    <li><i className="fas fa-check-circle"></i> API/SQL integrations</li>
                                    <li><i className="fas fa-check-circle"></i> Custom branding</li>
                                    <li><i className="fas fa-check-circle"></i> Dedicated technical support</li>
                                </ul>
                            </div>
                            <div className={styles['pricing-button']}>
                                <a
                                    href="https://wa.me/17373439051?text=Hola%2C%20buenas%20tardes.%20Estoy%20interesado%20en%20el%20plan%20Enterprise."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${styles.btn} ${styles['btn-outline']}`}
                                >
                                    Contact Sales
                                </a>
                            </div>
                        </div>







                    </div>
                </div>
            </section>

            {/* Business Plan Section */}
            <section className={`${styles['business-plan']} ${styles.section}`} id="business" ref={addToRefs}>
                <div className={`${styles.container} ${styles['business-content']}`}>
                    <div className={styles['business-text']}>
                        <h2>Our <span>Solution</span></h2>
                        <p>Dataflow AI offers an intelligent business intelligence platform based on continuous data flows.</p>

                        <ul className={styles['business-list']}>
                            <li><i className="fas fa-network-wired"></i> We seamlessly integrate multiple data streams</li>
                            <li><i className="fas fa-chart-line"></i> We visualize dynamic relationships and key performance indicators (KPIs) in real time</li>
                            <li><i className="fas fa-robot"></i> We use AI to detect anomalies, patterns and gain instant actionable insights</li>
                            <li><i className="fas fa-cogs"></i> We automate data organization, transformation and enrichment with no code required</li>
                        </ul>

                        <a href="#process" className={`${styles.btn} ${styles['btn-primary']}`}>Learn About the Process</a>
                    </div>

                    <div className={styles['business-image']}>
                        <div className={styles['solution-image-container']}>

                            <div className={styles['dynamic-dashboard']}>
                                <div className={styles['dashboard-header']}>
                                    <div className={styles['dashboard-title']}>Performance Dashboard</div>
                                    <div className={styles['dashboard-time']}>Updated: <span className={styles['live-time']}>Now</span></div>
                                </div>

                                <div className={styles['dashboard-grid']}>

                                    <div className={styles['main-chart']}>
                                        <div className={styles['chart-title']}>Revenue vs Expenses</div>
                                        <div className={styles['chart-container']}>
                                            <div className={styles['chart-bars']}>
                                                <div className={`${styles.bar} ${styles.revenue}`} style={{ height: '80%' }}></div>
                                                <div className={`${styles.bar} ${styles.expense}`} style={{ height: '55%' }}></div>
                                                <div className={`${styles.bar} ${styles.revenue}`} style={{ height: '95%' }}></div>
                                                <div className={`${styles.bar} ${styles.expense}`} style={{ height: '65%' }}></div>
                                                <div className={`${styles.bar} ${styles.revenue}`} style={{ height: '75%' }}></div>
                                                <div className={`${styles.bar} ${styles.expense}`} style={{ height: '45%' }}></div>
                                            </div>
                                            <div className={styles['chart-labels']}>
                                                <div>Jan</div>
                                                <div>Feb</div>
                                                <div>Mar</div>
                                                <div>Apr</div>
                                                <div>May</div>
                                                <div>Jun</div>
                                            </div>
                                        </div>
                                        <div className={styles['chart-legend']}>
                                            <div><span className={styles['legend-revenue']}></span> Revenue</div>
                                            <div><span className={styles['legend-expense']}></span> Expenses</div>
                                        </div>
                                    </div>


                                    <div className={styles['kpi-card']}>
                                        <div className={styles['kpi-icon']}><i className="fas fa-user-plus"></i></div>
                                        <div className={styles['kpi-title']}>New Customers</div>
                                        <div className={styles['kpi-value']} data-target="245">0</div>
                                        <div className={`${styles['kpi-trend']} ${styles.up}`}>+12%</div>
                                    </div>

                                    <div className={styles['kpi-card']}>
                                        <div className={styles['kpi-icon']}><i className="fas fa-shopping-cart"></i></div>
                                        <div className={styles['kpi-title']}>Sales</div>
                                        <div className={styles['kpi-value']} data-target="12450">0</div>
                                        <div className={`${styles['kpi-trend']} ${styles.up}`}>+8%</div>
                                    </div>

                                    <div className={styles['kpi-card']}>
                                        <div className={styles['kpi-icon']}><i className="fas fa-percentage"></i></div>
                                        <div className={styles['kpi-title']}>Conversion</div>
                                        <div className={styles['kpi-value']} data-target="4.8">0</div>
                                        <div className={styles['kpi-unit']}>%</div>
                                        <div className={`${styles['kpi-trend']} ${styles.down}`}>-1.2%</div>
                                    </div>


                                    <div className={styles.heatmap}>
                                        <div className={styles['heatmap-title']}>Activity by Region</div>
                                        <div className={styles['heatmap-grid']}>
                                            <div className={styles['heatmap-cell']} style={{ "--intensity": "0.2" }}></div>
                                            <div className={styles['heatmap-cell']} style={{ "--intensity": "0.8" }}></div>
                                            <div className={styles['heatmap-cell']} style={{ "--intensity": "0.5" }}></div>
                                            <div className={styles['heatmap-cell']} style={{ "--intensity": "0.9" }}></div>
                                            <div className={styles['heatmap-cell']} style={{ "--intensity": "0.4" }}></div>
                                            <div className={styles['heatmap-cell']} style={{ "--intensity": "0.7" }}></div>
                                            <div className={styles['heatmap-cell']} style={{ "--intensity": "0.3" }}></div>
                                            <div className={styles['heatmap-cell']} style={{ "--intensity": "0.6" }}></div>
                                            <div className={styles['heatmap-cell']} style={{ "--intensity": "0.9" }}></div>
                                        </div>
                                        <div className={styles['heatmap-labels']}>
                                            <div>North</div>
                                            <div>Central</div>
                                            <div>South</div>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles['dashboard-footer']}>
                                    <div className={styles['ai-insight']}>
                                        <i className="fas fa-lightbulb"></i>
                                        <span>AI detects: Higher growth in young customers (+25%)</span>
                                    </div>
                                </div>
                            </div>


                            <div className={styles['data-streams']}>
                                <div className={styles['data-stream']}></div>
                                <div className={styles['data-stream']}></div>
                                <div className={styles['data-stream']}></div>
                            </div>
                            <div className={styles['circuit-overlay']}></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section className={`${styles.process} ${styles.section}`} id="process" ref={addToRefs}>
                <div className={styles.container}>
                    <div className={styles['section-title']}>
                        <h2>Digital <span>Incubation Program</span></h2>
                        <p>Our process for implementing Dataflow AI in your company</p>
                    </div>

                    <div className={styles['process-steps']}>
                        <div className={styles.step}>
                            <h3>Strategic Kick-Off</h3>
                            <p>We meet with your team to understand your operation, data sources and key needs. We define objectives, stakeholders and possible quick wins.</p>
                        </div>

                        <div className={styles.step}>
                            <h3>Data Integration</h3>
                            <p>We connect relevant internal and external data sources (Excel, CRM, ERP, etc.), ensuring real-time integrity, cleaning and structure.</p>
                        </div>

                        <div className={styles.step}>
                            <h3>Dashboard Design</h3>
                            <p>We build custom visualizations with alerts, automated flows and key metrics to monitor your operation from day one.</p>
                        </div>

                        <div className={styles.step}>
                            <h3>Validated Functional POC</h3>
                            <p>We launch an operational Proof of Concept ready to use. We validate impact, collect feedback and prepare for scaling.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className={`${styles.team} ${styles.section}`} id="team" ref={addToRefs}>
                <div className={styles.container}>
                    <div className={styles['section-title']}>
                        <h2>Our <span>Team</span></h2>
                        <p>We have a solid track record of success in digital growth for companies!</p>
                    </div>

                    <div className={styles['team-grid']}>
                        <div className={styles['team-member']}>
                            <div className={styles['member-image']}>
                                <div className={styles.avatar} style={{ background: "linear-gradient(135deg, #4e54c8, #8f94fb)" }}></div>
                                <div className={styles['tech-border']}></div>
                            </div>
                            <div className={styles['member-info']}>
                                <h3>Daniel Correa</h3>
                                <p>CEO & Co-founder</p>
                            </div>
                        </div>

                        <div className={styles['team-member']}>
                            <div className={styles['member-image']}>
                                <div className={styles.avatar} style={{ background: "linear-gradient(135deg, #8f94fb, #00d2ff)" }}></div>
                                <div className={styles['tech-border']}></div>
                            </div>
                            <div className={styles['member-info']}>
                                <h3>Julian Herreño</h3>
                                <p>Data Engineer Lead</p>
                            </div>
                        </div>

                        <div className={styles['team-member']}>
                            <div className={styles['member-image']}>
                                <div className={styles.avatar} style={{ background: "linear-gradient(135deg, #00d2ff, #4e54c8)" }}></div>
                                <div className={styles['tech-border']}></div>
                            </div>
                            <div className={styles['member-info']}>
                                <h3>New</h3>
                                <p>Data Analyst</p>
                            </div>
                        </div>

                        <div className={styles['team-member']}>
                            <div className={styles['member-image']}>
                                <div className={styles.avatar} style={{ background: "linear-gradient(135deg, #8f94fb, #4e54c8)" }}></div>
                                <div className={styles['tech-border']}></div>
                            </div>
                            <div className={styles['member-info']}>
                                <h3>New</h3>
                                <p>Cloud Engineer</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className={`${styles.contact} ${styles.section}`} id="contact" ref={addToRefs}>
                <div className={styles.container}>
                    <div className={styles['section-title']}>
                        <h2>Questions? <span>Contact Us</span></h2>
                        <p>Contact us for more information about our solution</p>
                    </div>

                    <div className={styles['contact-grid']}>
                        <div className={styles['contact-info']}>
                            <div className={styles['contact-item']}>
                                <div className={styles['contact-icon']}>
                                    <i className="fas fa-envelope"></i>
                                </div>
                                <div className={styles['contact-text']}>
                                    <h3>Email</h3>
                                    <a href="mailto:info@trydataflow.ai">info@trydataflow.ai</a>
                                    <a href="mailto:correadaniel@trydataflow.ai">correadaniel@trydataflow.ai</a>
                                </div>
                            </div>

                            <div className={styles['contact-item']}>
                                <div className={styles['contact-icon']}>
                                    <i className="fas fa-phone"></i>
                                </div>
                                <div className={styles['contact-text']}>
                                    <h3>Phone</h3>
                                    <a href="tel:+573024808888">+57 302 4808888</a>
                                </div>
                            </div>

                            <div className={styles['contact-item']}>
                                <div className={styles['contact-icon']}>
                                    <i className="fas fa-map-marker-alt"></i>
                                </div>
                                <div className={styles['contact-text']}>
                                    <h3>Main Office</h3>
                                    <p>Bogotá, Colombia</p>
                                </div>
                            </div>

                            <div className={styles['contact-map']}>
                                <div className={styles['map-overlay']}></div>
                                <div className={styles['location-dot']}></div>
                            </div>
                        </div>

                        <div className={styles['contact-form']}>
                            <form>
                                <div className={styles['form-group']}>
                                    <label htmlFor="name">Full Name</label>
                                    <input type="text" id="name" className={styles['form-control']} required />
                                </div>

                                <div className={styles['form-group']}>
                                    <label htmlFor="email">Email</label>
                                    <input type="email" id="email" className={styles['form-control']} required />
                                </div>

                                <div className={styles['form-group']}>
                                    <label htmlFor="company">Company</label>
                                    <input type="text" id="company" className={styles['form-control']} required />
                                </div>

                                <div className={styles['form-group']}>
                                    <label htmlFor="message">Message</label>
                                    <textarea id="message" className={styles['form-control']} required></textarea>
                                </div>

                                <button type="submit" className={`${styles.btn} ${styles['btn-primary']}`}>Send Message</button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Index;