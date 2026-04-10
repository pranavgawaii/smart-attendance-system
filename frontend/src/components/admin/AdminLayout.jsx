import { useLocation } from 'react-router-dom';
import { useState, useMemo } from 'react';
import Sidebar from '../Sidebar';
import { Search, Bell, Menu, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAdminMenu } from '../../config/adminMenu';

export default function AdminLayout({ children, title }) {
    const { user } = useAuth();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const location = useLocation();

    // Calculate Breadcrumbs based on current path
    const breadcrumbs = useMemo(() => {
        const menuSections = getAdminMenu(user?.role);

        let bestMatch = null;

        // Find the most specific active menu item (longest path match)
        for (const section of menuSections) {
            for (const item of section.items) {
                const isMatch = item.path === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname === item.path || location.pathname.startsWith(item.path + '/');

                if (isMatch) {
                    if (!bestMatch || item.path.length > bestMatch.item.path.length) {
                        bestMatch = { section, item };
                    }
                }
            }
        }

        // Return components for breadcrumbs
        return {
            category: bestMatch?.section?.title || 'Dashboard',
            page: bestMatch?.item?.label || title || 'Overview'
        };
    }, [location.pathname, user?.role, title]);

    return (
        <div className="bg-zinc-50 min-h-screen font-sans flex text-sm">

            {/* Sidebar */}
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            {/* Main Content */}
            <div className={`
                flex-1 flex flex-col transition-all duration-300 ease-in-out h-screen overflow-hidden
                ${isSidebarCollapsed ? 'ml-[70px]' : 'ml-64'}
            `}>

                {/* Top Navigation Bar */}
                <header className="h-16 px-6 md:px-8 bg-white/50 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-40 flex items-center justify-between">

                    {/* Left: Breadcrumbs/Title */}
                    <div className="flex items-center gap-4">
                        <button className="md:hidden text-zinc-900" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                            <Menu size={24} strokeWidth={1.5} />
                        </button>

                        <nav className="hidden md:flex items-center text-xs text-zinc-500">
                            <span className="hover:text-zinc-900 cursor-pointer transition-colors font-medium">{breadcrumbs.category}</span>
                            <ChevronRight size={12} className="mx-2 text-zinc-300" />
                            <span className="text-zinc-900 font-bold tracking-tight">{breadcrumbs.page}</span>
                        </nav>
                    </div>

                    {/* Right: Search & Actions */}
                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="relative group hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 transition-colors" size={16} strokeWidth={1.5} />
                            <input
                                type="text"
                                placeholder="Search research, students..."
                                className="bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-zinc-400 focus:ring-0 rounded-full pl-9 pr-4 py-1.5 text-xs w-48 focus:w-64 transition-all outline-none placeholder:text-zinc-400"
                            />
                        </div>


                        {/* User Role Badge */}
                        <div className="hidden md:flex items-center px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200">
                            <span className="text-xs font-semibold text-zinc-600">
                                {user?.role === 'super_admin' ? 'Super Admin' :
                                    user?.role === 'coordinator_admin' ? 'Coordinator Admin' : 'Admin'}
                            </span>
                        </div>

                        {/* Notifications */}
                        <button className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors">
                            <Bell size={18} strokeWidth={1.5} />
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
                        </button>
                    </div>
                </header>

                {/* Main Scrollable Area */}
                <main className="flex-1 overflow-y-auto bg-zinc-50 p-6 md:p-8">
                    <div className="max-w-6xl mx-auto space-y-8">
                        {children}
                    </div>

                    {/* Footer */}
                    <footer className="mt-12 mb-6 text-center">
                        <p className="text-[10px] text-zinc-400">© 2026 MIT ADT University • <a href="#" className="hover:text-zinc-600">Privacy</a> • <a href="#" className="hover:text-zinc-600">Terms</a></p>
                    </footer>
                </main>

            </div>
        </div>
    );
}
