import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

const statusLabelMap = {
  none: 'Connect',
  pending_outgoing: 'Request Sent',
  pending_incoming: 'Respond in Matches',
  connected: 'Chat',
};

const MatchCard = ({ match }) => {
  const [status, setStatus] = useState(match.connection_status || 'none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePrimaryAction = async () => {
    setError('');

    try {
      if (status === 'none') {
        setLoading(true);
        await api.sendConnectionRequest(match.user_id);
        setStatus('pending_outgoing');
      }
    } catch (err) {
      setError(err.message || 'Action failed.');
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || status === 'pending_outgoing' || status === 'pending_incoming';

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 flex flex-col h-full hover:shadow-lg transition-shadow">
      <Link to={`/users/${match.user_id}`} className="block">
        <div className="h-48 bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
          <span className="text-4xl font-bold text-indigo-300">
            {match.first_name ? match.first_name[0].toUpperCase() : '?'}
          </span>
        </div>
      </Link>

      <div className="p-5 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2 gap-3">
          <Link to={`/users/${match.user_id}`} className="hover:text-brand-600 transition-colors">
            <h3 className="text-xl font-bold text-gray-900">
              {match.first_name}, {match.age || 'Age N/A'}
            </h3>
          </Link>

          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap">
            {match.compatibility_score}% Match
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          {match.distance_miles} miles away • {match.occupation || 'Student'}
        </p>

        <p className="text-gray-700 text-sm line-clamp-3 mb-4 flex-grow">
          {match.about_me || "This user hasn't written a bio yet."}
        </p>

        {error && (
          <div className="mb-3 text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        <div className="mt-auto flex gap-3">
          <Link
            to={`/users/${match.user_id}`}
            className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            View Profile
          </Link>

          {status === 'connected' ? (
            <Link
              to={`/inbox/${match.user_id}`}
              className="flex-1 text-center bg-brand-600 hover:bg-brand-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              Chat
            </Link>
          ) : (
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={isDisabled}
              className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : statusLabelMap[status] || 'Connect'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchCard;