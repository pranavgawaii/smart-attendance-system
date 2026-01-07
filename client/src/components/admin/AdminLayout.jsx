import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    Users,
    Briefcase,
    Award,
    Settings,
    HelpCircle,
    Monitor,
    FileText,
    Building2,
    LogOut,
    ChevronRight,
    Search,
    Bell,
    PanelLeftClose,
    PanelLeft
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

    const mainMenuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: Users, label: 'Students', path: '/admin/users' },
        { icon: Building2, label: 'Placements', path: '/admin/placements' },
        { icon: Briefcase, label: 'Allocations', path: '/admin/allocations' },
        { icon: Calendar, label: 'Schedule', path: '/admin/events' },
        { icon: Award, label: 'Assessments', path: '/admin/assessments' },
        { icon: Monitor, label: 'Labs Management', path: '/admin/labs' },
        { icon: FileText, label: 'Reports & Analytics', path: '/admin/reports' },
    ];

    const otherItems = [];

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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', marginBottom: '2rem' }}>

                    {!isCollapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img src="/mitadtlogo.png" alt="MIT" style={{ height: '40px', width: 'auto' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', lineHeight: '1.2', whiteSpace: 'nowrap' }}>MIT ADT, Pune</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: '500', color: '#64748b', whiteSpace: 'nowrap' }}>Admin Portal</span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        style={{
                            background: 'transparent',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                            color: '#64748b'
                        }}
                    >
                        {isCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
                    </button>
                </div>

                {/* 2. Profile Card */}
                <div style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '2rem',
                    border: '1px solid #f1f5f9'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: '#1e293b',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        fontWeight: '600'
                    }}>
                        {user?.name?.charAt(0) || 'A'}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.name || 'Administrator'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>MIT University</div>
                    </div>
                    <div style={{ color: '#94a3b8' }}>
                        <ChevronRight size={16} />
                    </div>
                </div>

                {/* 3. Main Menu */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', marginBottom: '1rem', paddingLeft: '0.5rem', letterSpacing: '0.05em' }}>MAIN MENU</div>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {mainMenuItems.map((item) => {
                            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '10px',
                                        color: isActive ? '#4f46e5' : '#64748b',
                                        backgroundColor: isActive ? '#eef2ff' : 'transparent',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s',
                                        fontWeight: isActive ? '600' : '500'
                                    }}
                                >
                                    <item.icon size={20} />
                                    <span style={{ fontSize: '0.95rem' }}>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* 4. Departments / Modules */}


                {/* 5. Other */}
                <div style={{ marginTop: 'auto' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', marginBottom: '1rem', paddingLeft: '0.5rem', letterSpacing: '0.05em' }}>OTHER</div>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {otherItems.map((item) => (
                            <Link
                                key={item.label}
                                to={item.path}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '10px',
                                    color: '#64748b',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s',
                                    fontWeight: '500'
                                }}
                            >
                                <item.icon size={20} />
                                <span style={{ fontSize: '0.95rem' }}>{item.label}</span>
                            </Link>
                        ))}
                        <button
                            onClick={handleLogout}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: '10px',
                                color: '#ef4444',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left',
                                transition: 'all 0.2s',
                                fontWeight: '500',
                                fontSize: '0.95rem',
                                fontFamily: 'inherit'
                            }}
                        >
                            <LogOut size={20} />
                            <span>Log out</span>
                        </button>
                    </nav>
                </div>
            </aside>

            {/* Main Content Area - Shifted Right */}
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
