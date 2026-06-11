import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

const CATEGORIES = [
  { value: 'id_card', label: 'ID Card' },
  { value: 'phone', label: 'Phone' },
  { value: 'bag', label: 'Bag' },
  { value: 'books', label: 'Books' },
  { value: 'keys', label: 'Keys' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'others', label: 'Others' },
];

export default function PostItemPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    type: 'lost',
    title: '',
    category: '',
    description: '',
    location: '',
    event_date: '',
    kept_at: '',
    contact_info: '',
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  function validate() {
    const errs = {};
    if (!form.title || form.title.length < 3) errs.title = 'Title must be at least 3 characters';
    if (!form.category) errs.category = 'Category is required';
    if (!form.location || form.location.length < 2) errs.location = 'Location is required';
    if (!form.event_date) errs.event_date = 'Date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleImageChange(e) {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      setToast({ message: 'Maximum 5 images allowed', type: 'error' });
      return;
    }
    setImages(prev => [...prev, ...files]);
    // Generate previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index) {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.description) payload.description = null;
      if (!payload.kept_at) payload.kept_at = null;
      if (!payload.contact_info) payload.contact_info = null;

      // Create item
      const res = await api.post('/items', payload);
      const itemId = res.data.id;

      // Upload images if any
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach(file => formData.append('files', file));
        await api.post(`/items/${itemId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // Add verification questions if any
      const validQuestions = questions.filter(q => q.question.trim());
      if (validQuestions.length > 0) {
        await api.post(`/items/${itemId}/questions`, validQuestions);
      }

      setToast({ message: 'Item posted successfully!', type: 'success' });
      setTimeout(() => navigate(`/items/${itemId}`), 1000);
    } catch (err) {
      setToast({ message: err.response?.data?.detail || 'Failed to post item', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="animate-fade-in-up">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Post an Item</h1>
          <p className="text-gray-500 mb-8">Report a lost or found item to help the campus community</p>

          <div className="border border-gray-200 rounded-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Type toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What happened?</label>
                <div className="flex gap-3">
                  {['lost', 'found'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                        form.type === t
                          ? t === 'lost'
                            ? 'bg-red-50 text-red-700 border-2 border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200'
                          : 'bg-gray-50 text-gray-500 border-2 border-transparent'
                      }`}
                    >
                      {t === 'lost' ? 'I Lost Something' : 'I Found Something'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="post-title">
                  Item Title
                </label>
                <input
                  id="post-title"
                  type="text"
                  className={`input-field ${errors.title ? 'border-red-400' : ''}`}
                  placeholder="e.g., Black wallet, Blue backpack..."
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="post-category">
                  Category
                </label>
                <select
                  id="post-category"
                  className={`input-field ${errors.category ? 'border-red-400' : ''}`}
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Photos <span className="text-gray-400 font-normal">(up to 5)</span>
                </label>
                <div className="flex flex-wrap gap-3 mb-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                      >
                        x
                      </button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors">
                      <span className="text-gray-400 text-2xl">+</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-400">Add photos to help identify the item</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="post-desc">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="post-desc"
                  className="input-field"
                  rows={3}
                  placeholder="Describe the item in detail..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Location + Date (side by side) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="post-location">
                    Location
                  </label>
                  <input
                    id="post-location"
                    type="text"
                    className={`input-field ${errors.location ? 'border-red-400' : ''}`}
                    placeholder="e.g., Near library"
                    value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                  />
                  {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="post-date">
                    {form.type === 'lost' ? 'Date Lost' : 'Date Found'}
                  </label>
                  <input
                    id="post-date"
                    type="date"
                    className={`input-field ${errors.event_date ? 'border-red-400' : ''}`}
                    value={form.event_date}
                    onChange={e => setForm({ ...form, event_date: e.target.value })}
                  />
                  {errors.event_date && <p className="text-red-500 text-xs mt-1">{errors.event_date}</p>}
                </div>
              </div>

              {/* Kept at (only for found items) */}
              {form.type === 'found' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="post-kept">
                    Where is it kept? <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="post-kept"
                    type="text"
                    className="input-field"
                    placeholder="e.g., Admin office, Security desk..."
                    value={form.kept_at}
                    onChange={e => setForm({ ...form, kept_at: e.target.value })}
                  />
                </div>
              )}

              {/* Verification Questions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Verification Questions <span className="text-gray-400 font-normal">(optional, up to 3)</span>
                  </label>
                  {questions.length < 3 && (
                    <button
                      type="button"
                      onClick={() => setQuestions([...questions, { question: '', expected_answer: '' }])}
                      className="text-xs font-medium text-indigo-600"
                    >
                      + Add Question
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-3">Ask questions only the real owner would know the answer to</p>
                {questions.map((q, i) => (
                  <div key={i} className="mb-3 p-4 bg-gray-50 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">Question {i + 1}</span>
                      <button
                        type="button"
                        onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))}
                        className="text-xs text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      className="input-field text-sm"
                      placeholder="e.g., What color is the case?"
                      value={q.question}
                      onChange={e => {
                        const updated = [...questions];
                        updated[i].question = e.target.value;
                        setQuestions(updated);
                      }}
                    />
                    <input
                      type="text"
                      className="input-field text-sm"
                      placeholder="Expected answer (only you can see this)"
                      value={q.expected_answer}
                      onChange={e => {
                        const updated = [...questions];
                        updated[i].expected_answer = e.target.value;
                        setQuestions(updated);
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Contact info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="post-contact">
                  Contact Info <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="post-contact"
                  type="text"
                  className="input-field"
                  placeholder="e.g., Phone number, WhatsApp..."
                  value={form.contact_info}
                  onChange={e => setForm({ ...form, contact_info: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                {loading ? <span className="spinner" /> : `Post ${form.type === 'lost' ? 'Lost' : 'Found'} Item`}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
