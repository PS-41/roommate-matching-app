import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Navbar from '../components/Navbar';

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'lifestyle', 'preferences'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', age: '', gender: 'Any', occupation: 'Undergrad', about_me: '',
    target_country: 'us', zip_code: '', search_radius_miles: 10,
    my_cleanliness: 3, pref_cleanliness: 3, cleanliness_is_strict: false,
    my_sleep_schedule: 3, pref_sleep_schedule: 3, sleep_is_strict: false,
    my_noise_tolerance: 3, pref_noise_tolerance: 3, noise_is_strict: false,
    my_guests_frequency: 3, pref_guests_frequency: 3, guests_is_strict: false,
    is_smoker: false, pref_smoker: false, smoker_is_strict: false,
    has_pets: false, pref_pets: false, pets_is_strict: false,
  });

  // Fetch existing data when the page loads
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.getProfileData();
        setFormData(data);
      } catch (err) {
        // If it's a 404, they just haven't set up a profile yet, which is fine!
        if (!err.message.includes("not found")) {
            setError("Failed to load profile data.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');
    
    try {
      await api.updateProfile(formData);
      setSuccessMsg("Profile saved successfully!");
      // Optionally route them back to dashboard after 1.5 seconds
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const numericTraits = [
    { key: 'cleanliness', label: 'Cleanliness', minLabel: 'Messy', maxLabel: 'Neat Freak' },
    { key: 'sleep_schedule', label: 'Sleep Schedule', minLabel: 'Early Bird', maxLabel: 'Night Owl' },
    { key: 'noise_tolerance', label: 'Noise Tolerance', minLabel: 'Needs Silence', maxLabel: 'Loud' },
    { key: 'guests_frequency', label: 'Guests', minLabel: 'Never', maxLabel: 'Frequent Host' }
  ];

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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Navbar />
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Profile Settings</h1>
          <p className="mt-1 text-gray-500">Update your information and roommate preferences.</p>
        </div>

        {error && <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-red-700 font-medium">{error}</div>}
        {successMsg && <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md text-green-700 font-medium">{successMsg}</div>}

        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden flex flex-col md:flex-row">
          
          {/* Settings Sidebar (Tabs) */}
          <div className="w-full md:w-64 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 p-4">
            <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab('basic')} 
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'basic' ? 'bg-brand-100 text-brand-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                👤 Basic Info & Location
              </button>
              <button 
                onClick={() => setActiveTab('lifestyle')} 
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'lifestyle' ? 'bg-brand-100 text-brand-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                🛋️ My Lifestyle
              </button>
              <button 
                onClick={() => setActiveTab('preferences')} 
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'preferences' ? 'bg-brand-100 text-brand-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                🎯 Roommate Preferences
              </button>
            </nav>
          </div>

          {/* Settings Form Area */}
          <div className="flex-1 p-6 sm:p-8">
            <form onSubmit={handleSubmit}>
              
              {/* TAB 1: Basic Info */}
              {activeTab === 'basic' && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Identity & Location</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-semibold mb-1 text-gray-700">First Name</label>
                      <input type="text" name="first_name" required value={formData.first_name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div><label className="block text-sm font-semibold mb-1 text-gray-700">Last Name</label>
                      <input type="text" name="last_name" required value={formData.last_name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div><label className="block text-sm font-semibold mb-1 text-gray-700">Age</label>
                      <input type="number" name="age" required min="16" max="99" value={formData.age} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div><label className="block text-sm font-semibold mb-1 text-gray-700">Occupation</label>
                      <select name="occupation" value={formData.occupation} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white">
                        <option value="Undergrad">Undergraduate Student</option>
                        <option value="Grad">Graduate Student</option>
                        <option value="Professional">Working Professional</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div><label className="block text-sm font-semibold mb-1 text-gray-700">About Me</label>
                    <textarea name="about_me" rows="3" placeholder="A short bio about yourself..." value={formData.about_me} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500" />
                  </div>

                  <div className="bg-brand-50 p-5 rounded-xl border border-brand-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-sm font-semibold mb-1 text-brand-900">Country Code</label>
                      <input type="text" name="target_country" required placeholder="us" value={formData.target_country} onChange={handleChange} className="w-full px-4 py-2 border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div><label className="block text-sm font-semibold mb-1 text-brand-900">ZIP Code</label>
                      <input type="text" name="zip_code" required value={formData.zip_code} onChange={handleChange} className="w-full px-4 py-2 border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div><label className="block text-sm font-semibold mb-1 text-brand-900">Search Radius</label>
                      <input type="number" name="search_radius_miles" required min="1" max="100" value={formData.search_radius_miles} onChange={handleChange} className="w-full px-4 py-2 border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-500" />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: My Lifestyle */}
              {activeTab === 'lifestyle' && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-lg font-bold text-gray-900 border-b pb-2">My Lifestyle Habits</h3>
                  
                  {numericTraits.map(trait => (
                    <div key={trait.key} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <label className="block font-semibold text-gray-800 mb-3">{trait.label}</label>
                      <input type="range" name={`my_${trait.key}`} min="1" max="5" value={formData[`my_${trait.key}`]} onChange={handleChange} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-brand-600" />
                      <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
                        <span>1 - {trait.minLabel}</span>
                        <span>3 - Average</span>
                        <span>5 - {trait.maxLabel}</span>
                      </div>
                    </div>
                  ))}

                  <div className="flex space-x-8 pt-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input type="checkbox" name="is_smoker" checked={formData.is_smoker} onChange={handleChange} className="w-5 h-5 text-brand-600 rounded border-gray-300 focus:ring-brand-500" />
                      <span className="font-semibold text-gray-800">I am a smoker</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input type="checkbox" name="has_pets" checked={formData.has_pets} onChange={handleChange} className="w-5 h-5 text-brand-600 rounded border-gray-300 focus:ring-brand-500" />
                      <span className="font-semibold text-gray-800">I have pets</span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 3: Preferences */}
              {activeTab === 'preferences' && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Roommate Dealbreakers</h3>
                  
                  {numericTraits.map(trait => (
                    <div key={`pref_${trait.key}`} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center gap-6">
                      <div className="flex-1">
                        <label className="block font-semibold text-gray-800 mb-3">Preferred {trait.label}</label>
                        <input type="range" name={`pref_${trait.key}`} min="1" max="5" value={formData[`pref_${trait.key}`]} onChange={handleChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600" />
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>{trait.minLabel}</span><span>{trait.maxLabel}</span>
                        </div>
                      </div>
                      <div className="md:w-40 bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-center">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input type="checkbox" name={`${trait.key}_is_strict`} checked={formData[`${trait.key}_is_strict`]} onChange={handleChange} className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500" />
                          <span className="text-sm font-bold text-gray-700">Dealbreaker</span>
                        </label>
                      </div>
                    </div>
                  ))}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                       <label className="flex items-center space-x-3">
                        <input type="checkbox" name="pref_smoker" checked={formData.pref_smoker} onChange={handleChange} className="w-5 h-5 text-brand-600 rounded border-gray-300 focus:ring-brand-500" />
                        <span className="font-semibold text-gray-800">Allows Smoker</span>
                      </label>
                      <label className="flex items-center space-x-2">
                          <input type="checkbox" name="smoker_is_strict" checked={formData.smoker_is_strict} onChange={handleChange} className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500" />
                          <span className="text-sm font-bold text-gray-700">Strict</span>
                      </label>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                       <label className="flex items-center space-x-3">
                        <input type="checkbox" name="pref_pets" checked={formData.pref_pets} onChange={handleChange} className="w-5 h-5 text-brand-600 rounded border-gray-300 focus:ring-brand-500" />
                        <span className="font-semibold text-gray-800">Allows Pets</span>
                      </label>
                      <label className="flex items-center space-x-2">
                          <input type="checkbox" name="pets_is_strict" checked={formData.pets_is_strict} onChange={handleChange} className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500" />
                          <span className="text-sm font-bold text-gray-700">Strict</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
                <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-8 py-2 bg-brand-600 text-white rounded-lg font-bold shadow-md hover:bg-brand-500 transition-colors disabled:opacity-70">
                  {saving ? 'Saving...' : 'Save Profile Settings'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}