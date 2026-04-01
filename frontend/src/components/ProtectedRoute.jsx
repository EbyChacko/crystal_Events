import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Forbidden from '../pages/errors/Forbidden';

const ProtectedRoute = ({ children, requireSuperUser = false }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-deep-teal border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/admin/login" replace />;
    }

    if (requireSuperUser && !user.is_superuser) {
        return <Forbidden />;
    }

    return children;
};

export default ProtectedRoute;
