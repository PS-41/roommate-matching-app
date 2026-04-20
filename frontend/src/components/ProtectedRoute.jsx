import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { api } from '../services/api';

export default function ProtectedRoute() {
  const location = useLocation();
  const token = api.getToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}