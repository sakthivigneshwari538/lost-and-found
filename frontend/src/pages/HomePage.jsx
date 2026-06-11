import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const CATEGORY_LABELS = {
  id_card: 'ID Card', phone: 'Phone', bag: 'Bag', books: 'Books',
  keys: 'Keys', wallet: 'Wallet', electronics: 'Electronics', others: 'Others',
};

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const [lostRes, foundRes] = await Promise.all([
        api.get('/items', { params: { type: 'lost', limit: 4 } }),
        api.get('/items', { params: { type: 'found', limit: 4 } }),
      ]);
      setLostItems(lostRes.data.items);
      setFoundItems(foundRes.data.items);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) {
      window.location.href = `/items?search=${encodeURIComponent(search.trim())}`;
    }
  }


  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <input
            type="text"
            className="input-field text-base py-3"
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </form>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" style={{ borderTopColor: '#6366f1', borderColor: '#e2e8f0', width: '2.5rem', height: '2.5rem' }} />
          </div>
        ) : (
          <>



            {/* Recently Lost */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Recently Lost</h2>
                <div className="flex items-center gap-3">
                  {lostItems.length > 3 && <Link to="/items?type=lost" className="text-sm font-medium text-indigo-600">View all</Link>}
                  {isAuthenticated && <Link to="/post-item" className="px-3 py-2.5 rounded-lg text-xs font-medium bg-indigo-600 text-white">+ Post Item</Link>}
                </div>
              </div>
              {lostItems.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center bg-gray-50 rounded-xl">No lost items reported yet</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lostItems.slice(0, 3).map(item => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>


            {/* Recently Found */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Recently Found</h2>
                {foundItems.length > 3 && <Link to="/items?type=found" className="text-sm font-medium text-indigo-600">View all</Link>}
              </div>
              {foundItems.length === 0 ? (
                <p className="text-gray-400 text-sm py-8 text-center bg-gray-50 rounded-xl">No found items reported yet</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {foundItems.slice(0, 3).map(item => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function ItemCard({ item }) {
  const primaryImage = item.images?.find(img => img.is_primary) || item.images?.[0];

  return (
    <Link
      to={`/items/${item.id}`}
      className="block border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group" style={{ backgroundColor: '#FAF8F5' }}
    >
      {/* Image placeholder */}
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
}
