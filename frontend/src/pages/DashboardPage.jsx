import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

export default function DashboardPage() {
  const { user, logout, refreshUser } = useAuth();
  const [myItems, setMyItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [toast, setToast] = useState(null);

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMyItems();
  }, []);

  async function fetchMyItems() {
    try {
      const res = await api.get('/items/my-items');
      setMyItems(res.data);
    } catch {
      // ignore
    } finally {
      setLoadingItems(false);
    }
  }

  function startEditing() {
    setEditName(user?.full_name || '');
    setEditing(true);
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!editName.trim() || editName.trim().length < 2) {
      setToast({ message: 'Name must be at least 2 characters', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await api.put('/auth/me', { full_name: editName.trim() });
      if (refreshUser) await refreshUser();
      setEditing(false);
      setToast({ message: 'Profile updated', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.detail || 'Failed to update', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="animate-fade-in-up">

          {/* Profile Header */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-white">{user?.full_name?.charAt(0).toUpperCase() || 'U'}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{user?.full_name}</h1>
            <p className="text-gray-500 text-sm mt-1">
              <span className="capitalize">{user?.role}</span>
              {' '}&bull;{' '}
              <span className="text-green-600 font-medium">Verified</span>
            </p>
          </div>

          {/* Profile Information */}
          <div className="border border-gray-200 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-5">Profile Information</h2>

            {editing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Email</span>
                  <span className="text-sm font-medium text-gray-800">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Role</span>
                  <span className="text-sm font-medium text-gray-800 capitalize">{user?.role}</span>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white" disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="text-sm text-gray-500">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Name</span>
                  <span className="text-sm font-medium text-gray-800">{user?.full_name}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Email</span>
                  <span className="text-sm font-medium text-gray-800">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Role</span>
                  <span className="text-sm font-medium text-gray-800 capitalize">{user?.role}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                    Verified
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-500">Member Since</span>
                  <span className="text-sm font-medium text-gray-800">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '...'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* My Posts */}
          <div className="border border-gray-200 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-5">My Posts</h2>

            {loadingItems ? (
              <div className="flex justify-center py-8">
                <div className="spinner" style={{ borderTopColor: '#6366f1', borderColor: '#e2e8f0', width: '2rem', height: '2rem' }} />
              </div>
            ) : myItems.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">You haven't posted any items yet</p>
                <Link to="/post-item" className="text-sm text-indigo-600 font-medium mt-2 inline-block">Post your first item</Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myItems.slice(0, 4).map(item => (
                    <Link
                      key={item.id}
                      to={`/items/${item.id}`}
                      className="block border border-gray-200 rounded-xl p-4 hover:border-indigo-200 transition-colors group" style={{ backgroundColor: '#FAF8F5' }}
                    >
                      <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3 ${
                        item.type === 'lost' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {item.type === 'lost' ? 'Lost' : 'Found'}
                      </span>
                      <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors mb-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 mb-1">{item.location}</p>
                      <p className="text-xs text-gray-400 mb-3">
                        {new Date(item.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <span className="text-xs font-medium text-indigo-600 group-hover:text-indigo-700">
                        View &rarr;
                      </span>
                    </Link>
                  ))}
                </div>
                {myItems.length > 4 && (
                  <div className="text-center mt-4">
                    <Link to={`/items?user_id=${user?.id}`} className="text-sm font-medium text-indigo-600">See all posts ({myItems.length})</Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Account Settings */}
          <div className="border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-5">Account Settings</h2>
            <div className="space-y-3">
              <button
                onClick={startEditing}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Profile
              </button>
              <button
                onClick={() => { logout(); window.location.href = '/login'; }}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
