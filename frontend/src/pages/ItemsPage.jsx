import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'id_card', label: 'ID Card' },
  { value: 'phone', label: 'Phone' },
  { value: 'bag', label: 'Bag' },
  { value: 'books', label: 'Books' },
  { value: 'keys', label: 'Keys' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'others', label: 'Others' },
];

const CATEGORY_LABELS = {
  id_card: 'ID Card', phone: 'Phone', bag: 'Bag', books: 'Books',
  keys: 'Keys', wallet: 'Wallet', electronics: 'Electronics', others: 'Others',
};

export default function ItemsPage() {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const type = searchParams.get('type') || '';
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const userId = searchParams.get('user_id') || '';

  useEffect(() => {
    fetchItems();
  }, [type, category, search, page, userId]);

  async function fetchItems() {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (type) params.type = type;
      if (category) params.category = category;
      if (search) params.search = search;
      if (userId) params.user_id = userId;

      const res = await api.get('/items', { params });
      setItems(res.data.items);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setLoading(false);
    }
  }

  function updateFilter(key, value) {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    setSearchParams(params);
  }

  function setPage(p) {
    const params = new URLSearchParams(searchParams);
    params.set('page', p.toString());
    setSearchParams(params);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              {userId ? 'My Posts' : type === 'lost' ? 'Lost Items' : type === 'found' ? 'Found Items' : 'All Items'}
            </h1>
            {isAuthenticated && <Link to="/post-item" className="px-3 py-2.5 rounded-lg text-xs font-medium bg-indigo-600 text-white">+ Post Item</Link>}
          </div>

          {/* Filters */}
          <div className="mb-6 space-y-4">
            {/* Search */}
            <input
              type="text"
              className="input-field text-base py-3 w-full"
              placeholder="Search items..."
              defaultValue={search}
              onKeyDown={e => {
                if (e.key === 'Enter') updateFilter('search', e.target.value);
              }}
              onBlur={e => updateFilter('search', e.target.value)}
            />

            {/* Type toggle + Category */}
            <div className="flex items-center justify-between">
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                {[
                  { value: '', label: 'All' },
                  { value: 'lost', label: 'Lost' },
                  { value: 'found', label: 'Found' },
                ].map(t => (
                  <button
                    key={t.value}
                    onClick={() => updateFilter('type', t.value)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${type === t.value
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <select
                className="border border-gray-200 rounded-lg text-sm py-1.5 px-3 bg-white text-gray-700 outline-none"
                value={category}
                onChange={e => updateFilter('category', e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Items Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="spinner" style={{ borderTopColor: '#6366f1', borderColor: '#e2e8f0', width: '2.5rem', height: '2.5rem' }} />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No items found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => {
                const primaryImage = item.images?.find(img => img.is_primary) || item.images?.[0];
                return (
                  <Link
                    key={item.id}
                    to={`/items/${item.id}`}
                    className="block border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group" style={{ backgroundColor: '#FAF8F5' }}
                  >
                    {/* Image */}
                    <div className="h-40 bg-gray-100 flex items-center justify-center">
                      {primaryImage ? (
                        <img src={primaryImage.image_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-300 text-sm font-medium">No image</span>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.type === 'lost'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-green-50 text-green-600'
                          }`}>
                          {item.type === 'lost' ? 'Lost' : 'Found'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(item.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors text-sm mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{item.location}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${p === page
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                      }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= pages}
                className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
