import { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function StudentLayout({ children, title }) {
    const { user } = useAuth();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

                    {/* Left: Title/Breadcrumbs */}
                    <div className="flex items-center gap-4">
                        <button className="md:hidden text-zinc-900" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                            <Menu size={24} strokeWidth={1.5} />
                        </button>
                        <h1 className="text-lg font-bold text-zinc-900 tracking-tight hidden sm:block">
                            {title || 'Student Portal'}
                        </h1>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200">
                            <span className="text-xs font-semibold text-zinc-600">
                                {user?.name}
                            </span>
                        </div>
                        <button className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors">
                            <Bell size={18} strokeWidth={1.5} />
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
                        <p className="text-[10px] text-zinc-400">© 2026 MIT ADT University • Student Portal</p>
                    </footer>
                </main>

            </div>
        </div>
    );
}
