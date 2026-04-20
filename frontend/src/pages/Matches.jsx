import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Navbar from '../components/Navbar';

function UserRow({ user, actions }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold border border-brand-200 shrink-0">
            {(user.first_name || user.username || 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">
              {user.first_name}
              {user.age ? `, ${user.age}` : ''}
            </h3>
            <p className="text-sm text-gray-500">
              {user.occupation || 'Not specified'}
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-700 mt-3">
          {user.about_me || "This user hasn't added a bio yet."}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to={`/users/${user.user_id}`}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 text-gray-800 font-medium hover:bg-gray-200 transition-colors"
        >
          View Profile
        </Link>
        {actions}
      </div>
    </div>
  );
}

export default function Matches() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    connected: [],
    incoming_requests: [],
    outgoing_requests: [],
  });
  const [error, setError] = useState('');

  const loadConnections = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.getConnections();
      setData({
        connected: response.connected || [],
        incoming_requests: response.incoming_requests || [],
        outgoing_requests: response.outgoing_requests || [],
      });
    } catch (err) {
      setError(err.message || 'Failed to load matches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  const handleAccept = async (userId) => {
    try {
      await api.acceptConnectionRequest(userId);
      await loadConnections();
    } catch (err) {
      setError(err.message || 'Failed to accept request.');
    }
  };

  const handleDecline = async (userId) => {
    try {
      await api.declineConnectionRequest(userId);
      await loadConnections();
    } catch (err) {
      setError(err.message || 'Failed to decline request.');
    }
  };

  const handleRemove = async (userId) => {
    try {
      await api.removeConnection(userId);
      await loadConnections();
    } catch (err) {
      setError(err.message || 'Failed to update connection.');
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

  const noData =
    data.connected.length === 0 &&
    data.incoming_requests.length === 0 &&
    data.outgoing_requests.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Matches & Requests</h1>
          <p className="mt-2 text-gray-600">
            Manage your pending requests and connected users.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-red-700 font-medium">
            {error}
          </div>
        )}

        {noData ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🤝</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No matches or requests yet</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Start connecting with people from your dashboard and they will appear here.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-500 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Connected Users</h2>
                <span className="text-sm font-semibold px-3 py-1 rounded-full bg-green-100 text-green-800">
                  {data.connected.length}
                </span>
              </div>

              {data.connected.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-gray-500">
                  No connected users yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.connected.map((user) => (
                    <UserRow
                      key={`connected-${user.user_id}`}
                      user={user}
                      actions={
                        <>
                          <Link
                            to="/inbox"
                            className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-500 transition-colors"
                          >
                            Chat
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleRemove(user.user_id)}
                            className="inline-flex items-center px-4 py-2 rounded-lg border border-red-300 bg-white text-red-600 font-medium hover:bg-red-50 transition-colors"
                          >
                            Remove
                          </button>
                        </>
                      }
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Incoming Requests</h2>
                <span className="text-sm font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-800">
                  {data.incoming_requests.length}
                </span>
              </div>

              {data.incoming_requests.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-gray-500">
                  No incoming requests.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.incoming_requests.map((user) => (
                    <UserRow
                      key={`incoming-${user.user_id}`}
                      user={user}
                      actions={
                        <>
                          <button
                            type="button"
                            onClick={() => handleAccept(user.user_id)}
                            className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-500 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecline(user.user_id)}
                            className="inline-flex items-center px-4 py-2 rounded-lg border border-red-300 bg-white text-red-600 font-medium hover:bg-red-50 transition-colors"
                          >
                            Decline
                          </button>
                        </>
                      }
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Outgoing Requests</h2>
                <span className="text-sm font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                  {data.outgoing_requests.length}
                </span>
              </div>

              {data.outgoing_requests.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-gray-500">
                  No outgoing requests.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.outgoing_requests.map((user) => (
                    <UserRow
                      key={`outgoing-${user.user_id}`}
                      user={user}
                      actions={
                        <button
                          type="button"
                          onClick={() => handleRemove(user.user_id)}
                          className="inline-flex items-center px-4 py-2 rounded-lg border border-amber-300 bg-white text-amber-700 font-medium hover:bg-amber-50 transition-colors"
                        >
                          Withdraw
                        </button>
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}