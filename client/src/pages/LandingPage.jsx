import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Smartphone, ShieldCheck, BarChart3, MapPin } from 'lucide-react';
import './LandingPage.css';
import mitLogo from '../assets/mitadtlogo.png';
import heroVideo from '../assets/itbuilding.mp4';

const LandingPage = () => {
    const [isScrolled, setIsScrolled] = useState(false);

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

    return (
        <div className="landing-page">
            {/* Navigation */}
            {/* Top Utility Bar - Hidden on scroll if desired, or kept? User just said top bar. 
                Usually professional floating navs might hide utility or keep it. 
                I will affect the 'landing-nav' which is the main one. */}

            {/* Professional Navigation Bar */}
            <nav className={`landing-nav ${isScrolled ? 'scrolled' : ''}`}>
                <div className="landing-logo-group">
                    <img src={mitLogo} alt="MIT ADT University" className="nav-logo" onError={(e) => e.target.style.display = 'none'} />
                    <div className="nav-divider"></div>
                    <div className="nav-text-group">
                        <span className="nav-uni-name desktop-text">MIT Art, Design & Technology University</span>

                        <span className="nav-dept-name">Training & Placement Cell</span>
                    </div>
                </div>

                <div className="nav-links">
                    <a href="#features">Features</a>
                    <a href="#partners">Recruiting Partners</a>
                    <a href="#contact">Contact Us</a>
                </div>

                <Link to="/login" className="auth-btn">
                    Log in
                </Link>
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
                            MIT Art, Design & Technology University's unified platform connecting students with top recruiters across industries.
                        </p>

                        <Link to="/login" className="hero-access-btn">
                            Access Portal <ArrowRight size={20} />
                        </Link>



                        <div className="hero-location">
                            <MapPin size={20} className="location-icon-svg" /> MIT Art, Design & Technology University, Pune
                        </div>
                    </div>
                </div>
            </main>

            {/* Stats Section moved above Engineered */}
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
            </section>

            {/* Engineered for Excellence Section */}
            <section className="engineered-section" id="features">
                <div className="section-container">
                    <h2 className="section-title">Engineered for Excellence</h2>
                    <p className="section-subtitle">The technology behind successful careers.</p>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <Smartphone size={32} strokeWidth={1.5} />
                            </div>
                            <h3>Mobile First</h3>
                            <p>Seamless attendance tracking on the go for students.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <ShieldCheck size={32} strokeWidth={1.5} />
                            </div>
                            <h3>Secure Access</h3>
                            <p>Device-lock technology ensures proxy-free integrity.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <BarChart3 size={32} strokeWidth={1.5} />
                            </div>
                            <h3>Live Analytics</h3>
                            <p>Real-time dashboards for faculty and administration.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Marquee Section */}
            <div className="marquee-wrapper" id="partners">
                <div className="marquee-title-fancy">Recruiting Partner</div>
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



            {/* FAQ Section */}
            <section className="faq-section">
                <h2 className="faq-title">Common Queries</h2>

                <div className="faq-item">
                    <div className="faq-question">How does proxy prevention work?</div>
                    <div className="faq-answer">
                        Our Device Lock technology binds a student's account to their specific smartphone.
                        Attempting to log in from another device triggers a security lock, preventing unauthorized attendance.
                    </div>
                </div>

                <div className="faq-item">
                    <div className="faq-question">Does the QR code expire?</div>
                    <div className="faq-answer">
                        Yes. The dynamic QR code rotates every few seconds. This prevents students from taking
                        photos and sharing them with absent peers.
                    </div>
                </div>

                <div className="faq-item">
                    <div className="faq-question">Can parents track attendance?</div>
                    <div className="faq-answer">
                        We provide a dedicated parent portal (coming soon) and optional SMS notifications
                        for daily absence, keeping guardians informed in real-time.
                    </div>
                </div>

                <div className="contact-cta" id="contact">
                    <h3>Still have questions?</h3>
                    <p>Our support team is here to help you with any inquiries.</p>
                    <a href="mailto:support@mituniversity.edu.in" className="contact-btn">Contact Us</a>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-col">
                        <h4>Platform</h4>
                        <Link to="/login">Student Portal</Link>
                        <Link to="/login">Faculty Login</Link>
                        <Link to="/login">Admin Dashboard</Link>
                        <a href="#">Check Status</a>
                    </div>
                    <div className="footer-col">
                        <h4>Resources</h4>
                        <a href="#">Academic Calendar</a>
                        <a href="#">Library Access</a>
                        <a href="#">Placement Cell</a>
                        <a href="#">Research Papers</a>
                    </div>
                    <div className="footer-col">
                        <h4>Contact</h4>
                        <a href="#">comp.eng@mituniversity.edu.in</a>
                        <a href="#">+91 123 456 7890</a>
                        <a href="#">Pune, Maharashtra</a>
                        <div className="social-links-row">
                            <a href="#">Twitter</a>
                            <a href="#">LinkedIn</a>
                            <a href="#">Instagram</a>
                        </div>
                    </div>
                    <div className="footer-col newsletter-col">
                        <h4>Stay Updated</h4>
                        <p>Get the latest placement news and campus updates.</p>
                        <div className="footer-input-group">
                            <input type="email" placeholder="Enter your email" />
                            <button>→</button>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    &copy; {new Date().getFullYear()} MIT Art, Design & Technology University. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
