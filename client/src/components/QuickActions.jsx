import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Download, FileText, Settings, Users, Calendar } from 'lucide-react';

const actions = [
    {
        label: 'Create Session',
        desc: 'Schedule a new attendance session',
        icon: Calendar, // Changed from Plus to Calendar for better context
        path: '/admin/events', // Typically handled on the events page, but direct link is good
        primary: true
    },
    {
        label: 'Export Reports',
        desc: 'Download attendance data CSV',
        icon: Download,
        path: '/admin/reports'
    },
    {
        label: 'Add Student',
        desc: 'Register a new student manually',
        icon: Users,
        path: '/admin/users'
    },
    {
        label: 'System Settings',
        desc: 'Configure global parameters',
        icon: Settings,
        path: '/admin/settings'
    }
];

export default function QuickActions() {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">Quick Actions</h3>
            </div>
            <div className="p-2">
                {actions.map((action, index) => (
                    <Link
                        key={index}
                        to={action.path}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group mb-1 last:mb-0"
                    >
                        <div className={`p-2 rounded-md ${action.primary ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 text-slate-500 group-hover:text-primary-600 group-hover:bg-primary-50 transition-colors'}`}>
                            <action.icon size={18} strokeWidth={1.5} />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-800 group-hover:text-primary-700 transition-colors">
                                {action.label}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                                {action.desc}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
