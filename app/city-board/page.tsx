'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow } from 'date-fns';
import MobileCommunityNav from '@/components/MobileCommunityNav';
import MobileFloatingAction from '@/components/MobileFloatingAction';
import {
  MapPin, MessageSquare, AlertTriangle, Share2, RefreshCw, Loader2, Ban, Trash2,
  ArrowBigUp, MessageCircle, Stethoscope, Scissors, PawPrint, Search, Utensils, TreePine,
  GraduationCap, HeartPulse, Heart, ShoppingBag, Camera, Star, Calendar, Flame, Check, Bookmark, PenLine, X,
  ChevronDown, ChevronUp
} from 'lucide-react';
import FacebookStyleCommentThread from '@/components/FacebookStyleCommentThread';
import FacebookReactionPicker from '@/components/FacebookReactionPicker';
import { useScrollLock } from '@/lib/useScrollLock';

const CATEGORY_META: Record<string, { color: string; icon: any }> = {
  'General': { color: 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4]', icon: MessageCircle },
  'Vet Recommendations': { color: 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4]', icon: Stethoscope },
  'Groomers': { color: 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4]', icon: Scissors },
  'Pet Sitters': { color: 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4]', icon: PawPrint },
  'Lost & Found': { color: 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4]', icon: Search },
  'Diet & Nutrition': { color: 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4]', icon: Utensils },
  'Parks & Activities': { color: 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4]', icon: TreePine },
  'Training & Behavior': { color: 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4]', icon: GraduationCap },
  'Pet Health & Wellness': { color: 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4]', icon: HeartPulse },
  'Adoption & Rescue': { color: 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4]', icon: Heart },
  'Product Recommendations': { color: 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4]', icon: ShoppingBag },
  'Show & Tell': { color: 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4]', icon: Camera },
  'New Pet Owners': { color: 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4]', icon: Star },
  'Events & Meetups': { color: 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4]', icon: Calendar },
};

const getCategoryColor = (category: string) => CATEGORY_META[category]?.color || 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4]';
const getCategoryIcon = (category: string) => CATEGORY_META[category]?.icon || MessageCircle;

const CATEGORIES = Object.keys(CATEGORY_META);

