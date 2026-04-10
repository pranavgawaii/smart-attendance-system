import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (role && user.role !== role) {
        // Allow super_admin to access anything an admin can
        if (role === 'admin' && user.role === 'super_admin') {
            return children;
        }

        // Allow coordinator_admin to access only coordinator-related admin pages
        if (role === 'admin' && user.role === 'coordinator_admin') {
            const allowedPaths = ['/admin/coordinators', '/admin/users', '/admin/students', '/admin'];
            const isAllowed = allowedPaths.some(path =>
                location.pathname === path ||
                location.pathname.startsWith('/admin/coordinators') ||
                location.pathname.startsWith('/admin/users') ||
                location.pathname.startsWith('/admin/students')
            );

            if (isAllowed) {
                return children;
            }
            return <Navigate to="/admin/coordinators" replace />;
        }

        return <div>Unauthorized. Required role: {role}</div>;
    }

    return children;
}
