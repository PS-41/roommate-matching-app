import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import Navbar from '../components/Navbar';

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Inbox() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threads, setThreads] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [sendError, setSendError] = useState('');

  const messagesEndRef = useRef(null);

  const selectedUserId = useMemo(() => {
    if (userId) return Number(userId);
    if (selectedUser?.user_id) return Number(selectedUser.user_id);
    return null;
  }, [userId, selectedUser]);

  const loadThreads = async () => {
    const res = await api.getThreads();
    const threadList = res.threads || [];
    setThreads(threadList);
    return threadList;
  };

  const loadThreadMessages = async (targetUserId) => {
    if (!targetUserId) {
      setSelectedUser(null);
      setMessages([]);
      return;
    }

    setThreadLoading(true);
    setSendError('');

    try {
      const res = await api.getThread(targetUserId);
      setSelectedUser(res.user || null);
      setMessages(res.messages || []);
    } catch (err) {
      setError(err.message || 'Failed to load conversation.');
    } finally {
      setThreadLoading(false);
    }
  };

  useEffect(() => {
    const fetchInbox = async () => {
      setLoading(true);
      setError('');

      try {
        const threadList = await loadThreads();

        if (userId) {
          await loadThreadMessages(Number(userId));
        } else if (threadList.length > 0) {
          const firstUserId = threadList[0].user.user_id;
          navigate(`/inbox/${firstUserId}`, { replace: true });
          await loadThreadMessages(firstUserId);
        }
      } catch (err) {
        setError(err.message || 'Failed to load inbox.');
      } finally {
        setLoading(false);
      }
    };

    fetchInbox();
  }, [userId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSelectThread = async (targetUserId) => {
    navigate(`/inbox/${targetUserId}`);
    await loadThreadMessages(targetUserId);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !draft.trim()) return;

    setSendError('');

    try {
      const res = await api.sendMessage(selectedUserId, draft.trim());
      setMessages((prev) => [...prev, res.sent_message]);
      setDraft('');
      await loadThreads();
    } catch (err) {
      setSendError(err.message || 'Failed to send message.');
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

  const noThreads = threads.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-red-700 font-medium">
            {error}
          </div>
        )}

        {noThreads ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">💬</span>
            </div>

            <h1 className="text-2xl font-extrabold text-gray-900 mb-3">No conversations yet</h1>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Once you connect with users, you can start chatting here.
            </p>

            <Link
              to="/matches"
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-500 transition-colors"
            >
              Go to Matches
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden grid grid-cols-1 lg:grid-cols-[320px_1fr] min-h-[70vh]">
            <aside className="border-r border-gray-200 bg-gray-50">
              <div className="px-5 py-4 border-b border-gray-200 bg-white">
                <h1 className="text-xl font-extrabold text-gray-900">Inbox</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Connected users and recent conversations
                </p>
              </div>

              <div className="overflow-y-auto">
                {threads.map((thread) => {
                  const isActive = Number(thread.user.user_id) === Number(selectedUserId);

                  return (
                    <button
                      key={thread.user.user_id}
                      type="button"
                      onClick={() => handleSelectThread(thread.user.user_id)}
                      className={`w-full text-left px-5 py-4 border-b border-gray-100 transition-colors ${
                        isActive ? 'bg-brand-50' : 'bg-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate">
                            {thread.user.first_name}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {thread.user.occupation || 'Not specified'}
                          </div>
                        </div>

                        {thread.unread_count > 0 && (
                          <span className="text-xs font-bold px-2 py-1 rounded-full bg-brand-600 text-white">
                            {thread.unread_count}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 text-sm text-gray-600 truncate">
                        {thread.latest_message?.content || 'No messages yet'}
                      </div>

                      {thread.latest_message?.timestamp && (
                        <div className="mt-1 text-xs text-gray-400">
                          {formatTime(thread.latest_message.timestamp)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="flex flex-col min-h-[70vh]">
              {selectedUser ? (
                <>
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{selectedUser.first_name}</h2>
                      <p className="text-sm text-gray-500">
                        {selectedUser.occupation || 'Not specified'}
                      </p>
                    </div>

                    <Link
                      to={`/users/${selectedUser.user_id}`}
                      className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 text-gray-800 font-medium hover:bg-gray-200 transition-colors"
                    >
                      View Profile
                    </Link>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-5 bg-gray-50">
                    {threadLoading ? (
                      <div className="h-full flex justify-center items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center">
                        <div>
                          <div className="text-4xl mb-3">👋</div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">Start the conversation</h3>
                          <p className="text-gray-500">
                            You’re connected now — send your first message.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg) => {
                          const mine = Number(msg.sender_id) !== Number(selectedUser.user_id);

                          return (
                            <div
                              key={msg.id}
                              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                                  mine
                                    ? 'bg-brand-600 text-white rounded-br-md'
                                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                <div
                                  className={`mt-2 text-xs ${
                                    mine ? 'text-brand-100' : 'text-gray-400'
                                  }`}
                                >
                                  {formatTime(msg.timestamp)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSend} className="border-t border-gray-200 bg-white p-4">
                    {sendError && (
                      <div className="mb-3 text-sm text-red-600 font-medium">
                        {sendError}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <textarea
                        rows="2"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Write a message..."
                        className="flex-1 resize-none px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!draft.trim()}
                        className="self-end px-5 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <div className="text-4xl mb-3">💬</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Choose a conversation</h3>
                    <p className="text-gray-500">
                      Select a connected user from the left to start chatting.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}