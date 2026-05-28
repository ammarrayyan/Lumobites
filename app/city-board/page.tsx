'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow } from 'date-fns';
import Navbar from '@/components/Navbar';

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'General': 'bg-gray-100 text-gray-800 border-gray-200',
    'Vet Recommendations': 'bg-blue-100 text-blue-800 border-blue-200',
    'Groomers': 'bg-pink-100 text-pink-800 border-pink-200',
    'Pet Sitters': 'bg-green-100 text-green-800 border-green-200',
    'Lost & Found': 'bg-red-100 text-red-800 border-red-200',
    'Diet & Nutrition': 'bg-purple-100 text-purple-800 border-purple-200',
    'Parks & Activities': 'bg-orange-100 text-orange-800 border-orange-200',
  };
  return colors[category] || 'bg-white text-[#3B2410] border-[#3B2410]/20';
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

  useEffect(() => {
    let cookie = localStorage.getItem('lumo_city_board_cookie');
    if (!cookie) {
      cookie = uuidv4();
      localStorage.setItem('lumo_city_board_cookie', cookie);
    }
    setDeviceCookie(cookie);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (newCity && !newCityVerified) {
        fetchLocationOptions(newCity);
      } else if (!newCity) {
        setNewCityOptions([]);
      }
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [newCity, newCityVerified]);

  const fetchLocationOptions = async (input: string) => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

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

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchKeyword) params.append('keyword', searchKeyword);
      if (searchCity) params.append('city', searchCity);
      if (searchCategory !== 'All') params.append('category', searchCategory);
      if (searchPostId) params.append('post_id', searchPostId);
      if (showMyPosts && deviceCookie) params.append('device_cookie', deviceCookie);

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
      setPostError('Please select a specific city from the dropdown options.');
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

  return (
    <div className="min-h-screen bg-[#F5F0E8] font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        <div className="bg-[#FFFBF5] rounded-3xl p-6 md:p-8 shadow-sm border border-[#3B2410]/10 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-black text-[#3B2410] flex items-center gap-2">
              💬 Share with your pet community
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
                        className="block w-full text-left px-3 py-2 hover:bg-[#F5F0E8] rounded-lg text-sm text-[#3B2410] font-medium transition-colors"
                      >
                        📍 {opt.formatted_address}
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
            <input 
              type="text" 
              placeholder="📍 City..." 
              value={searchCity}
              onChange={e => setSearchCity(e.target.value)}
              className="bg-white border border-[#3B2410]/20 rounded-xl px-4 py-2.5 text-sm text-[#3B2410] focus:outline-none focus:border-[#3B2410] focus:ring-1 focus:ring-[#3B2410]/20 min-w-[160px] transition-all"
            />
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
              <div key={post.id} className="bg-[#FFFBF5] rounded-3xl p-6 md:p-8 border border-[#3B2410]/10 shadow-sm hover:shadow-md transition-all relative group">
                {post.device_cookie === deviceCookie && (
                  <div className="absolute top-6 right-6 bg-[#3B2410] text-[#F5F0E8] text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-sm">
                    You
                  </div>
                )}
                <div className="flex items-center gap-2 mb-4 flex-wrap pr-12">
                  <span className="text-xs font-bold text-white bg-[#3B2410] px-3 py-1.5 rounded-full shadow-sm">📍 {post.city}</span>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${getCategoryColor(post.category)}`}>{post.category}</span>
                  <span className="text-xs text-[#3B2410]/50 ml-auto hidden sm:inline-block">ID: {post.post_id} • {formatDistanceToNow(new Date(post.created_at))} ago</span>
                </div>
                <p className="text-[#3B2410] whitespace-pre-wrap mb-6 text-lg leading-relaxed">{post.content}</p>
                
                <div className="flex items-center justify-between border-t border-[#3B2410]/10 pt-4 mt-2">
                  <Link href={`/city-board/${post.post_id}`} className="inline-flex items-center gap-2 text-sm font-bold text-[#3B2410] hover:text-[#3B2410]/70 transition-colors bg-white border border-[#3B2410]/10 px-4 py-2 rounded-xl hover:shadow-sm">
                    💬 {post.reply_count} {post.reply_count === 1 ? 'Reply' : 'Replies'}
                  </Link>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[#3B2410]/50 sm:hidden">{formatDistanceToNow(new Date(post.created_at))} ago</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/city-board/${post.post_id}`);
                        alert('Link copied to clipboard!');
                      }}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-[#3B2410]/60 hover:text-[#3B2410] transition-colors p-2 rounded-xl hover:bg-white"
                      title="Copy link to post"
                    >
                      🔗 Share
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
