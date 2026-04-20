import React from 'react';
import { Link } from 'react-router-dom';

const MatchCard = ({ match }) => {
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
        <div className="flex justify-between items-start mb-2">
          <Link to={`/users/${match.user_id}`} className="hover:text-brand-600 transition-colors">
            <h3 className="text-xl font-bold text-gray-900">
              {match.first_name}, {match.age || 'Age N/A'}
            </h3>
          </Link>

          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {match.compatibility_score}% Match
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          {match.distance_miles} miles away • {match.occupation || 'Student'}
        </p>

        <p className="text-gray-700 text-sm line-clamp-3 mb-4 flex-grow">
          {match.about_me || "This user hasn't written a bio yet."}
        </p>

        <div className="mt-auto">
          <Link
            to={`/users/${match.user_id}`}
            className="block w-full text-center bg-brand-600 hover:bg-brand-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;