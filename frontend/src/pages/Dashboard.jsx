import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // We will populate this from the backend matching algorithm later
  const [matches, setMatches] = useState([]); 

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userData = await api.getCurrentUser();
        setUser(userData);
        
        // If they have a location set, we would ideally fetch matches here
        // if (userData.has_location_set) {
        //   const matchData = await api.getMatches();
        //   setMatches(matchData);
        // }
      } catch (err) {
        setError("Failed to load user data. Please try logging in again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Welcome back{user?.first_name ? `, ${user.first_name}` : ''}!
          </h1>
          <p className="mt-1 text-gray-500">
            {user?.has_location_set 
              ? "Here are your potential roommates, ranked by highest compatibility." 
              : "Let's get you set up to find your perfect roommate."}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-red-700">
            {error}
          </div>
        )}

        {/* STATE 1: User has NO location set */}
        {!user?.has_location_set ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center max-w-3xl mx-auto mt-10">
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📍</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Where are you moving?</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              We need to know your target location and preferences before we can run our matching algorithm to find compatible roommates.
            </p>
            <Link 
              to="/profile" 
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-brand-600 hover:bg-brand-500 shadow-md transition-all"
            >
              Set Location & Preferences
            </Link>
          </div>
        ) : (
          
          /* STATE 2: User has location, but NO matches found */
          matches.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center mt-6">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🔍</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No perfect matches yet</h2>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                We couldn't find anyone matching your exact criteria in that area. Try expanding your search radius or relaxing some of your dealbreakers.
              </p>
              <Link 
                to="/profile" 
                className="inline-flex items-center text-brand-600 hover:text-brand-500 font-medium"
              >
                Edit your preferences &rarr;
              </Link>
            </div>
          ) : (
            
            /* STATE 3: Matches Found! (We will build these cards later) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Match Cards will go here */}
            </div>
          )
        )}
      </main>
    </div>
  );
}