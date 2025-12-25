import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Calendar, Users, Briefcase, Award, Settings, Menu, X, Monitor, FileText } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout({ children, title, actions }) {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: Calendar, label: 'Events', path: '/admin/events' },
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: Monitor, label: 'Labs', path: '/admin/labs' },
        { icon: Award, label: 'Assessments', path: '/admin/assessments' },
        { icon: Briefcase, label: 'Allocations', path: '/admin/allocations' },
        { icon: FileText, label: 'Reports', path: '/admin/reports' },
    ];

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>

            {/* 1. Institutional Header */}
            <header style={{
                background: 'white',
                borderBottom: '1px solid #e2e8f0',
                padding: '0 2rem',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 50
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src="/mitadtlogo.png" alt="MIT" style={{ height: '48px' }} />
                        <div style={{ height: '32px', width: '1px', background: '#cbd5e1' }}></div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b', lineHeight: 1.2 }}>MIT Art, Design & Technology University</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: '500', color: '#64748b' }}>Training & Placement Cell</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', background: '#f1f5f9', borderRadius: '30px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#4c1d95', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem' }}>
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', marginRight: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>{user?.name || 'Administrator'}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Admin Access</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}
                    >
                        <LogOut size={18} /> Exit
                    </button>
                </div>
            </header>

            {/* 2. Main Layout Area */}
            <div style={{ flex: 1, display: 'flex', maxWidth: '1600px', width: '100%', margin: '0 auto', padding: '2rem' }}>

                {/* Sidebar Navigation - Hidden on Main Dashboard */}
                {location.pathname !== '/admin' && (
                    <aside style={{ width: '240px', flexShrink: 0, marginRight: '2rem' }}>
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                                            padding: '0.85rem 1rem',
                                            borderRadius: '12px',
                                            textDecoration: 'none',
                                            transition: 'all 0.2s',
                                            background: isActive ? '#4c1d95' : 'transparent',
                                            color: isActive ? 'white' : '#64748b',
                                            fontWeight: isActive ? '600' : '500',
                                            boxShadow: isActive ? '0 4px 6px -1px rgba(76, 29, 149, 0.3)' : 'none'
                                        }}
                                    >
                                        <item.icon size={20} />
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </nav>
                    </aside>
                )}

                {/* Content Area */}
                <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Page Title & Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em', margin: 0 }}>
                                {title}
                            </h1>
                            <div style={{ height: '4px', width: '60px', background: '#4c1d95', borderRadius: '2px', marginTop: '0.5rem' }}></div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {actions}
                        </div>
                    </div>

                    {/* Page Content Card */}
                    <div style={{
                        background: 'white',
                        borderRadius: '24px',
                        padding: '2rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                        border: '1px solid #f1f5f9',
                        minHeight: '600px'
                    }}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
