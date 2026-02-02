import React from 'react';
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
    Shield,
    ChevronRight,
    BookOpen,
    GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/mitadtlogo.png';

export default function Sidebar({ isCollapsed, toggleSidebar }) {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isSuperAdmin = user?.role === 'super_admin';

    const menuSections = [
        {
            title: null, // No title for first section in reference
            items: [
                { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
                { icon: Calendar, label: 'Sessions', path: '/admin/events' },
                { icon: Users, label: 'Students', path: '/admin/users' },
                { icon: Award, label: 'Assessments', path: '/admin/assessments' },
                { icon: Monitor, label: 'Labs', path: '/admin/labs' },
            ]
        },
        {
            title: 'Placement',
            items: [
                { icon: Building2, label: 'Drives', path: '/admin/placements' },
                { icon: Briefcase, label: 'Allocations', path: '/admin/allocations' },
                { icon: FileText, label: 'Reports', path: '/admin/reports' },
            ]
        },
        {
            title: 'System',
            items: [
                { icon: Settings, label: 'Settings', path: '/admin/settings' },
                isSuperAdmin ? { icon: Shield, label: 'Admins', path: '/admin/manage-admins' } : null,
            ].filter(Boolean)
        }
    ];

    return (
        <aside className={`
            bg-zinc-50 border-r border-zinc-200 flex flex-col fixed h-screen z-50 transition-all duration-300 ease-in-out
            ${isCollapsed ? 'w-[70px]' : 'w-64'}
        `}>
            {/* 1. Brand Header */}
            {/* 1. Brand Header */}
            <div className="flex items-center gap-3 h-20 px-6 mb-2">
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    <img
                        src={logo}
                        alt="MIT ADT Logo"
                        className="w-full h-full object-contain"
                    />
                </div>
                {!isCollapsed && (
                    <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-tight text-zinc-900 leading-tight whitespace-nowrap">MIT ADT University</span>
                        <span className="text-[10px] font-medium text-zinc-500 tracking-wide">Training & Placement Cell</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-4 space-y-6 no-scrollbar">
                {menuSections.map((section, index) => (
                    <div key={index}>
                        {!isCollapsed && section.title && (
                            <p className="text-xs font-medium text-zinc-400 mb-3 px-3 tracking-wide uppercase">
                                {section.title}
                            </p>
                        )}
                        <nav className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                                return (
                                    <Link
                                        key={item.label}
                                        to={item.path}
                                        className={`
                                            flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group
                                            ${isActive
                                                ? 'bg-white border border-zinc-200 shadow-sm text-zinc-900 font-medium'
                                                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 font-normal'
                                            }
                                        `}
                                        title={isCollapsed ? item.label : ''}
                                    >
                                        <item.icon
                                            size={18}
                                            strokeWidth={1.5}
                                            className={isActive ? 'text-zinc-900' : 'text-zinc-500 group-hover:text-zinc-900'}
                                        />

                                        {!isCollapsed && (
                                            <span className="text-sm">{item.label}</span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                ))}


            </div>

            {/* User Profile Footer */}
            <div className="p-4 border-t border-zinc-200 mx-2">
                <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
                    <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center overflow-hidden shrink-0">
                        <span className="text-xs font-semibold text-zinc-600">{user?.name?.charAt(0) || 'A'}</span>
                    </div>

                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 truncate">{user?.name || 'Admin User'}</p>
                            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                        </div>
                    )}

                    {!isCollapsed && (
                        <button
                            onClick={handleLogout}
                            className="text-zinc-400 hover:text-zinc-900 transition-colors"
                        >
                            <LogOut size={16} strokeWidth={1.5} />
                        </button>
                    )}
                </div>

                {/* Collapse Toggle (Moved to bottom or removed if not in reference? Reference doesn't show toggle, but I'll keep it subtle) */}
                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-20 bg-white border border-zinc-200 rounded-full p-1 text-zinc-400 hover:text-zinc-900 shadow-sm md:flex hidden"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <PanelLeftClose size={14} />}
                </button>
            </div>
        </aside>
    );
}
