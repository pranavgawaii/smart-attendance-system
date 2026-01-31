import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/" />;
    }

    if (role && user.role !== role) {
        // Allow super_admin to access anything an admin can
        if (role === 'admin' && user.role === 'super_admin') {
            return children;
        }
        return <div>Unauthorized. Required role: {role}</div>;
    }

    return children;
}
