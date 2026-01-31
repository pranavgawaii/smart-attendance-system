import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Smartphone, ShieldCheck, BarChart3, MapPin, Menu, X, ChevronDown, Mail, Linkedin, Twitter, Globe, Instagram, Facebook } from 'lucide-react';
import './LandingPage.css';
import mitLogo from '../assets/mitadtlogo.png';
import heroVideo from '../assets/itbuilding.mp4';

const LandingPage = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Prevent scrolling when mobile menu is active
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isMobileMenuOpen]);

    return (
        <div className="landing-page">
            <nav className={`landing-nav ${isScrolled ? 'scrolled' : ''}`}>
                <div className="landing-logo-group">
                    <img src={mitLogo} alt="MIT ADT University" className="nav-logo" onError={(e) => e.target.style.display = 'none'} />
                    <div className="nav-divider"></div>
                    <div className="nav-text-group">
                        <span className="nav-uni-name desktop-name">MIT Art, Design & Technology University</span>
                        <span className="nav-uni-name mobile-name">MIT ADT, PUNE</span>
                        <span className="nav-dept-name">Training & Placement Cell</span>
                    </div>
                </div>

                {/* Desktop Links */}
                <div className="nav-links desktop-only">
                    <a href="#features">Platform Overview</a>
                    <a href="#partners">Recruiters</a>
                    <a href="#contact">Support</a>
                </div>

                {/* Desktop Auth Button */}
                <Link to="/login" className="auth-btn desktop-only">
                    <ShieldCheck size={16} style={{ marginRight: '6px' }} />
                    Portal Login
                </Link>

                {/* Mobile Menu Toggle */}
                <button
                    className="mobile-menu-toggle"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Mobile Menu Overlay */}
                <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}>
                    <div className="mobile-menu-content">
                        <a href="#features" onClick={() => setIsMobileMenuOpen(false)}>Platform Overview</a>
                        <a href="#partners" onClick={() => setIsMobileMenuOpen(false)}>Recruiters</a>
                        <a href="#contact" onClick={() => setIsMobileMenuOpen(false)}>Support</a>
                        <div className="mobile-menu-divider"></div>
                        <Link to="/login" className="mobile-auth-btn" onClick={() => setIsMobileMenuOpen(false)}>
                            <ShieldCheck size={18} />
                            Portal Login
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Redesigned Hero Section */}
            <main className="landing-hero-new">
                <video
                    className="hero-bg-video"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                >
                    <source src={heroVideo} type="video/mp4" />
                </video>
                <div className="hero-overlay">
                    <div className="hero-content">
                        {/* Badge removed to match new reference */}
                        <h1 className="hero-title-large">
                            Campus placements,<br />
                            simplified.
                        </h1>

                        <p className="hero-subtitle-new">
                            Secure attendance, assessments, seat allocation, and placement workflows all in one unified system.
                        </p>

                        <div className="hero-actions">
                            <Link to="/login" className="hero-access-btn">
                                Access Portal
                            </Link>
                            <div className="hero-trust-indicator">
                                Used internally by MIT ADT Training & Placement Cell
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Stats Section with restored data */}
            <section className="landing-stats">
                <div className="stats-row">
                    <div className="stat-item">
                        <span className="stat-value">125+</span>
                        <span className="stat-label">Acres Campus</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">500+</span>
                        <span className="stat-label">Visiting Companies</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">₹61 LPA</span>
                        <span className="stat-label">Highest Package</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">18+</span>
                        <span className="stat-label">Specialized Schools</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">30+</span>
                        <span className="stat-label">Global Tie-ups</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">10,000+</span>
                        <span className="stat-label">Student Community</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">28+</span>
                        <span className="stat-label">International Placements</span>
                    </div>
                </div>
                <div className="stats-context">
                    * Metrics reflecting the scale of operations managed by the centralized Training & Placement Cell.
                </div>
            </section>

            {/* Platform Overview Section (Institutional Redesign) */}
            <section className="engineered-section" id="features">
                <div className="section-container">
                    <h2 className="section-title">A Unified Platform for Campus Operations</h2>
                    <p className="section-subtitle">Streamlining attendance, security, and placement logistics through a single authoritative source.</p>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <Smartphone size={28} strokeWidth={1.5} />
                            </div>
                            <h3>Digital Attendance & Identity</h3>
                            <p><strong>Device-locked verification</strong> for absolute accountability across labs and exams.</p>
                            <div className="d-flex card-subtext">Used for: Daily Labs, Exams, Entry Control</div>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <ShieldCheck size={28} strokeWidth={1.5} />
                            </div>
                            <h3>Assessment Integrity Protocol</h3>
                            <p><strong>Zero-tolerance proxy prevention</strong> using real-time location and device binding.</p>
                            <div className="d-flex card-subtext">Enforced for: Mid-terms, Placement Drives</div>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <BarChart3 size={28} strokeWidth={1.5} />
                            </div>
                            <h3>Centralized Admin Control</h3>
                            <p><strong>Live operational visibility</strong> into performance, seat allocation, and resources.</p>
                            <div className="d-flex card-subtext">Access Level: Deans, HODs, Coordinators</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Marquee Section */}
            <div className="marquee-wrapper" id="partners">
                <div className="marquee-title-fancy">Recruiting Partners</div>
                <div className="marquee-track">
                    {/* Double the items for seamless loop */}
                    {[
                        "ZS Associates", "Tech Mahindra", "Oracle", "Persistent", "Cognizant",
                        "Bajaj", "Capgemini", "Razorpay", "Deloitte Digital", "Accenture",
                        "Infosys", "TCS", "Palo Alto Networks", "Wipro", "and many more..."
                    ].map((company, index) => (
                        <div key={index} className="marquee-item">{company}</div>
                    ))}
                    {[
                        "ZS Associates", "Tech Mahindra", "Oracle", "Persistent", "Cognizant",
                        "Bajaj", "Capgemini", "Razorpay", "Deloitte Digital", "Accenture",
                        "Infosys", "TCS", "Palo Alto Networks", "Wipro", "and many more..."
                    ].map((company, index) => (
                        <div key={`duplicate-${index}`} className="marquee-item">{company}</div>
                    ))}
                </div>
            </div>

            {/* Who Is This For Section */}
            <section className="segments-section">
                <div className="section-container">
                    <h2 className="section-title" style={{ fontSize: '2rem', marginBottom: '3rem' }}>Who Is This Platform For?</h2>
                    <div className="segments-grid">
                        <div className="segment-item">
                            <h4>Students</h4>
                            <p>Secure access to placement drives, assessment schedules, and digital attendance records.</p>
                        </div>
                        <div className="segment-divider"></div>
                        <div className="segment-item">
                            <h4>Faculty & Admin</h4>
                            <p>Live monitoring of sessions, automated reports, and centralized resource control.</p>
                        </div>
                        <div className="segment-divider"></div>
                        <div className="segment-item">
                            <h4>Placement Cell</h4>
                            <p>End-to-end management of recruitment drives, company coordination, and compliance.</p>
                        </div>
                    </div>
                </div>
            </section>



            {/* FAQ Section */}
            <section className="faq-section">
                <h2 className="faq-title">Common Queries</h2>

                <div className="faq-container">
                    {[
                        {
                            q: "How does the system prevent proxy attendance?",
                            a: "Our mandated Device Lock technology binds a student's account to their specific smartphone hardware ID. Attempting to log in or scan from an unauthorized device triggers a security lock, effectively eliminating proxy attempts."
                        },
                        {
                            q: "Are QR codes time-bound and secure?",
                            a: "Yes. The generated QR codes are dynamic and encrypted, rotating every few seconds. This prevents 'photo-sharing' or unauthorized distribution of codes to absent peers."
                        },
                        {
                            q: "Is attendance visibility available to parents or guardians?",
                            a: "Yes. The system supports a dedicated parent portal and automated SMS notifications, ensuring guardians are kept informed of daily attendance status and academic engagement."
                        },
                        {
                            q: "What happens if a student changes their device?",
                            a: "Device changes require administrative approval. A student must submit a formal request through the portal, which resets their hardware ID binding after verification by the department coordinator."
                        },
                        {
                            q: "Is student data stored securely?",
                            a: "All student data is encrypted at rest and in transit, adhering to institutional data privacy standards. Access is strictly role-based, ensuring only authorized faculty and administrators can view sensitive records."
                        },
                        {
                            q: "Does the system scale for large auditoriums?",
                            a: "Absolutely. The robust backend infrastructure handles thousands of concurrent requests, making it suitable for mass-attendance events, orientation sessions, and campus-wide placement drives."
                        }
                    ].map((item, index) => (
                        <div
                            key={index}
                            className={`faq-item ${openFaqIndex === index ? 'active' : ''}`}
                            onClick={() => toggleFaq(index)}
                        >
                            <div className="faq-question">
                                {item.q}
                                <ChevronDown
                                    size={20}
                                    className={`faq-icon ${openFaqIndex === index ? 'rotate' : ''}`}
                                />
                            </div>
                            <div
                                className="faq-answer-wrapper"
                                style={{ maxHeight: openFaqIndex === index ? '200px' : '0' }}
                            >
                                <div className="faq-answer">
                                    {item.a}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="contact-cta" id="contact">
                    <div className="contact-icon-wrapper">
                        <Mail size={32} strokeWidth={1.5} />
                    </div>
                    <h3>MIT ADT Training & Placement Cell</h3>
                    <p>For administrative assistance regarding the Smart Attendance & Placement Portal, please contact the centralized cell.</p>
                    <a href="mailto:placements@mituniversity.edu.in" className="contact-btn">Email Placement Cell</a>
                </div>
            </section>

            {/* Premium Footer Redesign */}
            <footer className="landing-footer-premium">
                <div className="footer-container-premium">
                    <div className="footer-brand-col">
                        <div className="footer-logo-lockup">
                            <img src={mitLogo} alt="MIT ADT Logo" className="footer-logo-img" onError={(e) => e.target.style.display = 'none'} />
                            <div>
                                <h4 className="footer-brand-name">MIT ADT University</h4>
                                <p className="footer-brand-sub">Training & Placement Cell</p>
                            </div>
                        </div>
                        <p className="footer-mission">
                            Empowering the next generation of engineers and innovators through world-class placement opportunities.
                        </p>
                        <div className="footer-socials">
                            <a href="https://www.linkedin.com/school/mit-adtuniversity/" target="_blank" rel="noopener noreferrer" className="social-icon-box" aria-label="LinkedIn"><Linkedin size={18} /></a>
                            <a href="https://x.com/mitadtpune" target="_blank" rel="noopener noreferrer" className="social-icon-box" aria-label="Twitter"><Twitter size={18} /></a>
                            <a href="https://www.instagram.com/mitadtuniversity/" target="_blank" rel="noopener noreferrer" className="social-icon-box" aria-label="Instagram"><Instagram size={18} /></a>
                            <a href="https://mituniversity.ac.in/" target="_blank" rel="noopener noreferrer" className="social-icon-box" aria-label="Website"><Globe size={18} /></a>
                        </div>
                    </div>

                    <div className="footer-links-grid">
                        <div className="footer-link-col">
                            <h5>Platform</h5>
                            <Link to="/login">Student Portal</Link>
                            <Link to="/login">Faculty Login</Link>
                            <Link to="/login">Admin Dashboard</Link>
                            <a href="#features">Features</a>
                        </div>
                        <div className="footer-link-col">
                            <h5>Resources</h5>
                            <a href="#">Placement Stats</a>
                            <a href="#">Recruiters</a>
                            <a href="#">Success Stories</a>
                            <a href="#">Support Center</a>
                        </div>
                        <div className="footer-link-col">
                            <h5>Contact</h5>
                            <a href="mailto:placements@mituniversity.edu.in">placements@mituniversity.edu.in</a>
                            <a href="tel:+919595124234">+91-9595124234</a>
                            <span className="address-span">Pune, Maharashtra, India</span>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom-premium">
                    <div className="footer-bottom-content">
                        <p className="copyright-text">
                            &copy; 2026 MIT Art, Design & Technology University. All rights reserved.
                        </p>
                        <div className="developer-credit-wrapper">
                            <span className="dev-label">Designed & Developed by</span>
                            <a
                                href="https://www.pranavx.in/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="developer-link-premium"
                            >
                                pranavgawai
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
