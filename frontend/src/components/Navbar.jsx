import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await api.getCurrentUser();
        setUser(data);
      } catch (err) {
      }
    };

    fetchUser();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  const displayName =
    user?.first_name || user?.last_name
      ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
      : 'My Account';

  const avatarText = user?.first_name
    ? user.first_name[0].toUpperCase()
    : user?.username
      ? user.username[0].toUpperCase()
      : '👤';

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-xl flex items-center justify-center font-extrabold text-xl shadow-md group-hover:scale-105 transition-transform">
                R
              </div>
              <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
                RoomieMatch
              </span>
            </Link>
          </div>

          <div className="flex items-center">
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center space-x-3 focus:outline-none p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold border border-brand-200">
                  {avatarText}
                </div>

                <div className="flex flex-col text-left hidden sm:block">
                  <span className="text-sm font-bold text-gray-900 leading-tight">
                    {displayName}
                  </span>
                  <span className="text-xs text-gray-500 font-medium leading-tight">
                    Options ▾
                  </span>
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-fadeIn z-50">
                  <Link
                    to="/view-profile"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600 font-medium transition-colors"
                  >
                    👁️ View Profile
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600 font-medium transition-colors"
                  >
                    ⚙️ Edit Profile
                  </Link>
                  <Link
                    to="/matches"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600 font-medium transition-colors"
                  >
                    🎯 Matches
                  </Link>
                  <Link
                    to="/inbox"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600 font-medium transition-colors flex justify-between items-center"
                  >
                    <span>💬 Inbox</span>
                    <span className="bg-brand-100 text-brand-700 text-xs py-0.5 px-2 rounded-full font-bold">
                      New
                    </span>
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-red-50 font-bold transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}