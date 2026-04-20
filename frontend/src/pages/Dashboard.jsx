import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingSearch, setUpdatingSearch] = useState(false);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState([]);

  const [searchForm, setSearchForm] = useState({
    target_country: 'us',
    zip_code: '',
    search_radius_miles: 10,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userData = await api.getCurrentUser();
        setUser(userData);

        try {
          const profileData = await api.getProfileData();
          setSearchForm({
            target_country: profileData.target_country || 'us',
            zip_code: profileData.zip_code || '',
            search_radius_miles: profileData.search_radius_miles || 10,
          });
        } catch (profileErr) {
        }
      } catch (err) {
        setError('Failed to load user data. Please try logging in again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSearchUpdate = async (e) => {
    e.preventDefault();
    setUpdatingSearch(true);
    setError('');

    try {
      const fullProfile = await api.getProfileData().catch(() => ({}));
      const updatedProfile = {
        ...fullProfile,
        ...searchForm,
      };

      await api.updateProfile(updatedProfile);

      const userData = await api.getCurrentUser();
      setUser(userData);
    } catch (err) {
      setError(err.message || 'Failed to update search settings.');
    } finally {
      setUpdatingSearch(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
      </div>
    );
  }

  const hasLocation = Boolean(user?.has_location_set);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <form
          onSubmit={handleSearchUpdate}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-8 flex flex-col md:flex-row items-end gap-4 relative z-10"
        >
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Country
            </label>
            <select
              value={searchForm.target_country}
              onChange={(e) =>
                setSearchForm({ ...searchForm, target_country: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors appearance-none font-medium"
            >
              <option value="us">United States (US)</option>
              <option value="ca">Canada (CA)</option>
              <option value="uk">United Kingdom (UK)</option>
              <option value="au">Australia (AU)</option>
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              ZIP / Postal Code
            </label>
            <input
              type="text"
              value={searchForm.zip_code}
              onChange={(e) =>
                setSearchForm({ ...searchForm, zip_code: e.target.value })
              }
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors font-medium"
              placeholder="Enter ZIP or postal code"
            />
          </div>

          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-brand-600 uppercase tracking-wider mb-2">
              Radius: {searchForm.search_radius_miles} miles
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={searchForm.search_radius_miles}
              onChange={(e) =>
                setSearchForm({
                  ...searchForm,
                  search_radius_miles: Number(e.target.value),
                })
              }
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600 mt-2"
            />
          </div>

          <button
            type="submit"
            disabled={updatingSearch || !searchForm.zip_code.trim()}
            className="w-full md:w-auto bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex-shrink-0"
          >
            {updatingSearch
              ? 'Saving...'
              : hasLocation
                ? 'Update Search'
                : 'Set Search Area'}
          </button>
        </form>

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-gradient-to-r from-brand-50 to-white p-6 rounded-2xl border border-brand-100 shadow-sm">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Welcome back{user?.first_name ? `, ${user.first_name}` : ''}! 👋
            </h1>
            <p className="mt-2 text-base text-gray-600 font-medium">
              {hasLocation
                ? 'Here are your potential roommates, ranked by highest compatibility.'
                : 'Set your search area and profile preferences to start discovering compatible roommates.'}
            </p>
          </div>

          <Link
            to="/profile"
            className="mt-4 md:mt-0 bg-white border border-gray-200 text-gray-800 px-5 py-3 rounded-xl font-semibold shadow-sm hover:border-brand-500 hover:text-brand-600 transition-all flex items-center space-x-3 group"
          >
            <span className="text-xl group-hover:rotate-12 transition-transform">⚙️</span>
            <span>Edit your preferences</span>
          </Link>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-red-700 font-medium">
            {error}
          </div>
        )}

        {!hasLocation ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center max-w-3xl mx-auto">
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📍</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Your search area is not set yet
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You can still use the search bar above or go to your profile to add more details.
              Matches will appear once your location is saved.
            </p>
            <Link
              to="/profile"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-brand-600 hover:bg-brand-500 shadow-md transition-all"
            >
              Complete Profile
            </Link>
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🔍</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No perfect matches yet</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              We could not find anyone matching your current criteria in that area. Try expanding
              your search radius or relaxing some dealbreakers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {}
          </div>
        )}
      </main>
    </div>
  );
}