export default function CityBoardPage() {
  const [deviceCookie, setDeviceCookie] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [posts, setPosts] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('lumo_city_board_feed_cache');
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('lumo_city_board_feed_cache');
        if (cached && JSON.parse(cached).length > 0) return false;
      } catch (e) {}
    }
    return true;
  });
  const [blockedCookies, setBlockedCookies] = useState<string[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchCategory, setSearchCategory] = useState('All');
  const [searchPostId, setSearchPostId] = useState('');
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [topicsExpanded, setTopicsExpanded] = useState(false);

  // Inline Expandable Comments State
  const [expandedPostIds, setExpandedPostIds] = useState<Record<string, boolean>>({});
  const [postRepliesMap, setPostRepliesMap] = useState<Record<string, any[]>>({});
  const [loadingRepliesMap, setLoadingRepliesMap] = useState<Record<string, boolean>>({});

  const saveNavigationState = (postId?: string) => {
    if (typeof window === 'undefined') return;
    try {
      const stateToSave = {
        searchKeyword,
        searchCity,
        searchCategory,
        showMyPosts,
        expandedPostIds,
        targetPostId: postId,
        scrollY: window.scrollY
      };
      sessionStorage.setItem('lumo_city_board_search_state', JSON.stringify(stateToSave));
    } catch (e) {}
  };

  const toggleExpandPost = async (postId: string) => {
    const isCurrentlyExpanded = !!expandedPostIds[postId];
    setExpandedPostIds(prev => ({ ...prev, [postId]: !isCurrentlyExpanded }));

    if (!isCurrentlyExpanded && !postRepliesMap[postId]) {
      setLoadingRepliesMap(prev => ({ ...prev, [postId]: true }));
      try {
        const res = await fetch(`/api/city-board/replies?post_id=${postId}`);
        const data = await res.json();
        if (data.replies) {
          setPostRepliesMap(prev => ({ ...prev, [postId]: data.replies }));
        }
      } catch (err) {
        console.error('Failed to fetch replies for post:', err);
      } finally {
        setLoadingRepliesMap(prev => ({ ...prev, [postId]: false }));
      }
    }
  };

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

      // Restore city board search and filter state
      try {
        const savedSearch = sessionStorage.getItem('lumo_city_board_search_state');
        if (savedSearch) {
          const parsed = JSON.parse(savedSearch);
          if (parsed.searchKeyword !== undefined) setSearchKeyword(parsed.searchKeyword);
          if (parsed.searchCity !== undefined) setSearchCity(parsed.searchCity);
          if (parsed.searchCategory !== undefined) setSearchCategory(parsed.searchCategory);
          if (parsed.showMyPosts !== undefined) setShowMyPosts(parsed.showMyPosts);
          if (parsed.expandedPostIds) setExpandedPostIds(parsed.expandedPostIds);

          const restoreScroll = () => {
            if (parsed.targetPostId) {
              const el = document.getElementById(`city-post-${parsed.targetPostId}`);
              if (el) {
                el.scrollIntoView({ block: 'nearest', behavior: 'instant' });
                return;
              }
            }
            if (parsed.scrollY !== undefined && parsed.scrollY > 0) {
              window.scrollTo({ top: parsed.scrollY, behavior: 'instant' });
            }
          };

          restoreScroll();
          requestAnimationFrame(restoreScroll);
          setTimeout(restoreScroll, 50);
          setTimeout(restoreScroll, 200);
        }
      } catch (e) {}
    }
  }, []);

  // Sync city board search state to sessionStorage
  useEffect(() => {
    saveNavigationState();
  }, [searchKeyword, searchCity, searchCategory, showMyPosts, expandedPostIds]);

  const toggleSavePost = (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Signed-in requirement check
    if (!userEmail) {
      showToast('Sign in to save discussions to your bookmarks');
      window.dispatchEvent(new Event('lumo-open-signin'));
      return;
    }

    let updated: string[];
    if (savedPostIds.includes(postId)) {
      updated = savedPostIds.filter(id => id !== postId);
      showToast('Removed from your saved bookmarks');
    } else {
      updated = [...savedPostIds, postId];
      showToast('Discussion saved to bookmarks');
    }
    setSavedPostIds(updated);
    if (typeof window !== 'undefined') {
      const savedKey = `lumo_saved_city_board_posts_${userEmail}`;
      localStorage.setItem(savedKey, JSON.stringify(updated));
    }
  };

  const handleSelectCategory = (cat: string) => {
    if (cat === 'Saved' && !userEmail) {
      showToast('Sign in to view your saved discussions');
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

  const postsRef = useRef(posts);
  postsRef.current = posts;

  // Real-time continuous scroll tracker
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let timeoutId: any = null;
    const handleScroll = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (window.scrollY > 0) {
          try {
            const existing = sessionStorage.getItem('lumo_city_board_search_state');
            const parsed = existing ? JSON.parse(existing) : {};
            parsed.scrollY = window.scrollY;
            sessionStorage.setItem('lumo_city_board_search_state', JSON.stringify(parsed));
          } catch (e) {}
        }
      }, 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const fetchPosts = useCallback(async (showRefreshIndicator = false) => {
    const ctx = currentContextRef.current;
    if (!ctx.deviceCookie) return;
    
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else if (postsRef.current.length === 0) {
      setLoading(true);
    }

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
        const fetchedPosts = data.posts || [];
        setPosts(fetchedPosts);
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('lumo_city_board_feed_cache', JSON.stringify(fetchedPosts));
          } catch (e) {}
        }
        // Multi-frame scroll restoration check after network data arrives
        requestAnimationFrame(() => {
          try {
            const saved = sessionStorage.getItem('lumo_city_board_search_state');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed.targetPostId) {
                const el = document.getElementById(`city-post-${parsed.targetPostId}`);
                if (el) {
                  el.scrollIntoView({ block: 'nearest', behavior: 'instant' });
                  return;
                }
              }
              if (parsed.scrollY !== undefined && parsed.scrollY > 0) {
                window.scrollTo({ top: parsed.scrollY, behavior: 'instant' });
              }
            }
          } catch (e) {}
        });
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
        showToast('Discussion posted successfully!');
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
  useScrollLock(!!reportPostId);
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
        showToast('Voted helpful');
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
      className="min-h-screen bg-[#FCFAF8] font-sans flex flex-col relative pt-[52px] md:pt-0"
    >
      <MobileCommunityNav />

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[10000] bg-[#4A3E3D] text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-xl backdrop-blur-md transition-all animate-bounce flex items-center gap-2">
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
            <div className="bg-white rounded-full shadow-md py-2.5 px-4 flex items-center justify-center gap-2 border border-[#E8DDD4] text-[#8B5E3C] font-bold text-xs">
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
        {/* TOPIC NAVIGATION (COLLAPSIBLE WITH DEFAULT COLLAPSED STATE) */}
        <aside className="lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl border border-[#E8DDD4] p-3.5 shadow-xs">
            {/* Header Toggle Button */}
            <button
              type="button"
              onClick={() => setTopicsExpanded(prev => !prev)}
              className="w-full flex items-center justify-between gap-2 text-left cursor-pointer border-none bg-transparent p-0 select-none group/topic"
            >
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="text-[11px] font-bold text-[#8B7E7D] uppercase tracking-wider group-hover/topic:text-[#4A3E3D] transition-colors">
                  {topicsExpanded ? 'Hide Topics' : 'Topics'}
                </span>
                {searchCategory !== 'All' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF6F4] text-[#8B5E3C] border border-[#E8DDD4] truncate max-w-[130px]">
                    {searchCategory === 'Saved' ? 'Saved' : searchCategory}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-[#8B5E3C] flex items-center gap-1 shrink-0 group-hover/topic:underline">
                {topicsExpanded ? (
                  <>
                    <span className="text-[11px] hidden sm:inline">Hide Topics</span>
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span className="text-[11px] hidden sm:inline">Browse Topics</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </span>
            </button>

            {/* Collapsible Topics List */}
            {topicsExpanded && (
              <div className="mt-3 pt-3 border-t border-[#E8DDD4]/80 flex flex-wrap lg:flex-col gap-2 animate-fade-in">
                <button
                  type="button"
                  onClick={() => handleSelectCategory('All')}
                  className={`flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                    searchCategory === 'All'
                      ? 'bg-[#8B5E3C] text-white border-[#8B5E3C] shadow-sm'
                      : 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4] hover:bg-white shadow-2xs'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" /> All Topics
                </button>

                {/* Saved Bookmarks Tab */}
                <button
                  type="button"
                  onClick={() => handleSelectCategory('Saved')}
                  className={`flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                    searchCategory === 'Saved'
                      ? 'bg-[#8B5E3C] text-white border-[#8B5E3C] shadow-sm'
                      : 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4] hover:bg-white shadow-2xs'
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
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className={`flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#8B5E3C] text-white border-[#8B5E3C] shadow-sm'
                          : 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4] hover:bg-white shadow-2xs'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" /> {cat}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 space-y-6">

        {/* COMPOSER CARD (SITE-WIDE CONSISTENT CARD STYLING) */}
        <div id="city-board-composer" className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#E8DDD4]">
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <img src="/Logo.png" alt="Lumo Bites" className="h-6 w-auto object-contain" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B5E3C]">City Board</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#2B231D] tracking-tight">
              Share with your pet community
            </h2>
            <p className="text-sm sm:text-base font-normal text-[#2B231D] leading-relaxed mt-1">Ask questions, share recommendations, or discuss local pet care — completely free.</p>
          </div>

          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-xs font-bold text-[#4A3E3D] uppercase tracking-wider mb-1.5">City Location</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={newCity} 
                    onChange={e => {
                      setNewCity(e.target.value);
                      setNewCityVerified(false);
                    }} 
                    placeholder="e.g. Louisville, KY" 
                    className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] focus:bg-white transition-all font-medium"
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
                  <div className="mt-2 p-2 bg-white border border-[#E8DDD4] rounded-xl shadow-xl absolute z-20 w-full">
                    <p className="text-[10px] font-bold text-[#8B7E7D] mb-1 px-2 uppercase tracking-wider">Select City:</p>
                    {newCityOptions.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setNewCity(opt.clean_city);
                          setNewCityVerified(true);
                          setNewCityOptions([]);
                        }}
                        className="block w-full text-left px-3 py-2 hover:bg-[#FAF6F4] rounded-lg text-xs text-[#4A3E3D] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border-none"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#8B5E3C] shrink-0" /> {opt.formatted_address}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3E3D] uppercase tracking-wider mb-1.5">Topic Category</label>
                <select 
                  value={newCategory} 
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] focus:bg-white transition-all font-medium cursor-pointer"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A3E3D] uppercase tracking-wider mb-1.5">Discussion Content</label>
              <textarea 
                value={newContent} 
                onChange={e => setNewContent(e.target.value)} 
                rows={3} 
                placeholder="What's on your mind? Ask a question or share local pet tips..." 
                className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] focus:bg-white transition-all resize-y font-medium placeholder:text-[#8B7E7D]"
                required
              />
            </div>

            {postError && <div className="text-rose-600 text-xs font-bold px-1">{postError}</div>}
            
            <div className="flex justify-end pt-1">
              <button 
                type="submit" 
                disabled={isPosting} 
                className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold py-3 px-8 rounded-xl text-sm transition-all disabled:opacity-50 shadow-sm hover:shadow-md cursor-pointer border-none"
              >
                {isPosting ? 'Posting...' : 'Post Discussion'}
              </button>
            </div>
          </form>
        </div>

        {/* SEARCH & FILTERS (SITE-WIDE CONSISTENT BAR) */}
        <div className="bg-white rounded-2xl p-3.5 border border-[#E8DDD4] shadow-sm flex flex-col gap-3">
          <div className="flex gap-2.5 w-full overflow-x-auto pb-1 hide-scrollbar">
            <input 
              type="text" 
              placeholder="Search discussions..." 
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-3.5 py-2 text-xs text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] focus:bg-white min-w-[150px] transition-all font-medium"
            />
            <div className="relative min-w-[150px]">
              <input 
                type="text" 
                placeholder="Filter by city..." 
                value={searchCity}
                onChange={e => setSearchCity(e.target.value)}
                className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-3.5 py-2 text-xs text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] focus:bg-white transition-all font-medium"
              />
              {isLocatingSearchCity && (
                <div className="absolute right-2.5 top-2.5">
                  <Loader2 className="animate-spin h-3.5 w-3.5 text-[#8B5E3C]" />
                </div>
              )}
              {searchCityOptions.length > 0 && (
                <div className="mt-1 p-2 bg-white border border-[#E8DDD4] rounded-xl shadow-xl absolute z-20 w-[240px]">
                  <p className="text-[10px] font-bold text-[#8B7E7D] mb-1 px-2 uppercase tracking-wider">Matching City:</p>
                  {searchCityOptions.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSearchCity(opt.clean_city);
                        setSearchCityOptions([]);
                      }}
                      className="block w-full text-left px-3 py-1.5 hover:bg-[#FAF6F4] rounded-lg text-xs text-[#4A3E3D] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border-none"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#8B5E3C] shrink-0" /> {opt.formatted_address}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 px-1 border-t border-[#E8DDD4] pt-2">
            <input 
              type="checkbox" 
              id="my_posts" 
              checked={showMyPosts} 
              onChange={e => setShowMyPosts(e.target.checked)}
              className="w-4 h-4 accent-[#8B5E3C] rounded border-[#E8DDD4]"
            />
            <label htmlFor="my_posts" className="text-xs font-bold text-[#4A3E3D] cursor-pointer whitespace-nowrap">Show only my discussions</label>
          </div>
        </div>

        {/* FEED POST LIST (SKELETON LOADERS & SITE-WIDE CARDS) */}
        <div className="min-h-[500px]">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-white rounded-2xl border border-[#E8DDD4] p-6 shadow-sm animate-pulse space-y-4">
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
          <div className="text-center py-16 text-[#8B7E7D] font-bold text-sm bg-white rounded-2xl border border-[#E8DDD4] shadow-sm">
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
              const isExpanded = !!expandedPostIds[post.post_id];
              const repliesForPost = (postRepliesMap[post.post_id] || []).filter(r => !blockedCookies.includes(r.device_cookie));
              const isLoadingReplies = !!loadingRepliesMap[post.post_id];

              return (
                <div 
                  key={post.id} 
                  id={`city-post-${post.post_id}`}
                  className={`rounded-2xl border transition-all duration-200 relative overflow-hidden bg-white border-[#E8DDD4] shadow-sm hover:shadow-md`}
                >
                  {/* Card Body */}
                  <div className="p-5 sm:p-7">
                    
                    {/* Top Meta Bar */}
                    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Category Badge */}
                        <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md border bg-[#FAF6F4] text-[#8B5E3C] border-[#E8DDD4]">
                          {post.category}
                        </span>

                        {/* City Location */}
                        <span className="text-xs font-semibold text-[#4A3E3D] bg-[#FAF6F4] border border-[#E8DDD4] px-3 py-1 rounded-md flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#8B5E3C]" /> {post.city}
                        </span>

                        {/* Trending Badge */}
                        {isTrending && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md flex items-center gap-1">
                            <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
                            <span>Trending</span>
                          </span>
                        )}

                        {isMine && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#8B5E3C] px-2.5 py-1 rounded-md">
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
                              : 'bg-[#FAF6F4] text-[#8B7E7D] border-[#E8DDD4] hover:text-[#8B5E3C]'
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked && userEmail ? 'fill-white' : ''}`} />
                        </button>

                        {/* Timestamp */}
                        <span className="text-xs text-[#8B7E7D] font-medium">
                          {formatDistanceToNow(new Date(post.created_at))} ago
                        </span>
                      </div>
                    </div>

                    {/* Main Title / Question Treatment (Click expands inline) */}
                    <div 
                      onClick={() => toggleExpandPost(post.post_id)} 
                      className="cursor-pointer group/title"
                    >
                      <h3 className="text-lg sm:text-xl font-extrabold text-[#2B231D] leading-snug tracking-tight mb-2 group-hover/title:text-[#8B5E3C] transition-colors">
                        {post.content}
                      </h3>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between border-t border-[#E8DDD4] pt-4 mt-4 flex-wrap gap-3">
                      {/* Left: Reaction Picker & Expand Comments Indicator */}
                      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                        {/* Facebook Reaction Picker for Post */}
                        <FacebookReactionPicker
                          itemId={post.post_id}
                          initialHelpfulCount={post.helpful_count || 0}
                          size="sm"
                          showSummary={true}
                          minimalHeartStyle={true}
                        />

                        {/* Comment-Count Indicator / Expand Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleExpandPost(post.post_id)}
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                            isExpanded
                              ? 'bg-[#8B5E3C] text-white border-[#8B5E3C] shadow-2xs'
                              : 'bg-[#FAF6F4] text-[#4A3E3D] hover:bg-[#8B5E3C] hover:text-white border-[#E8DDD4]'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>
                            {post.reply_count || 0} {post.reply_count === 1 ? 'Comment' : 'Comments'}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                          )}
                        </button>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {isMine ? (
                          <button
                            onClick={() => handleDeletePost(post.post_id)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline transition-colors cursor-pointer border-none bg-transparent"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => openReportModal(post.post_id)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#8B7E7D] hover:text-rose-600 transition-colors cursor-pointer border-none bg-transparent"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" /> Flag
                            </button>
                            <button
                              onClick={() => handleBlockUser(post.device_cookie)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#8B7E7D] hover:text-rose-600 transition-colors cursor-pointer border-none bg-transparent"
                            >
                              <Ban className="w-3.5 h-3.5" /> Block
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/city-board/${post.post_id}`);
                            showToast('Link copied to clipboard');
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A3E3D] hover:text-[#8B5E3C] bg-[#FAF6F4] border border-[#E8DDD4] px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
                          title="Copy link to post"
                        >
                          <Share2 className="w-3.5 h-3.5" /> Share
                        </button>
                      </div>
                    </div>

                    {/* Inline Expandable Comment Thread Section */}
                    {isExpanded && (
                      <div className="border-t border-[#E8DDD4] pt-5 mt-5 animate-fade-in">
                        {isLoadingReplies ? (
                          <div className="py-8 text-center text-xs text-[#8B5E3C] font-bold flex items-center justify-center gap-2 animate-pulse">
                            <Loader2 className="w-4 h-4 animate-spin" /> Loading comments...
                          </div>
                        ) : (
                          <div>
                            <FacebookStyleCommentThread
                              comments={repliesForPost}
                              currentUserEmail={userEmail}
                              currentUserName={userEmail ? userEmail.split('@')[0] : ''}
                              postAuthorCookie={post.device_cookie}
                              currentUserCookie={deviceCookie}
                              isPostAuthor={post.device_cookie === deviceCookie}
                              title={`Comments (${post.reply_count || repliesForPost.length})`}
                              placeholder="Write a comment..."
                              allowPhoto={false}
                              signInPromptText="Sign in to reply to this discussion"
                              requireAuth={true}
                              onAddComment={async (text, _photo, parentId, replyToName) => {
                                let payloadText = text;
                                if (parentId && replyToName) {
                                  payloadText = `[[reply_to:${parentId}:${replyToName}]] ${text}`;
                                }

                                const res = await fetch('/api/city-board/replies', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    post_id: post.post_id,
                                    content: payloadText,
                                    device_cookie: deviceCookie
                                  })
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.error || 'Failed to post reply');
                                if (data.reply) {
                                  setPostRepliesMap(prev => ({
                                    ...prev,
                                    [post.post_id]: [...(prev[post.post_id] || []), data.reply]
                                  }));
                                  setPosts(prev => prev.map(p => p.post_id === post.post_id ? { ...p, reply_count: (p.reply_count || 0) + 1 } : p));
                                  showToast("Reply posted successfully.");
                                }
                              }}
                              onDeleteComment={async (replyId) => {
                                if (!window.confirm("Are you sure you want to delete this reply?")) return;

                                const res = await fetch('/api/city-board/replies', {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: replyId })
                                });

                                if (!res.ok) {
                                  const data = await res.json();
                                  throw new Error(data.error || 'Failed to delete reply');
                                }

                                setPostRepliesMap(prev => ({
                                  ...prev,
                                  [post.post_id]: (prev[post.post_id] || []).filter(r => r.id !== replyId)
                                }));
                                setPosts(prev => prev.map(p => p.post_id === post.post_id ? { ...p, reply_count: Math.max(0, (p.reply_count || 1) - 1) } : p));
                                showToast("Reply deleted.");
                              }}
                              onBlockUser={handleBlockUser}
                            />

                            <div className="pt-3 text-center">
                              <button
                                type="button"
                                onClick={() => toggleExpandPost(post.post_id)}
                                className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer border-none bg-transparent"
                              >
                                ▲ Hide comments
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>

        </div>
      </main>

      {/* REPORT MODAL */}
      {reportPostId && (
        <div className="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-xs z-[60] flex items-center justify-center p-4" onClick={() => setReportPostId(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-[#E8DDD4] shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setReportPostId(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#FAF6F4] text-[#4A3E3D] font-bold border border-[#E8DDD4] cursor-pointer" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-xl font-bold text-rose-700 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-700" /> Report Post
            </h3>
            <p className="text-[#8B7E7D] text-xs mb-6 font-medium leading-relaxed">Help us keep Lumo Bites clean and safe. Please select a reason for reporting this post:</p>
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <select
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] font-medium"
              >
                <option value="Spam">Spam</option>
                <option value="Inappropriate">Inappropriate content</option>
                <option value="Wrong category">Wrong category</option>
                <option value="Other">Other</option>
              </select>
              <button
                type="submit"
                disabled={submittingReport}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 shadow-sm cursor-pointer border-none text-xs"
              >
                {submittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Mobile Floating Action Button for One-Handed Thumb Reach */}
      <MobileFloatingAction bottomOffset="92px">
        <button
          type="button"
          onClick={() => {
            const composer = document.getElementById('city-board-composer');
            if (composer) {
              composer.scrollIntoView({ behavior: 'smooth', block: 'center' });
              const textarea = composer.querySelector('textarea');
              if (textarea) textarea.focus();
            }
          }}
          className="pressable flex items-center gap-2 bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-bold text-xs py-3 px-4 rounded-full shadow-xl border border-white/25 active:scale-95 transition-transform select-none cursor-pointer"
          aria-label="New Discussion"
        >
          <PenLine className="w-4 h-4" />
          <span>New Post</span>
        </button>
      </MobileFloatingAction>
      </div>
    </div>
  );
}
