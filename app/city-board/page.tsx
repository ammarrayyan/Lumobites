'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow } from 'date-fns';

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

  useEffect(() => {
    let cookie = localStorage.getItem('lumo_city_board_cookie');
    if (!cookie) {
      cookie = uuidv4();
      localStorage.setItem('lumo_city_board_cookie', cookie);
    }
    setDeviceCookie(cookie);
  }, []);

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
    <div className="min-h-screen bg-[#FDFAF7] font-sans">
      {/* Hidden Navbar for navigation back if needed, but keeping it minimal */}
      <header className="bg-white border-b border-[#E8DDD4] py-4 px-6 flex justify-between items-center shadow-sm">
        <div className="font-black text-[#8B5E3C] text-xl">Lumo City Board (Internal)</div>
        <Link href="/" className="text-sm font-bold text-[#8B7E7D] hover:text-[#4A3E3D]">Back to Main Site</Link>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E8DDD4] mb-8">
          <h2 className="text-2xl font-black text-[#4A3E3D] mb-4 flex items-center gap-2">
            💬 Post to City Board
          </h2>
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#4A3E3D] mb-1">City</label>
                <input 
                  type="text" 
                  value={newCity} 
                  onChange={e => setNewCity(e.target.value)} 
                  placeholder="e.g. Louisville, KY" 
                  className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#4A3E3D] mb-1">Category</label>
                <select 
                  value={newCategory} 
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-[#4A3E3D] mb-1">Message</label>
              <textarea 
                value={newContent} 
                onChange={e => setNewContent(e.target.value)} 
                rows={3} 
                placeholder="Ask a question, share a tip..." 
                className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C]"
                required
              />
            </div>
            {postError && <div className="text-red-500 text-sm font-bold">{postError}</div>}
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={isPosting} 
                className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-2.5 px-6 rounded-xl transition-colors disabled:opacity-50"
              >
                {isPosting ? 'Posting...' : 'Post Anonymously'}
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-2 w-full overflow-x-auto pb-2 hide-scrollbar">
            <input 
              type="text" 
              placeholder="Keyword (e.g. vet)..." 
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              className="bg-white border border-[#E8DDD4] rounded-xl px-4 py-2 text-sm text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] min-w-[150px]"
            />
            <input 
              type="text" 
              placeholder="City..." 
              value={searchCity}
              onChange={e => setSearchCity(e.target.value)}
              className="bg-white border border-[#E8DDD4] rounded-xl px-4 py-2 text-sm text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] min-w-[150px]"
            />
            <select 
              value={searchCategory}
              onChange={e => setSearchCategory(e.target.value)}
              className="bg-white border border-[#E8DDD4] rounded-xl px-4 py-2 text-sm text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] min-w-[150px]"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input 
              type="text" 
              placeholder="ID (LB-...)" 
              value={searchPostId}
              onChange={e => setSearchPostId(e.target.value)}
              className="bg-white border border-[#E8DDD4] rounded-xl px-4 py-2 text-sm text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] min-w-[150px]"
            />
          </div>
          <div className="flex items-center gap-2 px-2">
            <input 
              type="checkbox" 
              id="my_posts" 
              checked={showMyPosts} 
              onChange={e => setShowMyPosts(e.target.checked)}
              className="w-4 h-4 accent-[#8B5E3C]"
            />
            <label htmlFor="my_posts" className="text-sm font-bold text-[#4A3E3D] cursor-pointer whitespace-nowrap">My Posts</label>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[#8B7E7D] font-bold">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-[#8B7E7D] font-bold bg-white rounded-3xl border border-[#E8DDD4]">No posts found. Be the first to post!</div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-3xl p-6 border border-[#E8DDD4] shadow-sm hover:shadow-md transition-shadow relative">
                {post.device_cookie === deviceCookie && (
                  <div className="absolute top-4 right-4 bg-[#FAF6F4] text-[#8B5E3C] text-xs font-bold px-2 py-1 rounded border border-[#E8DDD4]">
                    You
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs font-black text-white bg-[#8B5E3C] px-2 py-1 rounded">📍 {post.city}</span>
                  <span className="text-xs font-bold text-[#8B5E3C] bg-[#FAF6F4] px-2 py-1 rounded border border-[#E8DDD4]">{post.category}</span>
                  <span className="text-xs text-[#8B7E7D] ml-auto">ID: {post.post_id} • {formatDistanceToNow(new Date(post.created_at))} ago</span>
                </div>
                <p className="text-[#4A3E3D] whitespace-pre-wrap mb-4">{post.content}</p>
                
                <div className="flex items-center justify-between border-t border-[#E8DDD4] pt-4 mt-2">
                  <Link href={`/city-board/${post.post_id}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#8B5E3C] hover:text-[#7A5234]">
                    💬 {post.reply_count} {post.reply_count === 1 ? 'Reply' : 'Replies'}
                  </Link>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/city-board/${post.post_id}`);
                      alert('Link copied to clipboard!');
                    }}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[#8B7E7D] hover:text-[#4A3E3D] transition-colors bg-[#FAF6F4] px-3 py-1.5 rounded-lg"
                  >
                    🔗 Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
