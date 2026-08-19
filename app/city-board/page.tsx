'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow } from 'date-fns';
import MobileCommunityNav from '@/components/MobileCommunityNav';
import {
  MapPin, MessageSquare, AlertTriangle, Share2, RefreshCw, Loader2, Ban, Trash2,
  ArrowBigUp, MessageCircle, Stethoscope, Scissors, PawPrint, Search, Utensils, TreePine,
  GraduationCap, HeartPulse, Heart, ShoppingBag, Camera, Star, Calendar, Flame, Check, Bookmark
} from 'lucide-react';

const CATEGORY_META: Record<string, { color: string; icon: any }> = {
  'General': { color: 'bg-stone-100 text-stone-800 border-stone-200', icon: MessageCircle },
  'Vet Recommendations': { color: 'bg-emerald-50 text-emerald-900 border-emerald-200', icon: Stethoscope },
  'Groomers': { color: 'bg-amber-50 text-amber-900 border-amber-200', icon: Scissors },
  'Pet Sitters': { color: 'bg-indigo-50 text-indigo-900 border-indigo-200', icon: PawPrint },
  'Lost & Found': { color: 'bg-rose-50 text-rose-900 border-rose-200', icon: Search },
  'Diet & Nutrition': { color: 'bg-yellow-50 text-yellow-900 border-yellow-200', icon: Utensils },
  'Parks & Activities': { color: 'bg-teal-50 text-teal-900 border-teal-200', icon: TreePine },
  'Training & Behavior': { color: 'bg-sky-50 text-sky-900 border-sky-200', icon: GraduationCap },
  'Pet Health & Wellness': { color: 'bg-[#FDF8F3] text-[#5C4533] border-[#EADBCE]', icon: HeartPulse },
  'Adoption & Rescue': { color: 'bg-pink-50 text-pink-900 border-pink-200', icon: Heart },
  'Product Recommendations': { color: 'bg-blue-50 text-blue-900 border-blue-200', icon: ShoppingBag },
  'Show & Tell': { color: 'bg-orange-50 text-orange-900 border-orange-200', icon: Camera },
  'New Pet Owners': { color: 'bg-lime-50 text-lime-900 border-lime-200', icon: Star },
  'Events & Meetups': { color: 'bg-purple-50 text-purple-900 border-purple-200', icon: Calendar },
};

const getCategoryColor = (category: string) => CATEGORY_META[category]?.color || 'bg-stone-100 text-stone-800 border-stone-200';
const getCategoryIcon = (category: string) => CATEGORY_META[category]?.icon || MessageCircle;

const CATEGORIES = Object.keys(CATEGORY_META);

