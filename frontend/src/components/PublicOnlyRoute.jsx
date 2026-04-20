import { Navigate, Outlet } from 'react-router-dom';
import { api } from '../services/api';

export default function PublicOnlyRoute() {
  const token = api.getToken();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}