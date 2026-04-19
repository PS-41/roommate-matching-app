import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    api.logout(); // Clears the local storage token
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Left Side: Logo & Brand */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-brand-600 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                R
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">RoomieMatch</span>
            </Link>
          </div>

          {/* Right Side: Links & Logout */}
          <div className="flex items-center space-x-6">
            <Link 
              to="/dashboard" 
              className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              to="/profile" 
              className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors"
            >
              Edit Profile
            </Link>
            
            <div className="h-4 border-l border-gray-300"></div> {/* Divider */}
            
            <button 
              onClick={handleLogout}
              className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
            >
              Sign out
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}