import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import AuthLayout from '../components/AuthLayout';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Sign in to your account" 
      subtitle={
        <span>
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-500 transition-colors">
            Sign up for free
          </Link>
        </span>
      }
    >
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
          <input
            type="text"
            required
            className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-all"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
          <input
            type="password"
            required
            className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-all"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-70 shadow-md"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </AuthLayout>
  );
}