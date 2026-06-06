'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow } from 'date-fns';
import Navbar from '@/components/Navbar';
import { MapPin, MessageSquare, ThumbsUp, AlertTriangle, Share2 } from 'lucide-react';

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'General': 'bg-[#E8DDD4] text-[#3B2410] border-[#3B2410]/20',
    'Vet Recommendations': 'bg-[#E1E8D5] text-[#2C3B1E] border-[#2C3B1E]/20',
    'Groomers': 'bg-[#F5E6DA] text-[#6E4225] border-[#6E4225]/20',
    'Pet Sitters': 'bg-[#E6E2F0] text-[#3A2C5C] border-[#3A2C5C]/20',
    'Lost & Found': 'bg-[#F2D5D5] text-[#7A2222] border-[#7A2222]/20',
    'Diet & Nutrition': 'bg-[#FFF3CD] text-[#664D03] border-[#664D03]/20',
    'Parks & Activities': 'bg-[#E2EBEB] text-[#234A4A] border-[#234A4A]/20',
  };
  return colors[category] || 'bg-[#FAF6F4] text-[#3B2410] border-[#3B2410]/20';
};

const CATEGORIES = [
  'General',
  'Vet Recommendations',
  'Groomers',
  'Pet Sitters',
  'Lost & Found',
  'Diet & Nutrition',
  'Parks & Activities'
];

