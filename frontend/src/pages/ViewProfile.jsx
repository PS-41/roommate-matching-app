import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import Navbar from '../components/Navbar';

const scaleMeta = {
  cleanliness: { label: 'Cleanliness', min: 'Messy', max: 'Neat Freak' },
  sleep_schedule: { label: 'Sleep Schedule', min: 'Early Bird', max: 'Night Owl' },
  noise_tolerance: { label: 'Noise Tolerance', min: 'Needs Silence', max: 'Loud' },
  guests_frequency: { label: 'Guests', min: 'Never', max: 'Frequent Host' },
  smoking: { label: 'Smoking', min: 'Never', max: 'Frequent' },
  drinking: { label: 'Drinking', min: 'Never', max: 'Frequent' },
};

function getScaleLabel(key, value) {
  const meta = scaleMeta[key];
  if (!meta || value == null) return 'Not specified';
  if (value <= 1) return `1 - ${meta.min}`;
  if (value >= 5) return `5 - ${meta.max}`;
  if (value === 3) return '3 - Average';
  return `${value} / 5`;
}

function countryLabel(code) {
  const normalized = (code || '').toLowerCase();
  if (normalized === 'us') return 'United States';
  if (normalized === 'ca') return 'Canada';
  if (normalized === 'uk') return 'United Kingdom';
  if (normalized === 'au') return 'Australia';
  return code || 'Not specified';
}

function ageRangeLabel(min, max) {
  if (min && max) return `${min} - ${max}`;
  if (min) return `${min}+`;
  if (max) return `Up to ${max}`;
  return 'Any';
}

function budgetLabel(min, max) {
  if (min && max) return `$${min} - $${max}`;
  if (min) return `From $${min}`;
  if (max) return `Up to $${max}`;
  return 'Not specified';
}

