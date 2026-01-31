import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    Users,
    Briefcase,
    Award,
    Settings,
    Monitor,
    FileText,
    Building2,
    LogOut,
    PanelLeftClose,
    PanelLeft,
    Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

export default function AdminLayout({ children, title, actions }) {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isSuperAdmin = user?.role === 'super_admin';

    const menuSections = [
        {
            title: 'USERS & ACCESS',
            items: [
                { icon: Users, label: 'Students', path: '/admin/users' },
                isSuperAdmin ? { icon: Shield, label: 'Admins', path: '/admin/manage-admins' } : null,
            ].filter(Boolean)
        },
        {
            title: 'LIVE OPERATIONS',
            items: [
                { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
                { icon: Calendar, label: 'Sessions', path: '/admin/events' },
                { icon: Award, label: 'Assessments', path: '/admin/assessments' },
            ]
        },
        {
            title: 'INFRASTRUCTURE',
            items: [
                { icon: Monitor, label: 'Labs', path: '/admin/labs' },
                { icon: Briefcase, label: 'Seat Allocations', path: '/admin/allocations' },
            ]
        },
        {
            title: 'PLACEMENTS',
            items: [
                { icon: Building2, label: 'Placement Drives', path: '/admin/placements' },
            ]
        },
        {
            title: 'REPORTS',
            items: [
                { icon: FileText, label: 'Reports', path: '/admin/reports' },
            ]
        },
        {
            title: 'SYSTEM',
            items: [
                { icon: Settings, label: 'Settings', path: '/admin/settings' },
            ]
        }
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '"Inter", sans-serif' }}>

            {/* Sidebar */}
            <aside style={{
                width: isCollapsed ? '0px' : '280px',
                backgroundColor: '#ffffff',
                borderRight: isCollapsed ? 'none' : '1px solid #f1f5f9',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                height: '100vh',
                overflowY: 'auto',
                padding: isCollapsed ? '0' : '1.5rem',
                zIndex: 50,
                transition: 'all 0.3s ease',
                visibility: isCollapsed ? 'hidden' : 'visible'
            }}>
                {/* 1. Brand Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', marginBottom: '2rem', transition: 'all 0.3s ease' }}>

                    {!isCollapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '10px',
                                backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                <img src="/mitadtlogo.png" alt="MIT" style={{ height: '24px', width: 'auto' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', lineHeight: '1.2', whiteSpace: 'nowrap', letterSpacing: '-0.3px' }}>MIT ADT, Pune</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b', whiteSpace: 'nowrap' }}>Placement Admin</span>
                                    <span style={{
                                        fontSize: '0.65rem', fontWeight: '700',
                                        padding: '1px 6px', borderRadius: '4px',
                                        backgroundColor: isSuperAdmin ? '#eff6ff' : '#f1f5f9',
                                        color: isSuperAdmin ? '#2563eb' : '#64748b',
                                        border: isSuperAdmin ? '1px solid #dbeafe' : '1px solid #e2e8f0',
                                        textTransform: 'uppercase', letterSpacing: '0.5px'
                                    }}>
                                        {isSuperAdmin ? 'SUPER' : 'ADMIN'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        style={{
                            background: 'transparent',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px',
                            color: '#94a3b8',
                            transition: 'all 0.2s',
                            width: '32px', height: '32px'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#475569'}
                        onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                    >
                        {isCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
                    </button>
                </div>

                {/* Navigation Sections */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {menuSections.map((section, index) => (
                        <div key={index}>
                            <div style={{
                                fontSize: '0.7rem',
                                fontWeight: '700',
                                color: '#94a3b8',
                                marginBottom: '0.5rem',
                                paddingLeft: '0.5rem',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase'
                            }}>
                                {section.title}
                            </div>
                            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {section.items.map((item) => {
                                    const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                                    return (
                                        <Link
                                            key={item.label}
                                            to={item.path}
                                            onClick={(e) => item.disabled && e.preventDefault()}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.6rem 1rem',
                                                borderRadius: '8px',
                                                color: isActive ? '#4f46e5' : (item.disabled ? '#cbd5e1' : '#64748b'),
                                                backgroundColor: isActive ? '#eef2ff' : 'transparent',
                                                textDecoration: 'none',
                                                transition: 'all 0.2s',
                                                fontWeight: isActive ? '600' : '500',
                                                cursor: item.disabled ? 'default' : 'pointer'
                                            }}
                                        >
                                            <item.icon size={18} strokeWidth={2} />
                                            <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    ))}

                    {/* Logout Button (Appended to System or Separate) */}
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.6rem 1rem',
                            borderRadius: '8px',
                            color: '#ef4444',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'left',
                            transition: 'all 0.2s',
                            fontWeight: '500',
                            fontSize: '0.9rem',
                            fontFamily: 'inherit',
                            marginTop: '-1rem' // Visual adjustment to sit near System section
                        }}
                    >
                        <LogOut size={18} strokeWidth={2} />
                        <span>Sign Out</span>
                    </button>
                </div>

            </aside>

            {/* Main Content Area - Shifted Right */}
            <div style={{
                flex: 1,
                marginLeft: isCollapsed ? '0px' : '280px',
                display: 'flex',
                flexDirection: 'column',
                transition: 'margin-left 0.3s ease'
            }}>

                {/* Header (Search + Actions) */}
                <header style={{
                    height: '80px',
                    padding: '0 2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#f8fafc',
                    position: 'sticky',
                    top: 0,
                    zIndex: 40
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#1e293b' }}>
                        {isCollapsed && (
                            <button
                                onClick={() => setIsCollapsed(false)}
                                style={{
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#64748b'
                                }}
                            >
                                <PanelLeft size={20} />
                            </button>
                        )}
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>{title}</h1>
                    </div>


                    <Link to="/admin/settings" style={{ textDecoration: 'none' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#334155',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            border: '2px solid white',
                            cursor: 'pointer'
                        }}>
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                    </Link>
                </header>

                <main style={{ padding: '0 2rem 2rem', flex: 1 }}>
                    {/* Page Actions (if any) */}
                    {actions && (
                        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                            {actions}
                        </div>
                    )}

                    {/* Page Content */}
                    <div style={{
                        background: 'none',
                        borderRadius: '0',
                        boxShadow: 'none',
                        border: 'none',
                        minHeight: 'auto'
                    }}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