export default function CityBoardPage() {
  const [deviceCookie, setDeviceCookie] = useState<string>('');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchCategory, setSearchCategory] = useState('All');
  const [searchPostId, setSearchPostId] = useState('');
  const [showMyPosts, setShowMyPosts] = useState(false);

  // New Post Form
  const [newCity, setNewCity] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newContent, setNewContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState('');

  // Location Verification for New Post
  const [newCityVerified, setNewCityVerified] = useState(false);
  const [newCityOptions, setNewCityOptions] = useState<any[]>([]);
  const [isLocatingNewCity, setIsLocatingNewCity] = useState(false);
  
  // Location Verification for Search
  const [searchCityOptions, setSearchCityOptions] = useState<any[]>([]);
  const [isLocatingSearchCity, setIsLocatingSearchCity] = useState(false);

  useEffect(() => {
    let cookie = localStorage.getItem('lumo_city_board_cookie');
    if (!cookie) {
      cookie = uuidv4();
      localStorage.setItem('lumo_city_board_cookie', cookie);
    }
    setDeviceCookie(cookie);
  }, []);

  useEffect(() => {
    const fetchNewLocationOptions = async () => {
      const trimmedInput = newCity.trim();
      if (trimmedInput.length < 3 || newCityVerified) {
        setNewCityOptions([]);
        return;
      }
      setIsLocatingNewCity(true);
      try {
        const res = await fetch(`/api/city-board/autocomplete?input=${encodeURIComponent(trimmedInput)}`);
        const data = await res.json();
        if (data.options && data.options.length > 0) {
          setNewCityOptions(data.options);
        } else {
          setNewCityOptions([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLocatingNewCity(false);
      }
    };
    const debounceNew = setTimeout(fetchNewLocationOptions, 500);
    return () => clearTimeout(debounceNew);
  }, [newCity, newCityVerified]);

  useEffect(() => {
    const fetchSearchLocationOptions = async () => {
      const trimmedInput = searchCity.trim();
      if (trimmedInput.length < 3) {
        setSearchCityOptions([]);
        return;
      }
      setIsLocatingSearchCity(true);
      try {
        const res = await fetch(`/api/city-board/autocomplete?input=${encodeURIComponent(trimmedInput)}`);
        const data = await res.json();
        if (data.options && data.options.length > 0) {
          setSearchCityOptions(data.options);
        } else {
          setSearchCityOptions([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLocatingSearchCity(false);
      }
    };
    const debounceSearch = setTimeout(fetchSearchLocationOptions, 500);
    return () => clearTimeout(debounceSearch);
  }, [searchCity]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchKeyword) params.append('keyword', searchKeyword);
      if (searchCity) params.append('city', searchCity);
      if (searchCategory !== 'All') params.append('category', searchCategory);
      if (searchPostId) params.append('post_id', searchPostId);
      if (deviceCookie) params.append('device_cookie', deviceCookie);
      if (showMyPosts) params.append('my_posts_only', 'true');

      const res = await fetch(`/api/city-board/posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } catch (e) {
      console.error('Failed to fetch posts', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deviceCookie) {
      fetchPosts();
    }
  }, [searchKeyword, searchCity, searchCategory, searchPostId, showMyPosts, deviceCookie]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity.trim() || !newContent.trim()) {
      setPostError('City and content are required.');
      return;
    }
    if (!newCityVerified) {
      setPostError('Please enter a specific city name — for example Louisville, Amman, or Dubai');
      return;
    }
    setIsPosting(true);
    setPostError('');

    try {
      const res = await fetch('/api/city-board/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: newCity,
          category: newCategory,
          content: newContent,
          device_cookie: deviceCookie
        })
      });

      if (res.ok) {
        setNewContent('');
        setNewCategory('General');
        // keep city for convenience
        fetchPosts();
      } else {
        const err = await res.json();
        setPostError(err.error || 'Failed to create post');
      }
    } catch (e) {
      setPostError('An unexpected error occurred.');
    } finally {
      setIsPosting(false);
    }
  };

  // Modals & States for Helpful and Report features

  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('Spam');
  const [submittingReport, setSubmittingReport] = useState(false);

  const handleMarkHelpful = async (postId: string) => {
    if (!deviceCookie) return;
    try {
      const res = await fetch('/api/city-board/helpful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, device_cookie: deviceCookie })
      });
      if (res.ok) {
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.post_id === postId
              ? { ...p, helpful_count: (p.helpful_count || 0) + 1, voted_helpful: true }
              : p
          )
        );
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to vote helpful');
      }
    } catch (e) {
      console.error(e);
    }
  };



  const openReportModal = (postId: string) => {
    setReportPostId(postId);
    setReportReason('Spam');
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportPostId || !deviceCookie) return;
    setSubmittingReport(true);
    try {
      const res = await fetch('/api/city-board/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: reportPostId, reason: reportReason, device_cookie: deviceCookie })
      });
      if (res.ok) {
        alert('Thank you. This post has been reported and will be reviewed by our admin team.');
        setReportPostId(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to report post');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred.');
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        <div className="bg-[#FFFBF5] rounded-3xl p-6 md:p-8 shadow-sm border border-[#3B2410]/10 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-black text-[#3B2410] flex items-center gap-2">
              <img src="/Logo.png" alt="Lumo Bites" className="h-6 md:h-8 w-auto object-contain drop-shadow-sm" />
              Share with your pet community
            </h2>
            <p className="text-[#3B2410]/70 mt-2 font-medium">Ask questions, share tips, get recommendations — anonymously</p>
          </div>
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-bold text-[#3B2410] mb-1">City</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={newCity} 
                    onChange={e => {
                      setNewCity(e.target.value);
                      setNewCityVerified(false);
                    }} 
                    placeholder="e.g. Louisville, KY" 
                    className="w-full bg-white border border-[#3B2410]/20 rounded-xl px-4 py-3 text-[#3B2410] focus:outline-none focus:border-[#3B2410] focus:ring-1 focus:ring-[#3B2410]/20 transition-all"
                    required
                  />
                  {isLocatingNewCity && (
                    <div className="absolute right-3 top-3">
                      <svg className="animate-spin h-5 w-5 text-[#3B2410]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    </div>
                  )}
                  {newCityVerified && !isLocatingNewCity && (
                    <div className="absolute right-3 top-3 text-green-600 font-bold">✓</div>
                  )}
                </div>
                {newCityOptions.length > 0 && !newCityVerified && (
                  <div className="mt-2 p-2 bg-white border border-[#3B2410]/10 rounded-xl shadow-lg absolute z-10 w-full">
                    <p className="text-xs font-bold text-[#3B2410]/70 mb-1 px-2 uppercase tracking-wide">Did you mean:</p>
                    {newCityOptions.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setNewCity(opt.clean_city);
                          setNewCityVerified(true);
                          setNewCityOptions([]);
                        }}
                        className="block w-full text-left px-3 py-2 hover:bg-[#F5F0E8] rounded-lg text-sm text-[#3B2410] font-medium transition-colors flex items-center gap-1.5"
                      >
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" /> {opt.formatted_address}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-[#3B2410] mb-1">Category</label>
                <select 
                  value={newCategory} 
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full bg-white border border-[#3B2410]/20 rounded-xl px-4 py-3 text-[#3B2410] focus:outline-none focus:border-[#3B2410] focus:ring-1 focus:ring-[#3B2410]/20 transition-all"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-[#3B2410] mb-1">Message</label>
              <textarea 
                value={newContent} 
                onChange={e => setNewContent(e.target.value)} 
                rows={3} 
                placeholder="Ask a question, share a tip..." 
                className="w-full bg-white border border-[#3B2410]/20 rounded-xl px-4 py-3 text-[#3B2410] focus:outline-none focus:border-[#3B2410] focus:ring-1 focus:ring-[#3B2410]/20 transition-all resize-y"
                required
              />
            </div>
            {postError && <div className="text-red-500 text-sm font-bold">{postError}</div>}
            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={isPosting} 
                className="bg-[#3B2410] hover:bg-[#3B2410]/80 text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                {isPosting ? 'Posting...' : 'Post Anonymously'}
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-4 mb-8 bg-[#FFFBF5] p-4 rounded-2xl border border-[#3B2410]/10 shadow-sm">
          <div className="flex gap-3 w-full overflow-x-auto pb-2 hide-scrollbar">
            <input 
              type="text" 
              placeholder="🔍 Keyword (e.g. vet)..." 
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              className="bg-white border border-[#3B2410]/20 rounded-xl px-4 py-2.5 text-sm text-[#3B2410] focus:outline-none focus:border-[#3B2410] focus:ring-1 focus:ring-[#3B2410]/20 min-w-[160px] transition-all"
            />
            <div className="relative min-w-[160px]">
              <input 
                type="text" 
                placeholder="📍 City..." 
                value={searchCity}
                onChange={e => {
                  setSearchCity(e.target.value);
                }}
                className="w-full bg-white border border-[#3B2410]/20 rounded-xl px-4 py-2.5 text-sm text-[#3B2410] focus:outline-none focus:border-[#3B2410] focus:ring-1 focus:ring-[#3B2410]/20 transition-all"
              />
              {isLocatingSearchCity && (
                <div className="absolute right-3 top-2.5">
                  <svg className="animate-spin h-5 w-5 text-[#3B2410]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </div>
              )}
              {searchCityOptions.length > 0 && (
                <div className="mt-1 p-2 bg-white border border-[#3B2410]/10 rounded-xl shadow-lg absolute z-20 w-[250px]">
                  <p className="text-[10px] font-bold text-[#3B2410]/70 mb-1 px-2 uppercase tracking-wide">Did you mean:</p>
                  {searchCityOptions.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSearchCity(opt.clean_city);
                        setSearchCityOptions([]);
                      }}
                      className="block w-full text-left px-3 py-2 hover:bg-[#F5F0E8] rounded-lg text-sm text-[#3B2410] font-medium transition-colors flex items-center gap-1.5"
                    >
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" /> {opt.formatted_address}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <select 
              value={searchCategory}
              onChange={e => setSearchCategory(e.target.value)}
              className="bg-white border border-[#3B2410]/20 rounded-xl px-4 py-2.5 text-sm text-[#3B2410] focus:outline-none focus:border-[#3B2410] focus:ring-1 focus:ring-[#3B2410]/20 min-w-[160px] transition-all"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input 
              type="text" 
              placeholder="#️⃣ ID (LB-...)" 
              value={searchPostId}
              onChange={e => setSearchPostId(e.target.value)}
              className="bg-white border border-[#3B2410]/20 rounded-xl px-4 py-2.5 text-sm text-[#3B2410] focus:outline-none focus:border-[#3B2410] focus:ring-1 focus:ring-[#3B2410]/20 min-w-[140px] transition-all"
            />
          </div>
          <div className="flex items-center gap-2 px-2 border-t border-[#3B2410]/10 pt-3">
            <input 
              type="checkbox" 
              id="my_posts" 
              checked={showMyPosts} 
              onChange={e => setShowMyPosts(e.target.checked)}
              className="w-4 h-4 accent-[#3B2410] rounded border-[#3B2410]/20"
            />
            <label htmlFor="my_posts" className="text-sm font-bold text-[#3B2410] cursor-pointer whitespace-nowrap">Show only my posts</label>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-[#3B2410]/50 font-bold">Loading community posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-[#3B2410]/50 font-bold bg-[#FFFBF5] rounded-3xl border border-[#3B2410]/10 shadow-sm">No posts found. Be the first to start a conversation!</div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-gradient-to-br from-[#FFFDF9] to-[#FAF6F4] rounded-3xl p-6 md:p-8 border border-[#3B2410]/12 shadow-[0_4px_20px_rgba(59,36,16,0.03)] hover:shadow-[0_8px_30px_rgba(59,36,16,0.08)] hover:-translate-y-0.5 transition-all duration-300 relative group">
                {post.device_cookie === deviceCookie && (
                  <div className="absolute top-6 right-6 bg-[#3B2410] text-[#FFFDF9] text-[10px] uppercase tracking-[0.15em] font-black px-3.5 py-1 rounded-full shadow-sm">
                    You
                  </div>
                )}
                <div className="flex items-center gap-2 mb-4 flex-wrap pr-12">
                  <span className="text-xs font-black text-[#3B2410] bg-[#FAF6F4] border border-[#3B2410]/15 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#3B2410]/70" /> {post.city}
                  </span>
                  <span className={`text-xs font-black px-3 py-1.5 rounded-full border shadow-sm ${getCategoryColor(post.category)}`}>{post.category}</span>
                  <span className="text-xs text-[#3B2410]/50 ml-auto hidden sm:inline-block font-medium">ID: {post.post_id} • {formatDistanceToNow(new Date(post.created_at))} ago</span>
                </div>
                <p className="text-[#3B2410] whitespace-pre-wrap mb-6 text-lg leading-relaxed font-medium">{post.content}</p>
                
                <div className="flex items-center justify-between border-t border-[#3B2410]/10 pt-4 mt-2 flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <Link 
                      href={`/city-board/${post.post_id}`} 
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#3B2410] bg-white border border-[#3B2410]/15 px-5 py-2.5 rounded-full shadow-sm hover:bg-[#FAF6F4] hover:border-[#3B2410]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <MessageSquare className="w-4 h-4 text-[#3B2410]" /> {post.reply_count} {post.reply_count === 1 ? 'Reply' : 'Replies'}
                    </Link>
                    
                    <button
                      onClick={() => handleMarkHelpful(post.post_id)}
                      disabled={post.voted_helpful}
                      className={`inline-flex items-center gap-1.5 text-sm px-5 py-2.5 rounded-full border shadow-sm transition-all ${
                        post.voted_helpful 
                          ? 'bg-[#8B5E3C] text-white border-[#8B5E3C] shadow-inner font-extrabold cursor-not-allowed'
                          : 'bg-white text-[#3B2410] border-[#3B2410]/15 hover:bg-[#FAF6F4] hover:border-[#3B2410]/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer font-bold'
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${post.voted_helpful ? 'text-white' : 'text-[#3B2410]'}`} /> Helpful ({post.helpful_count || 0})
                    </button>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <button
                      onClick={() => openReportModal(post.post_id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#3B2410]/50 hover:text-red-600 hover:underline transition-colors cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Flag Post
                    </button>
                    <span className="text-xs text-[#3B2410]/50 sm:hidden font-medium">{formatDistanceToNow(new Date(post.created_at))} ago</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/city-board/${post.post_id}`);
                        alert('Link copied to clipboard!');
                      }}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-[#3B2410] bg-white border border-[#3B2410]/15 px-5 py-2.5 rounded-full shadow-sm hover:bg-[#FAF6F4] hover:border-[#3B2410]/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                      title="Copy link to post"
                    >
                      <Share2 className="w-4 h-4 text-[#3B2410]" /> Copy Link
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>



      {/* REPORT MODAL */}
      {reportPostId && (
        <div className="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setReportPostId(null)}>
          <div className="bg-[#FFFBF5] rounded-3xl p-8 max-w-md w-full border border-[#3B2410]/15 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setReportPostId(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#FAF6F4] text-[#3B2410] font-bold">✕</button>
            <h3 className="text-xl font-black text-red-700 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-700" /> Report post
            </h3>
            <p className="text-[#3B2410]/70 text-sm mb-6 font-medium">Help us keep Lumo Bites clean and safe. Please select a reason for reporting this post:</p>
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <select
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                className="w-full bg-white border border-[#3B2410]/20 rounded-xl px-4 py-3 text-[#3B2410] focus:outline-none focus:border-[#3B2410] font-medium"
              >
                <option value="Spam">Spam</option>
                <option value="Inappropriate">Inappropriate content</option>
                <option value="Wrong category">Wrong category</option>
                <option value="Other">Other</option>
              </select>
              <button
                type="submit"
                disabled={submittingReport}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 shadow-md cursor-pointer"
              >
                {submittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
