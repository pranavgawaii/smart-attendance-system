import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import PageHeader from '../../components/PageHeader';
import { LogOut, User, Shield, Bell, ChevronRight } from 'lucide-react';

export default function AdminSettings() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <AdminLayout title="Settings">
            <div className="max-w-3xl mx-auto">
                <PageHeader
                    title="Account Settings"
                    description="Manage your profile details, security preferences, and notifications."
                />

                {/* Profile Card */}
                <div className="bg-white rounded-2xl p-8 mb-8 border border-zinc-200 shadow-sm flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-zinc-800 text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-zinc-200">
                        {user?.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-zinc-900">{user?.name || 'Administrator'}</h3>
                        <div className="flex items-center gap-3 mt-2 text-zinc-600">
                            <span className="bg-zinc-100 text-zinc-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-zinc-200">
                                {user?.role || 'Admin'}
                            </span>
                            <span className="text-sm">mituniversity.edu.in</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <button className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-sm group">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-zinc-100 rounded-lg text-zinc-600 group-hover:bg-zinc-200 group-hover:text-zinc-900 transition-colors">
                                <User size={20} strokeWidth={1.5} />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-zinc-900">Personal Information</div>
                                <div className="text-sm text-zinc-500">Update your name and contact details</div>
                            </div>
                        </div>
                        <ChevronRight size={20} strokeWidth={1.5} className="text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                    </button>

                    <button className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-sm group">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-zinc-100 rounded-lg text-zinc-600 group-hover:bg-zinc-200 group-hover:text-zinc-900 transition-colors">
                                <Shield size={20} strokeWidth={1.5} />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-zinc-900">Login & Security</div>
                                <div className="text-sm text-zinc-500">Password, 2FA, and login history</div>
                            </div>
                        </div>
                        <ChevronRight size={20} strokeWidth={1.5} className="text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                    </button>

                    <button className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-sm group">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-zinc-100 rounded-lg text-zinc-600 group-hover:bg-zinc-200 group-hover:text-zinc-900 transition-colors">
                                <Bell size={20} strokeWidth={1.5} />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-zinc-900">Notifications</div>
                                <div className="text-sm text-zinc-500">Manage email and system alerts</div>
                            </div>
                        </div>
                        <ChevronRight size={20} strokeWidth={1.5} className="text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                    </button>
                </div>

                {/* Sign Out Section */}
                <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-1">Sign Out</h3>
                        <p className="text-zinc-500 text-sm">Terminates your current session securely.</p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white text-zinc-700 border border-zinc-200 rounded-xl font-semibold text-sm hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 transition-all shadow-sm"
                    >
                        <LogOut size={18} strokeWidth={1.5} />
                        Sign Out
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}