function PreferenceRow({ title, value, strict, dontCare }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600 mt-1">{value}</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          {dontCare && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100">
              Do Not Care
            </span>
          )}
          {strict && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-100">
              Dealbreaker
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ViewProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isOwnProfile = useMemo(() => {
    if (!profile || !currentUser) return false;
    return profile.is_self || Number(profile.id) === Number(currentUser.id);
  }, [profile, currentUser]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const me = await api.getCurrentUser();
        setCurrentUser(me);

        const targetUserId = userId ? Number(userId) : Number(me.id);
        const data = await api.getPublicProfile(targetUserId);
        setProfile(data);
      } catch (err) {
        setError(err.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

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

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-red-700 font-medium mb-6">
            {error || 'Unable to load profile.'}
          </div>

          <Link
            to="/dashboard"
            className="inline-flex items-center px-5 py-2.5 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-500 transition-colors"
          >
            Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  const avatarText = profile.first_name
    ? profile.first_name[0].toUpperCase()
    : profile.username
      ? profile.username[0].toUpperCase()
      : 'U';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-brand-50 to-white px-6 sm:px-8 py-8 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center text-3xl font-extrabold border border-brand-200 shrink-0">
                  {avatarText}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-extrabold text-gray-900">
                      {profile.display_name}
                    </h1>

                    {isOwnProfile && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-100 text-brand-700 border border-brand-200">
                        Your Profile
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
                    <span className="bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                      {profile.age ? `${profile.age} years old` : 'Age not specified'}
                    </span>
                    <span className="bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                      {profile.gender || 'Prefer not to say'}
                    </span>
                    <span className="bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                      {profile.occupation || 'Not specified'}
                    </span>
                  </div>

                  <p className="mt-4 text-gray-700 max-w-2xl">
                    {profile.about_me || 'This user has not added a bio yet.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {isOwnProfile ? (
                  <Link
                    to="/profile"
                    className="inline-flex items-center px-5 py-2.5 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-500 transition-colors"
                  >
                    Edit Profile
                  </Link>
                ) : null}

                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>

          {!isOwnProfile && (
            <div className="px-6 sm:px-8 py-4 bg-amber-50 border-t border-amber-100 text-sm text-amber-800">
              Connect, chat, and connected-user actions will be added in the next phase.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Location & Search Area</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="text-gray-500 font-medium mb-1">Country</div>
                  <div className="text-gray-900 font-semibold">
                    {countryLabel(profile.target_country)}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="text-gray-500 font-medium mb-1">ZIP / Postal</div>
                  <div className="text-gray-900 font-semibold">
                    {profile.zip_code_display || 'Not shared'}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:col-span-2">
                  <div className="text-gray-500 font-medium mb-1">Search Radius</div>
                  <div className="text-gray-900 font-semibold">
                    {profile.search_radius_miles} miles
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Lifestyle</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="text-gray-500 font-medium mb-1">Cleanliness</div>
                  <div className="text-gray-900 font-semibold">
                    {getScaleLabel('cleanliness', profile.my_cleanliness)}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="text-gray-500 font-medium mb-1">Sleep Schedule</div>
                  <div className="text-gray-900 font-semibold">
                    {getScaleLabel('sleep_schedule', profile.my_sleep_schedule)}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="text-gray-500 font-medium mb-1">Noise Tolerance</div>
                  <div className="text-gray-900 font-semibold">
                    {getScaleLabel('noise_tolerance', profile.my_noise_tolerance)}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="text-gray-500 font-medium mb-1">Guests</div>
                  <div className="text-gray-900 font-semibold">
                    {getScaleLabel('guests_frequency', profile.my_guests_frequency)}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="text-gray-500 font-medium mb-1">Smoking</div>
                  <div className="text-gray-900 font-semibold">
                    {getScaleLabel('smoking', profile.my_smoking)}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="text-gray-500 font-medium mb-1">Drinking</div>
                  <div className="text-gray-900 font-semibold">
                    {getScaleLabel('drinking', profile.my_drinking)}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:col-span-2">
                  <div className="text-gray-500 font-medium mb-1">Pets</div>
                  <div className="text-gray-900 font-semibold">
                    {profile.has_pets ? 'Has pets' : 'No pets'}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Roommate Preferences</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="text-gray-500 font-medium mb-1">Preferred Gender</div>
                  <div className="text-gray-900 font-semibold">
                    {profile.preferred_gender || 'Any'}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="text-gray-500 font-medium mb-1">Preferred Age Range</div>
                  <div className="text-gray-900 font-semibold">
                    {ageRangeLabel(profile.preferred_age_min, profile.preferred_age_max)}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:col-span-2">
                  <div className="text-gray-500 font-medium mb-1">Budget Preference</div>
                  <div className="text-gray-900 font-semibold">
                    {budgetLabel(profile.budget_min, profile.budget_max)}
                  </div>
                  {profile.budget_is_strict && (
                    <div className="mt-2 inline-flex text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-100">
                      Strict Dealbreaker
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <PreferenceRow
                  title="Preferred Cleanliness"
                  value={getScaleLabel('cleanliness', profile.pref_cleanliness)}
                  strict={profile.cleanliness_is_strict}
                  dontCare={profile.cleanliness_do_not_care}
                />
                <PreferenceRow
                  title="Preferred Sleep Schedule"
                  value={getScaleLabel('sleep_schedule', profile.pref_sleep_schedule)}
                  strict={profile.sleep_schedule_is_strict}
                  dontCare={profile.sleep_schedule_do_not_care}
                />
                <PreferenceRow
                  title="Preferred Noise Tolerance"
                  value={getScaleLabel('noise_tolerance', profile.pref_noise_tolerance)}
                  strict={profile.noise_tolerance_is_strict}
                  dontCare={profile.noise_tolerance_do_not_care}
                />
                <PreferenceRow
                  title="Preferred Guest Frequency"
                  value={getScaleLabel('guests_frequency', profile.pref_guests_frequency)}
                  strict={profile.guests_frequency_is_strict}
                  dontCare={profile.guests_frequency_do_not_care}
                />
                <PreferenceRow
                  title="Preferred Smoking"
                  value={getScaleLabel('smoking', profile.pref_smoking)}
                  strict={profile.smoking_is_strict}
                  dontCare={profile.smoking_do_not_care}
                />
                <PreferenceRow
                  title="Preferred Drinking"
                  value={getScaleLabel('drinking', profile.pref_drinking)}
                  strict={profile.drinking_is_strict}
                  dontCare={profile.drinking_do_not_care}
                />
                <PreferenceRow
                  title="Pet Preference"
                  value={profile.pref_no_pets ? 'Prefers no pets' : 'Pets are okay'}
                  strict={profile.pets_is_strict}
                  dontCare={false}
                />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}