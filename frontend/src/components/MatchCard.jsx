import React from 'react';

const MatchCard = ({ match }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 flex flex-col h-full hover:shadow-lg transition-shadow">
      {/* Placeholder for Profile Photo (We will build image uploads later) */}
      <div className="h-48 bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
        <span className="text-4xl font-bold text-indigo-300">
          {match.first_name ? match.first_name[0].toUpperCase() : '?'}
        </span>
      </div>

      <div className="p-5 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900">
            {match.first_name}, {match.age || 'Age N/A'}
          </h3>
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

        <div className="mt-auto flex gap-2">
          {/* We will wire up these buttons in the next step! */}
          <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Connect
          </button>
          <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors">
            Pass
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;