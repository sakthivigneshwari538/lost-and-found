import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

const CATEGORY_LABELS = {
  id_card: 'ID Card', phone: 'Phone', bag: 'Bag', books: 'Books',
  keys: 'Keys', wallet: 'Wallet', electronics: 'Electronics', others: 'Others',
};

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  // Claim form state
  const [questions, setQuestions] = useState([]);
  const [claimMessage, setClaimMessage] = useState('');
  const [claimAnswers, setClaimAnswers] = useState({});
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);

  // Owner claims review state
  const [claims, setClaims] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);

  // Smart match state
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    fetchItem();
  }, [id]);

  async function fetchItem() {
    try {
      const res = await api.get(`/items/${id}`);
      setItem(res.data);
    } catch {
      setToast({ message: 'Item not found', type: 'error' });
      setTimeout(() => navigate('/items'), 1500);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this item?')) return;
    setDeleting(true);
    try {
      await api.delete(`/items/${id}`);
      setToast({ message: 'Item deleted', type: 'success' });
      setTimeout(() => navigate('/items'), 1000);
    } catch (err) {
      setToast({ message: err.response?.data?.detail || 'Failed to delete', type: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  // Fetch verification questions for claim form
  async function openClaimForm() {
    try {
      const res = await api.get(`/items/${id}/questions`);
      setQuestions(res.data);
      const initialAnswers = {};
      res.data.forEach(q => { initialAnswers[q.id] = ''; });
      setClaimAnswers(initialAnswers);
      setShowClaimForm(true);
    } catch {
      setToast({ message: 'Failed to load questions', type: 'error' });
    }
  }

  // Submit claim
  async function handleSubmitClaim(e) {
    e.preventDefault();
    setSubmittingClaim(true);
    try {
      const answers = Object.entries(claimAnswers)
        .filter(([, answer]) => answer.trim())
        .map(([question_id, answer]) => ({ question_id, answer }));

      await api.post(`/items/${id}/claims`, {
        message: claimMessage || null,
        answers,
      });
      setToast({ message: 'Claim submitted successfully', type: 'success' });
      setShowClaimForm(false);
      setAlreadyClaimed(true);
    } catch (err) {
      setToast({ message: err.response?.data?.detail || 'Failed to submit claim', type: 'error' });
    } finally {
      setSubmittingClaim(false);
    }
  }

  // Owner: fetch claims
  async function fetchClaims() {
    setLoadingClaims(true);
    try {
      const res = await api.get(`/items/${id}/claims`);
      setClaims(res.data);
    } catch {
      setToast({ message: 'Failed to load claims', type: 'error' });
    } finally {
      setLoadingClaims(false);
    }
  }

  // Owner: review claim
  async function handleReviewClaim(claimId, status) {
    setReviewingId(claimId);
    try {
      await api.put(`/items/${id}/claims/${claimId}`, { status });
      setToast({ message: `Claim ${status}`, type: 'success' });
      fetchClaims();
      fetchItem(); // Refresh item status
    } catch (err) {
      setToast({ message: err.response?.data?.detail || 'Failed to review claim', type: 'error' });
    } finally {
      setReviewingId(null);
    }
  }

  const isOwner = user && item && user.id === item.user.id;

  // Auto-fetch claims for owner
  useEffect(() => {
    if (isOwner && item) {
      fetchClaims();
    }
  }, [isOwner, item?.id]);

  // Auto-fetch matches
  useEffect(() => {
    if (item && item.status === 'open') {
      fetchMatches();
    }
  }, [item?.id]);

  async function fetchMatches() {
    try {
      const res = await api.get(`/items/${id}/matches`);
      setMatches(res.data);
    } catch {
      // Silent fail — matches are optional
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex justify-center py-32">
          <div className="spinner" style={{ borderTopColor: '#6366f1', borderColor: '#e2e8f0', width: '2.5rem', height: '2.5rem' }} />
        </div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="animate-fade-in-up">
          {/* Back link */}
          <Link to="/items" className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
            &larr; Back to items
          </Link>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Image gallery */}
            {item.images && item.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 bg-gray-100">
                {item.images.map((img, i) => (
                  <div key={img.id || i} className={`${i === 0 && item.images.length > 1 ? 'col-span-2 row-span-2' : ''} overflow-hidden`}>
                    <img src={img.image_url} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      item.type === 'lost' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {item.type === 'lost' ? 'Lost' : 'Found'}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      item.status === 'open' ? 'bg-blue-50 text-blue-600' :
                      item.status === 'claimed' ? 'bg-yellow-50 text-yellow-600' :
                      item.status === 'returned' ? 'bg-green-50 text-green-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800">{item.title}</h1>
                </div>

                {isOwner && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-sm text-red-500 hover:text-red-700 font-medium"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Category</p>
                  <p className="text-gray-800 font-medium">{CATEGORY_LABELS[item.category] || item.category}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Location</p>
                  <p className="text-gray-800 font-medium">{item.location}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                    {item.type === 'lost' ? 'Date Lost' : 'Date Found'}
                  </p>
                  <p className="text-gray-800 font-medium">
                    {new Date(item.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                {item.kept_at && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Kept At</p>
                    <p className="text-gray-800 font-medium">{item.kept_at}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {item.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{item.description}</p>
                </div>
              )}

              {/* Contact */}
              {item.contact_info && (
                <div className="mb-6 p-4 bg-indigo-50 rounded-xl">
                  <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-1">Contact</p>
                  <p className="text-indigo-800 font-medium">{item.contact_info}</p>
                </div>
              )}

              {/* Posted by */}
              <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    {item.user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.user.full_name}</p>
                    <p className="text-xs text-gray-500">
                      Posted {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Claim button for non-owners (found items only) */}
                {!isOwner && isAuthenticated && item.type === 'found' && item.status === 'open' && !alreadyClaimed && !showClaimForm && (
                  <button onClick={openClaimForm} className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white">
                    Claim This Item
                  </button>
                )}
                {alreadyClaimed && (
                  <span className="text-sm text-green-600 font-medium">Claim submitted</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Claim Form (non-owner) ────────────────────────── */}
          {showClaimForm && (
            <div className="border border-gray-200 rounded-xl p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Submit Your Claim</h2>
              <form onSubmit={handleSubmitClaim} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    className="input-field text-sm"
                    rows={3}
                    placeholder="Describe why you believe this item is yours..."
                    value={claimMessage}
                    onChange={e => setClaimMessage(e.target.value)}
                  />
                </div>

                {questions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Answer the verification questions</p>
                    {questions.map(q => (
                      <div key={q.id} className="mb-3">
                        <label className="block text-sm text-gray-600 mb-1">{q.question}</label>
                        <input
                          type="text"
                          className="input-field text-sm"
                          placeholder="Your answer..."
                          value={claimAnswers[q.id] || ''}
                          onChange={e => setClaimAnswers({ ...claimAnswers, [q.id]: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white" disabled={submittingClaim}>
                    {submittingClaim ? 'Submitting...' : 'Submit Claim'}
                  </button>
                  <button type="button" onClick={() => setShowClaimForm(false)} className="text-sm text-gray-500">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Claims Review (owner, found items only) ────────── */}
          {isOwner && item.type === 'found' && (
            <div className="border border-gray-200 rounded-xl p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Claims <span className="text-sm font-normal text-gray-400">({claims.length})</span>
              </h2>

              {loadingClaims ? (
                <div className="flex justify-center py-6">
                  <div className="spinner" style={{ borderTopColor: '#6366f1', borderColor: '#e2e8f0', width: '2rem', height: '2rem' }} />
                </div>
              ) : claims.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No claims yet</p>
              ) : (
                <div className="space-y-4">
                  {claims.map(claim => (
                    <div key={claim.id} className={`p-4 rounded-xl border ${
                      claim.status === 'approved' ? 'border-green-200 bg-green-50/50' :
                      claim.status === 'rejected' ? 'border-red-200 bg-red-50/50' :
                      'border-gray-200 bg-gray-50'
                    }`}>
                      {/* Claim header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                            {claim.claimant.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{claim.claimant.full_name}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(claim.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          claim.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          claim.status === 'approved' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {claim.status}
                        </span>
                      </div>

                      {/* Message */}
                      {claim.message && (
                        <p className="text-sm text-gray-600 mb-3">{claim.message}</p>
                      )}

                      {/* Answers */}
                      {claim.answers && claim.answers.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {claim.answers.map(ans => (
                            <div key={ans.id} className="text-sm">
                              <p className="text-gray-500">{ans.question?.question}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-medium text-gray-800">Answer: {ans.answer}</span>
                                {ans.question?.expected_answer && (
                                  <span className="text-xs text-gray-400">(Expected: {ans.question.expected_answer})</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Review buttons */}
                      {claim.status === 'pending' && (
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={() => handleReviewClaim(claim.id, 'approved')}
                            disabled={reviewingId === claim.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewClaim(claim.id, 'rejected')}
                            disabled={reviewingId === claim.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-200"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {/* Review note */}
                      {claim.review_note && (
                        <p className="text-xs text-gray-400 mt-2">Note: {claim.review_note}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Possible Matches ─────────────────────────────── */}
          {item.status === 'open' && matches.length > 0 && (
            <div className="border border-gray-200 rounded-xl p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Possible Matches</h2>
              <p className="text-xs text-gray-400 mb-4">
                {item.type === 'lost' ? 'Found items' : 'Lost items'} that may match this {item.type} item
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map(match => (
                  <Link
                    key={match.id}
                    to={`/items/${match.id}`}
                    className="block border border-gray-200 rounded-xl overflow-hidden hover:border-indigo-200 transition-colors group" style={{ backgroundColor: '#FAF8F5' }}
                  >
                    {match.images && match.images.length > 0 ? (
                      <div className="h-32 bg-gray-100">
                        <img src={match.images[0].image_url} alt={match.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-32 bg-gray-50 flex items-center justify-center">
                        <span className="text-gray-300 text-sm">No image</span>
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          match.type === 'lost' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {match.type === 'lost' ? 'Lost' : 'Found'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(match.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">{match.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{match.location}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
