import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Inbox() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">💬</span>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Inbox coming next</h1>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Chat is intentionally unlocked only for connected users. The full inbox and messaging
            experience will be implemented in the next phase.
          </p>

          <Link
            to="/matches"
            className="inline-flex items-center px-5 py-2.5 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-500 transition-colors"
          >
            Back to Matches
          </Link>
        </div>
      </main>
    </div>
  );
}