export default function CityBoardPage() {
  const [deviceCookie, setDeviceCookie] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockedCookies, setBlockedCookies] = useState<string[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = (
        localStorage.getItem('lumo_pro_email') ||
        localStorage.getItem('lumo_sitter_email') ||
        ''
      ).trim();
      setUserEmail(email);

      const blocked = localStorage.getItem('lumo_blocked_device_cookies');
      if (blocked) {
        try { setBlockedCookies(JSON.parse(blocked)); } catch (e) {}
      }

      if (email) {
        const savedKey = `lumo_saved_city_board_posts_${email}`;
        const saved = localStorage.getItem(savedKey) || localStorage.getItem('lumo_saved_city_board_posts');
        if (saved) {
          try { setSavedPostIds(JSON.parse(saved)); } catch (e) {}
        }
      }
    }
  }, []);

  const toggleSavePost = (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // STRICT CHECK: Gated exclusively to signed-in users
    if (!userEmail) {
      showToast('Sign in to save discussions to your bookmarks 🔖');
      window.dispatchEvent(new Event('lumo-open-signin'));
      return;
    }

    let updated: string[];
    if (savedPostIds.includes(postId)) {
      updated = savedPostIds.filter(id => id !== postId);
      showToast('Removed from your saved bookmarks');
    } else {
      updated = [...savedPostIds, postId];
      showToast('Discussion saved to bookmarks 🔖');
    }
    setSavedPostIds(updated);
    if (typeof window !== 'undefined') {
      const savedKey = `lumo_saved_city_board_posts_${userEmail}`;
      localStorage.setItem(savedKey, JSON.stringify(updated));
    }
  };

  const handleSelectCategory = (cat: string) => {
    if (cat === 'Saved' && !userEmail) {
      showToast('Sign in to view your saved discussions 🔖');
      window.dispatchEvent(new Event('lumo-open-signin'));
      return;
    }
    setSearchCategory(cat);
  };

  const handleBlockUser = (cookieToBlock: string) => {
    if (!cookieToBlock) return;
    if (cookieToBlock === deviceCookie) {
      showToast("You cannot block yourself.");
      return;
    }
    if (!window.confirm("Are you sure you want to block this user? You will no longer see their posts.")) return;

    const nextBlocked = [...blockedCookies, cookieToBlock];
    setBlockedCookies(nextBlocked);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lumo_blocked_device_cookies', JSON.stringify(nextBlocked));
    }
    showToast("User blocked successfully.");
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post? This will also delete all replies and cannot be undone.")) return;
    try {
      const res = await fetch('/api/city-board/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, device_cookie: deviceCookie })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete post');
      }
      showToast("Post deleted successfully.");
      setPosts(prev => prev.filter(p => p.post_id !== postId));
    } catch (err: any) {
      showToast(err.message || "Failed to delete post.");
    }
  };

  // Filters
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchCategory, setSearchCategory] = useState('All');
  const [searchPostId, setSearchPostId] = useState('');
  const [showMyPosts, setShowMyPosts] = useState(false);

  // Refresh State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDownY, setPullDownY] = useState(0);
  const isPullingRef = useRef(false);
  const pullStartYRef = useRef(0);

  const currentContextRef = useRef({ searchKeyword, searchCity, searchCategory, searchPostId, showMyPosts, deviceCookie });
  currentContextRef.current = { searchKeyword, searchCity, searchCategory, searchPostId, showMyPosts, deviceCookie };

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
        const res = await fetch(`/api/city-board/autocomplete?input=${encodeURIComponent(trimmedInput)}&type=cities`);
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
        const res = await fetch(`/api/city-board/autocomplete?input=${encodeURIComponent(trimmedInput)}&type=cities`);
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

  const fetchPosts = useCallback(async (showRefreshIndicator = false) => {
    const ctx = currentContextRef.current;
    if (!ctx.deviceCookie) return;
    
    if (showRefreshIndicator) setIsRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      if (ctx.searchKeyword) params.append('keyword', ctx.searchKeyword);
      if (ctx.searchCity) params.append('city', ctx.searchCity);
      if (ctx.searchCategory !== 'All' && ctx.searchCategory !== 'Saved') params.append('category', ctx.searchCategory);
      if (ctx.searchPostId) params.append('post_id', ctx.searchPostId);
      if (ctx.deviceCookie) params.append('device_cookie', ctx.deviceCookie);
      if (ctx.showMyPosts) params.append('my_posts_only', 'true');

      const res = await fetch(`/api/city-board/posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } catch (e) {
      console.error('Failed to fetch posts', e);
    } finally {
      if (showRefreshIndicator) setIsRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (deviceCookie) {
      fetchPosts(false);
    }
  }, [searchKeyword, searchCity, searchCategory, searchPostId, showMyPosts, deviceCookie, fetchPosts]);

  useEffect(() => {
    if (!deviceCookie) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchPosts(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [deviceCookie, fetchPosts]);

  // Pull-to-refresh Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      isPullingRef.current = true;
      pullStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current) return;
    const y = e.touches[0].clientY;
    const delta = y - pullStartYRef.current;
    if (delta > 0 && window.scrollY === 0) {
      setPullDownY(Math.min(delta * 0.4, 80));
    } else {
      isPullingRef.current = false;
      setPullDownY(0);
    }
  };

  const handleTouchEnd = () => {
    if (pullDownY > 60 && !isRefreshing) {
      fetchPosts(true).finally(() => {
        setPullDownY(0);
      });
    } else {
      setPullDownY(0);
    }
    isPullingRef.current = false;
  };

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
        showToast('Discussion posted successfully! ✨');
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
        showToast('Voted helpful! 👍');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to vote helpful');
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
      const email = userEmail || 'anonymous@lumobites.net';
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reported_by_email: email,
          reporter_email: email,
          reported_email: 'anonymous@lumobites.net',
          reported_type: 'city_board',
          post_id: reportPostId,
          post_type: 'city_board',
          reason: reportReason,
          status: 'pending'
        })
      });
      if (res.ok) {
        showToast('Report submitted for review');
        setReportPostId(null);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to report post');
      }
    } catch (e) {
      console.error(e);
      showToast('An error occurred.');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Filter posts by saved if searchCategory === 'Saved'
  const filteredPosts = posts
    .filter(post => !blockedCookies.includes(post.device_cookie))
    .filter(post => searchCategory === 'Saved' ? savedPostIds.includes(post.post_id) : true);

  return (
    <div 
      className="min-h-screen bg-[#FAF7F2] font-sans flex flex-col relative pt-[52px] md:pt-0"
    >
      <MobileCommunityNav />

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[10000] bg-gray-900/95 text-white text-xs font-extrabold px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md transition-all animate-bounce flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      <div 
        className="flex-1 flex flex-col w-full relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${pullDownY}px)`, transition: isPullingRef.current ? 'none' : 'transform 0.3s ease-out' }}
      >
        {(pullDownY > 0 || isRefreshing) && (
          <div className="absolute top-0 left-0 w-full flex justify-center pt-8 z-50 animate-fade-in" style={{ transform: isRefreshing ? 'none' : `translateY(${pullDownY}px)` }}>
            <div className="bg-white rounded-full shadow-md py-2.5 px-4 flex items-center justify-center gap-2 border border-[#EDE5DA] text-[#8B5E3C] font-bold text-xs">
              {isRefreshing ? (
                <>
                  <Loader2 className="w-4 h-4 text-[#8B5E3C] animate-spin" />
                  <span>Refreshing feed...</span>
                </>
              ) : (
                <RefreshCw className="w-4 h-4 text-[#8B5E3C]" style={{ transform: `rotate(${pullDownY * 3}deg)` }} />
              )}
            </div>
          </div>
        )}

      <main className="max-w-6xl mx-auto px-4 py-8 w-full grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">

        {/* TOPIC NAVIGATION (SOFT FLOATING PILL SYSTEM WITH SAVED TAB) */}
        <aside className="lg:sticky lg:top-24">
          <h3 className="hidden lg:block text-[11px] font-extrabold text-[#8C827A] uppercase tracking-widest mb-3 px-2">Topics</h3>
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 hide-scrollbar bg-white/60 lg:bg-transparent p-2.5 lg:p-0 rounded-2xl lg:rounded-none border border-[#EDE5DA] lg:border-0 shadow-xs lg:shadow-none backdrop-blur-xs">
            <button
              onClick={() => handleSelectCategory('All')}
              className={`shrink-0 flex items-center gap-2 text-xs font-extrabold px-4 py-2.5 rounded-full border transition-all whitespace-nowrap cursor-pointer ${
                searchCategory === 'All'
                  ? 'bg-[#8B5E3C] text-white border-[#8B5E3C] shadow-xs'
                  : 'bg-white text-gray-700 border-[#EDE5DA] hover:bg-[#FDFAF7] hover:border-[#8B5E3C]/30'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> All Topics
            </button>

            {/* Saved Bookmarks Tab */}
            <button
              onClick={() => handleSelectCategory('Saved')}
              className={`shrink-0 flex items-center gap-2 text-xs font-extrabold px-4 py-2.5 rounded-full border transition-all whitespace-nowrap cursor-pointer ${
                searchCategory === 'Saved'
                  ? 'bg-[#8B5E3C] text-white border-[#8B5E3C] shadow-xs'
                  : 'bg-white text-gray-700 border-[#EDE5DA] hover:bg-[#FDFAF7] hover:border-[#8B5E3C]/30'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${searchCategory === 'Saved' ? 'fill-white' : 'text-[#8B5E3C]'}`} />
              <span>Saved {userEmail ? `(${savedPostIds.length})` : ''}</span>
            </button>

            {CATEGORIES.map(cat => {
              const Icon = getCategoryIcon(cat);
              const isActive = searchCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleSelectCategory(cat)}
                  className={`shrink-0 flex items-center gap-2 text-xs font-extrabold px-4 py-2.5 rounded-full border transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? `${getCategoryColor(cat)} shadow-xs ring-2 ring-[#8B5E3C]/20`
                      : 'bg-white text-gray-700 border-[#EDE5DA] hover:bg-[#FDFAF7] hover:border-[#8B5E3C]/30'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" /> {cat}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="min-w-0 space-y-6">

        {/* COMPOSER CARD (23ANDME CLEAN CARD SYSTEM) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#EDE5DA]">
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <img src="/Logo.png" alt="Lumo Bites" className="h-6 w-auto object-contain" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8B5E3C]">City Board</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1F1712] tracking-tight">
              Share with your pet community
            </h2>
            <p className="text-[#5C534C] text-xs sm:text-sm mt-1 font-normal">Ask questions, share recommendations, or discuss local pet care — completely free.</p>
          </div>

          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-xs font-extrabold text-[#1F1712] uppercase tracking-wider mb-1.5">City Location</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={newCity} 
                    onChange={e => {
                      setNewCity(e.target.value);
                      setNewCityVerified(false);
                    }} 
                    placeholder="e.g. Louisville, KY" 
                    className="w-full bg-[#FAF7F2] border border-[#EDE5DA] rounded-2xl px-4 py-3 text-sm text-[#1F1712] focus:outline-none focus:border-[#8B5E3C] focus:bg-white transition-all font-medium"
                    required
                  />
                  {isLocatingNewCity && (
                    <div className="absolute right-3.5 top-3.5">
                      <Loader2 className="animate-spin h-4 w-4 text-[#8B5E3C]" />
                    </div>
                  )}
                  {newCityVerified && !isLocatingNewCity && (
                    <div className="absolute right-3.5 top-3.5 text-emerald-600 font-bold">
                      <Check className="w-4 h-4 text-emerald-600" />
                    </div>
                  )}
                </div>
                {newCityOptions.length > 0 && !newCityVerified && (
                  <div className="mt-2 p-2 bg-white border border-[#EDE5DA] rounded-2xl shadow-xl absolute z-20 w-full">
                    <p className="text-[10px] font-extrabold text-[#8C827A] mb-1 px-2 uppercase tracking-widest">Select City:</p>
                    {newCityOptions.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setNewCity(opt.clean_city);
                          setNewCityVerified(true);
                          setNewCityOptions([]);
                        }}
                        className="block w-full text-left px-3 py-2 hover:bg-[#FAF7F2] rounded-xl text-xs text-[#1F1712] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border-none"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#8B5E3C] shrink-0" /> {opt.formatted_address}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#1F1712] uppercase tracking-wider mb-1.5">Topic Category</label>
                <select 
                  value={newCategory} 
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#EDE5DA] rounded-2xl px-4 py-3 text-sm text-[#1F1712] focus:outline-none focus:border-[#8B5E3C] focus:bg-white transition-all font-medium cursor-pointer"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#1F1712] uppercase tracking-wider mb-1.5">Discussion Content</label>
              <textarea 
                value={newContent} 
                onChange={e => setNewContent(e.target.value)} 
                rows={3} 
                placeholder="What's on your mind? Ask a question or share local pet tips..." 
                className="w-full bg-[#FAF7F2] border border-[#EDE5DA] rounded-2xl px-4 py-3 text-sm text-[#1F1712] focus:outline-none focus:border-[#8B5E3C] focus:bg-white transition-all resize-y font-medium placeholder:text-[#8C827A]"
                required
              />
            </div>

            {postError && <div className="text-rose-600 text-xs font-bold px-1">{postError}</div>}
            
            <div className="flex justify-end pt-1">
              <button 
                type="submit" 
                disabled={isPosting} 
                className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-extrabold py-3 px-8 rounded-full text-xs transition-all disabled:opacity-50 shadow-xs hover:shadow-md cursor-pointer border-none active:scale-[0.98]"
              >
                {isPosting ? 'Posting...' : 'Post Discussion'}
              </button>
            </div>
          </form>
        </div>

        {/* SEARCH & FILTERS (PILL BAR SYSTEM) */}
        <div className="bg-white rounded-2xl p-3.5 border border-[#EDE5DA] shadow-xs flex flex-col gap-3">
          <div className="flex gap-2.5 w-full overflow-x-auto pb-1 hide-scrollbar">
            <input 
              type="text" 
              placeholder="🔍 Search keyword..." 
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              className="bg-[#FAF7F2] border border-[#EDE5DA] rounded-xl px-3.5 py-2 text-xs text-[#1F1712] focus:outline-none focus:border-[#8B5E3C] focus:bg-white min-w-[150px] transition-all font-medium"
            />
            <div className="relative min-w-[150px]">
              <input 
                type="text" 
                placeholder="📍 Filter city..." 
                value={searchCity}
                onChange={e => setSearchCity(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#EDE5DA] rounded-xl px-3.5 py-2 text-xs text-[#1F1712] focus:outline-none focus:border-[#8B5E3C] focus:bg-white transition-all font-medium"
              />
              {isLocatingSearchCity && (
                <div className="absolute right-2.5 top-2.5">
                  <Loader2 className="animate-spin h-3.5 w-3.5 text-[#8B5E3C]" />
                </div>
              )}
              {searchCityOptions.length > 0 && (
                <div className="mt-1 p-2 bg-white border border-[#EDE5DA] rounded-xl shadow-xl absolute z-20 w-[240px]">
                  <p className="text-[10px] font-extrabold text-[#8C827A] mb-1 px-2 uppercase tracking-widest">Matching City:</p>
                  {searchCityOptions.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSearchCity(opt.clean_city);
                        setSearchCityOptions([]);
                      }}
                      className="block w-full text-left px-3 py-1.5 hover:bg-[#FAF7F2] rounded-lg text-xs text-[#1F1712] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border-none"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#8B5E3C] shrink-0" /> {opt.formatted_address}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text" 
              placeholder="#️⃣ Post ID (LB-...)" 
              value={searchPostId}
              onChange={e => setSearchPostId(e.target.value)}
              className="bg-[#FAF7F2] border border-[#EDE5DA] rounded-xl px-3.5 py-2 text-xs text-[#1F1712] focus:outline-none focus:border-[#8B5E3C] focus:bg-white min-w-[130px] transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2 px-1 border-t border-[#EDE5DA] pt-2">
            <input 
              type="checkbox" 
              id="my_posts" 
              checked={showMyPosts} 
              onChange={e => setShowMyPosts(e.target.checked)}
              className="w-4 h-4 accent-[#8B5E3C] rounded border-[#EDE5DA]"
            />
            <label htmlFor="my_posts" className="text-xs font-extrabold text-[#1F1712] cursor-pointer whitespace-nowrap">Show only my discussions</label>
          </div>
        </div>

        {/* FEED POST LIST (SKELETON LOADERS & 23ANDME CARDS) */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-white rounded-3xl border border-[#EDE5DA] p-6 shadow-xs animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                  <div className="w-24 h-6 bg-gray-100 rounded-full"></div>
                  <div className="w-20 h-4 bg-gray-100 rounded-full ml-auto"></div>
                </div>
                <div className="w-3/4 h-6 bg-gray-200 rounded-xl"></div>
                <div className="w-full h-4 bg-gray-100 rounded-lg"></div>
                <div className="flex justify-between items-center pt-2">
                  <div className="w-24 h-8 bg-gray-100 rounded-full"></div>
                  <div className="w-16 h-6 bg-gray-100 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 text-[#8C827A] font-extrabold text-sm bg-white rounded-3xl border border-[#EDE5DA] shadow-xs">
            {searchCategory === 'Saved' 
              ? 'You have no saved discussions yet. Click the bookmark icon on any discussion to save it here!' 
              : 'No discussions found. Be the first to start a topic!'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map(post => {
              const isTrending = (post.helpful_count || 0) >= 3 || (post.reply_count || 0) >= 3;
              const isMine = post.device_cookie === deviceCookie;
              const isBookmarked = savedPostIds.includes(post.post_id);

              return (
                <div 
                  key={post.id} 
                  className={`rounded-3xl border transition-all duration-300 relative overflow-hidden flex gap-0 ${
                    isTrending 
                      ? 'bg-gradient-to-br from-[#FFFDF9] via-[#FAF3EA] to-[#F5EAD9] border-[#E8D4C0] shadow-md ring-1 ring-[#8B5E3C]/15 hover:shadow-lg'
                      : 'bg-white border-[#EDE5DA] shadow-xs hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  {/* Helpful Vote Sidebar */}
                  <div className="flex flex-col items-center justify-start gap-1 py-6 px-3.5 bg-black/[0.02] shrink-0 border-r border-[#EDE5DA]/60">
                    <button
                      onClick={() => handleMarkHelpful(post.post_id)}
                      disabled={post.voted_helpful}
                      title="Mark as helpful"
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        post.voted_helpful
                          ? 'bg-[#8B5E3C] text-white shadow-xs cursor-not-allowed'
                          : 'bg-white text-gray-600 border border-[#EDE5DA] hover:bg-[#FAF7F2] hover:text-[#8B5E3C] hover:border-[#8B5E3C]/40 cursor-pointer'
                      }`}
                    >
                      <ArrowBigUp className="w-5 h-5" fill={post.voted_helpful ? 'currentColor' : 'none'} />
                    </button>
                    <span className={`text-xs font-extrabold ${post.voted_helpful ? 'text-[#8B5E3C]' : 'text-[#1F1712]'}`}>
                      {post.helpful_count || 0}
                    </span>
                    <span className="text-[9px] text-[#8C827A] font-extrabold uppercase tracking-widest hidden sm:block">Helpful</span>
                  </div>

                  {/* Card Body */}
                  <div className="flex-1 min-w-0 p-5 sm:p-7">
                    
                    {/* Top Meta Bar */}
                    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Category Badge (Capitalized Pill) */}
                        <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border ${getCategoryColor(post.category)}`}>
                          {post.category}
                        </span>

                        {/* City Location */}
                        <span className="text-xs font-extrabold text-[#1F1712] bg-[#FAF7F2] border border-[#EDE5DA] px-3 py-1 rounded-full flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#8B5E3C]" /> {post.city}
                        </span>

                        {/* Trending Badge */}
                        {isTrending && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                            <Flame className="w-3 h-3 text-amber-600 fill-amber-500 animate-pulse" />
                            <span>Trending</span>
                          </span>
                        )}

                        {isMine && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-white bg-[#8B5E3C] px-2.5 py-1 rounded-full shadow-2xs">
                            Your Post
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        {/* Bookmark Button - Signed-in Gated */}
                        <button
                          type="button"
                          onClick={(e) => toggleSavePost(post.post_id, e)}
                          title={!userEmail ? 'Sign in to save posts' : isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                            isBookmarked && userEmail
                              ? 'bg-[#8B5E3C] text-white border-[#8B5E3C]' 
                              : 'bg-white text-gray-500 border-[#EDE5DA] hover:text-[#8B5E3C]'
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked && userEmail ? 'fill-white' : ''}`} />
                        </button>

                        {/* Timestamp */}
                        <span className="text-xs text-[#8C827A] font-medium">
                          {formatDistanceToNow(new Date(post.created_at))} ago
                        </span>
                      </div>
                    </div>

                    {/* Main Title / Question Treatment */}
                    <Link href={`/city-board/${post.post_id}`} className="block group/link" style={{ textDecoration: 'none' }}>
                      <h3 className="text-lg sm:text-xl font-extrabold text-[#1F1712] leading-snug tracking-tight mb-2 group-hover/link:text-[#8B5E3C] transition-colors">
                        {post.content}
                      </h3>
                    </Link>

                    {/* Action Bar (List / Row Scannability) */}
                    <div className="flex items-center justify-between border-t border-[#EDE5DA]/70 pt-4 mt-4 flex-wrap gap-3">
                      <Link
                        href={`/city-board/${post.post_id}`}
                        className="inline-flex items-center gap-2 text-xs font-extrabold text-[#8B5E3C] bg-[#FAF7F2] hover:bg-[#8B5E3C] hover:text-white border border-[#EDE5DA] px-4 py-2 rounded-full transition-all"
                        style={{ textDecoration: 'none' }}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{post.reply_count} {post.reply_count === 1 ? 'Reply' : 'Replies'}</span>
                      </Link>

                      <div className="flex items-center gap-3 flex-wrap">
                        {isMine ? (
                          <button
                            onClick={() => handleDeletePost(post.post_id)}
                            className="inline-flex items-center gap-1 text-xs font-extrabold text-rose-600 hover:underline transition-colors cursor-pointer border-none bg-transparent"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => openReportModal(post.post_id)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#8C827A] hover:text-rose-600 transition-colors cursor-pointer border-none bg-transparent"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" /> Flag
                            </button>
                            <button
                              onClick={() => handleBlockUser(post.device_cookie)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#8C827A] hover:text-rose-600 transition-colors cursor-pointer border-none bg-transparent"
                            >
                              <Ban className="w-3.5 h-3.5" /> Block
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/city-board/${post.post_id}`);
                            showToast('Link copied to clipboard ✓');
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-[#8B5E3C] bg-white border border-[#EDE5DA] px-3.5 py-1.5 rounded-full transition-all cursor-pointer"
                          title="Copy link to post"
                        >
                          <Share2 className="w-3.5 h-3.5" /> Share
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        </div>
      </main>

      {/* REPORT MODAL */}
      {reportPostId && (
        <div className="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-xs z-[60] flex items-center justify-center p-4" onClick={() => setReportPostId(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-[#EDE5DA] shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setReportPostId(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 font-bold border-none cursor-pointer">✕</button>
            <h3 className="text-xl font-black text-rose-700 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-700" /> Report Post
            </h3>
            <p className="text-gray-600 text-xs mb-6 font-medium leading-relaxed">Help us keep Lumo Bites clean and safe. Please select a reason for reporting this post:</p>
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <select
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#EDE5DA] rounded-2xl px-4 py-3 text-sm text-[#1F1712] focus:outline-none focus:border-[#8B5E3C] font-medium"
              >
                <option value="Spam">Spam</option>
                <option value="Inappropriate">Inappropriate content</option>
                <option value="Wrong category">Wrong category</option>
                <option value="Other">Other</option>
              </select>
              <button
                type="submit"
                disabled={submittingReport}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3 rounded-2xl transition-all disabled:opacity-50 shadow-sm cursor-pointer border-none text-xs"
              >
                {submittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
