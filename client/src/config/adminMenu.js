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
    Users2,
    FileText
} from 'lucide-react';

export const getAdminMenu = (role) => {
    const isSuperAdmin = role === 'super_admin';
    const isCoordinatorAdmin = role === 'coordinator_admin';

    // Allowed paths for coordinator_admin
    const coordinatorAllowedPaths = [
        '/admin/dashboard',
        '/admin',
        '/admin/coordinators',
        '/admin/coordinators/attendance',
        '/admin/coordinators/forms',
        '/admin/users',
        '/admin/students'
    ];

    // Helper function to mark items as locked for coordinator_admin
    const markLocked = (item) => {
        if (!isCoordinatorAdmin) return item;
        const isAllowed = coordinatorAllowedPaths.some(p =>
            item.path === p ||
            item.path.startsWith('/admin/coordinators') ||
            item.path.startsWith('/admin/coordinators/forms') ||
            item.path.startsWith('/admin/users') ||
            item.path.startsWith('/admin/students')
        );
        return { ...item, locked: !isAllowed };
    };

    return [
        {
            title: null,
            items: [
                markLocked({ icon: LayoutDashboard, label: 'Dashboard', path: '/admin' }),
            ]
        },
        {
            title: 'Student Management',
            items: [
                markLocked({ icon: Users, label: 'All Students', path: '/admin/users' }),
                markLocked({ icon: UserPlus, label: 'Bulk Upload', path: '/admin/users/bulk-upload' }),
                markLocked({ icon: Grid, label: 'Allocations', path: '/admin/allocations' }),
                markLocked({ icon: Users2, label: 'Coordinator', path: '/admin/coordinators' }),
            ]
        },
        {
            title: 'Attendance',
            items: [
                markLocked({ icon: Calendar, label: 'Sessions Management', path: '/admin/events' }),
                markLocked({ icon: MapPin, label: 'Labs', path: '/admin/labs' }),
                markLocked({ icon: FileDown, label: 'Reports & Analytics', path: '/admin/reports' }),
            ]
        },
        {
            title: 'Placements',
            items: [
                markLocked({ icon: Building2, label: 'Placement Drives', path: '/admin/placements' }),
                markLocked({ icon: ClipboardList, label: 'Applications', path: '/admin/placements/applications' }),
                markLocked({ icon: Target, label: 'Eligibility Rules', path: '/admin/placements/eligibility' }),
                markLocked({ icon: PieChart, label: 'Placement Stats', path: '/admin/placements/stats' }),
            ]
        },
        {
            title: 'System',
            items: [
                markLocked({ icon: Settings, label: 'Settings', path: '/admin/settings' }),
                isSuperAdmin ? { icon: ShieldCheck, label: 'Admins', path: '/admin/manage-admins' } : null,
            ].filter(Boolean)
        }
    ];
};
