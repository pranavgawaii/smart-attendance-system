import {
    LayoutDashboard,
    Calendar,
    Users,
    Building2,
    Settings,
    FileDown,
    ShieldCheck,
    Target,
    PieChart,
    UserPlus,
    MapPin,
    Grid,
    ClipboardList,
    BarChart3,
    Users2
} from 'lucide-react';

export const getAdminMenu = (role) => {
    const isSuperAdmin = role === 'super_admin';

    return [
        {
            title: null,
            items: [
                { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
            ]
        },
        {
            title: 'Student Management',
            items: [
                { icon: Users, label: 'All Students', path: '/admin/users' },
                { icon: UserPlus, label: 'Bulk Upload', path: '/admin/users/bulk-upload' },
                { icon: Grid, label: 'Allocations', path: '/admin/allocations' },
            ]
        },
        {
            title: 'Attendance',
            items: [
                { icon: Calendar, label: 'Sessions Management', path: '/admin/events' },
                { icon: MapPin, label: 'Labs', path: '/admin/labs' },
                { icon: FileDown, label: 'Reports & Analytics', path: '/admin/reports' },
            ]
        },
        {
            title: 'Placements',
            items: [
                { icon: Building2, label: 'Placement Drives', path: '/admin/placements' },
                { icon: ClipboardList, label: 'Applications', path: '/admin/placements/applications' },
                { icon: Target, label: 'Eligibility Rules', path: '/admin/placements/eligibility' },
                { icon: Users2, label: 'Coordinators', path: '/admin/coordinators' },
                { icon: PieChart, label: 'Placement Stats', path: '/admin/placements/stats' },
            ]
        },
        {
            title: 'System',
            items: [
                { icon: Settings, label: 'Settings', path: '/admin/settings' },
                isSuperAdmin ? { icon: ShieldCheck, label: 'Admins', path: '/admin/manage-admins' } : null,
            ].filter(Boolean)
        }
    ];
};
