'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow } from 'date-fns';
import {
  MapPin, MessageSquare, AlertTriangle, Share2, PenLine, Ban, Trash2, PawPrint, ChevronDown, ArrowUpDown,
  ArrowBigUp, MessageCircle, Stethoscope, Scissors, Search, Utensils, TreePine,
  GraduationCap, HeartPulse, Heart, ShoppingBag, Camera, Star, Calendar, ArrowLeft, Bookmark
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

const AVATAR_COLORS = [
  { bg: '#FEE2E2', text: '#991B1B' },
  { bg: '#D1FAE5', text: '#065F46' },
  { bg: '#E0E7FF', text: '#3730A3' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#CCFBF1', text: '#115E59' },
  { bg: '#FFEDD5', text: '#9A3412' },
  { bg: '#E0F2FE', text: '#075985' },
  { bg: '#F5E6DA', text: '#6E4225' },
];

const getAvatarColor = (cookie: string) => {
  if (!cookie) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < cookie.length; i++) {
    hash = (hash * 31 + cookie.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const REPLIES_PAGE_SIZE = 10;

export default function CityBoardPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [deviceCookie, setDeviceCookie] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [post, setPost] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockedCookies, setBlockedCookies] = useState<string[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Touch Swipe Back Handlers
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartYRef.current);

    // If swiping right from left edge (deltaX > 75px) with low vertical movement (deltaY < 50px)
    if (touchStartXRef.current < 60 && deltaX > 75 && deltaY < 50) {
      router.back();
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
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

  const toggleSavePost = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!post) return;

    // STRICT CHECK: Gated exclusively to signed-in users
    if (!userEmail) {
      showToast('Sign in to save discussions to your bookmarks 🔖');
      window.dispatchEvent(new Event('lumo-open-signin'));
      return;
    }

    let updated: string[];
    if (savedPostIds.includes(post.post_id)) {
      updated = savedPostIds.filter(id => id !== post.post_id);
      showToast('Removed from your saved bookmarks');
    } else {
      updated = [...savedPostIds, post.post_id];
      showToast('Discussion saved to bookmarks 🔖');
    }
    setSavedPostIds(updated);
    if (typeof window !== 'undefined') {
      const savedKey = `lumo_saved_city_board_posts_${userEmail}`;
      localStorage.setItem(savedKey, JSON.stringify(updated));
    }
  };

  const handleBlockUser = (cookieToBlock: string) => {
    if (!cookieToBlock) return;
    if (cookieToBlock === deviceCookie) {
      showToast("You cannot block yourself.");
      return;
    }
    if (!window.confirm("Are you sure you want to block this user? You will no longer see their posts or replies.")) return;

    const nextBlocked = [...blockedCookies, cookieToBlock];
    setBlockedCookies(nextBlocked);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lumo_blocked_device_cookies', JSON.stringify(nextBlocked));
    }
    showToast("User blocked successfully.");
    router.push('/city-board');
  };

  const handleDeletePost = async () => {
    if (!post) return;
    if (!window.confirm("Are you sure you want to delete this post? This will also delete all replies and cannot be undone.")) return;
    try {
      const res = await fetch('/api/city-board/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.post_id, device_cookie: deviceCookie })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete post');
      }
      showToast("Post deleted successfully.");
      router.push('/city-board');
    } catch (err: any) {
      showToast(err.message || "Failed to delete post.");
    }
  };

  const [newReply, setNewReply] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [replySort, setReplySort] = useState<'newest' | 'oldest'>('oldest');
  const [visibleRepliesCount, setVisibleRepliesCount] = useState(REPLIES_PAGE_SIZE);

  useEffect(() => {
    let cookie = localStorage.getItem('lumo_city_board_cookie');
    if (!cookie) {
      cookie = uuidv4();
      localStorage.setItem('lumo_city_board_cookie', cookie);
    }
    setDeviceCookie(cookie);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const postRes = await fetch(`/api/city-board/posts?post_id=${postId}&device_cookie=${deviceCookie}`);
      if (postRes.ok) {
        const postData = await postRes.json();
        const foundPost = postData.posts.find((p: any) => p.post_id === postId);
        if (foundPost) {
          setPost(foundPost);
        } else {
          setPost(null);
        }
      }

      const repliesRes = await fetch(`/api/city-board/replies?post_id=${postId}`);
      if (repliesRes.ok) {
        const repliesData = await repliesRes.json();
        setReplies(repliesData.replies || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId && deviceCookie) {
      fetchData();
    }
  }, [postId, deviceCookie]);

  const handleMarkHelpful = async (postId: string) => {
    if (!deviceCookie || !post) return;
    try {
      const res = await fetch('/api/city-board/helpful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, device_cookie: deviceCookie })
      });
      if (res.ok) {
        setPost((prev: any) => ({
          ...prev,
          helpful_count: (prev.helpful_count || 0) + 1,
          voted_helpful: true
        }));
        showToast('Voted helpful! 👍');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to vote helpful');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim() || !deviceCookie) return;
    setIsReplying(true);
    setReplyError('');
    try {
      const res = await fetch('/api/city-board/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          device_cookie: deviceCookie,
          reply_content: newReply
        })
      });
      if (res.ok) {
        const data = await res.json();
        setNewReply('');
        showToast('Reply posted! 💬');
        // Dynamic Reply Counter Update
        setPost((prev: any) => prev ? { ...prev, reply_count: (prev.reply_count || 0) + 1 } : prev);
        if (data.reply) {
          setReplies(prev => [...prev, data.reply]);
        } else {
          fetchData();
        }
      } else {
        const err = await res.json();
        setReplyError(err.error || 'Failed to post reply');
      }
    } catch (e) {
      setReplyError('An error occurred.');
    } finally {
      setIsReplying(false);
    }
  };

  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('Spam');
  const [submittingReport, setSubmittingReport] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] font-sans flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full border border-[#EDE5DA] shadow-xs animate-pulse text-center space-y-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded-full w-3/4 mx-auto"></div>
          <div className="h-3 bg-gray-100 rounded-full w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] font-sans flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-[#EDE5DA] shadow-xs">
          <h2 className="text-xl font-black text-[#1F1712] mb-2">Discussion Not Found</h2>
          <p className="text-gray-500 text-xs mb-6 font-medium">This post may have been deleted or removed.</p>
          <Link
            href="/city-board"
            className="inline-flex items-center justify-center gap-2 bg-[#8B5E3C] text-white font-extrabold px-6 py-3 rounded-full text-xs"
            style={{ textDecoration: 'none' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to City Board
          </Link>
        </div>
      </div>
    );
  }

  const isBookmarked = savedPostIds.includes(post.post_id);

  return (
    <div 
      className="min-h-screen bg-[#FAF7F2] font-sans flex flex-col pt-4 pb-16 relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[10000] bg-gray-900/95 text-white text-xs font-extrabold px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md transition-all animate-bounce">
          {toastMessage}
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-4 w-full">
        
        {/* Back Link with Swipe Hint */}
        <div className="flex items-center justify-between mb-5">
          <Link
            href="/city-board"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-[#8B5E3C] hover:text-[#734A2E] transition-colors"
            style={{ textDecoration: 'none' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Discussions
          </Link>
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest hidden sm:inline-block">
            👉 Swipe right to go back
          </span>
        </div>

        {/* MAIN POST CARD (23ANDME CLEAN CARD SYSTEM) */}
        <div className="bg-white rounded-3xl border border-[#EDE5DA] shadow-xs mb-8 overflow-hidden flex gap-0">
          
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

          <div className="flex-1 min-w-0 p-6 sm:p-8 relative">
            {post.device_cookie === deviceCookie && (
              <div className="absolute top-6 right-6 bg-[#8B5E3C] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-2xs">
                Your Post
              </div>
            )}

            {/* Badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap pr-16">
              <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border ${getCategoryColor(post.category)}`}>
                {post.category}
              </span>
              <span className="text-xs font-extrabold text-[#1F1712] bg-[#FAF7F2] border border-[#EDE5DA] px-3 py-1 rounded-full flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#8B5E3C]" /> {post.city}
              </span>
              <span className="text-xs text-[#8C827A] font-medium ml-auto">
                {formatDistanceToNow(new Date(post.created_at))} ago
              </span>
            </div>

            {/* Title / Post Content */}
            <h1 className="text-xl sm:text-2xl font-black text-[#1F1712] leading-snug tracking-tight mb-6 whitespace-pre-wrap">
              {post.content}
            </h1>

            {/* Action Row */}
            <div className="flex items-center justify-between border-t border-[#EDE5DA] pt-4 mt-4 flex-wrap gap-4">
              {/* Bookmark Toggle - Signed-in Gated */}
              <button
                type="button"
                onClick={toggleSavePost}
                title={!userEmail ? 'Sign in to save discussions' : isBookmarked ? 'Remove bookmark' : 'Bookmark discussion'}
                className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-4 py-2 rounded-full border transition-all cursor-pointer ${
                  isBookmarked && userEmail 
                    ? 'bg-[#8B5E3C] text-white border-[#8B5E3C]' 
                    : 'bg-[#FAF7F2] text-gray-700 border-[#EDE5DA] hover:border-[#8B5E3C]'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked && userEmail ? 'fill-white' : ''}`} />
                <span>{isBookmarked && userEmail ? 'Bookmarked' : 'Save Discussion'}</span>
              </button>

              <div className="flex items-center gap-3 flex-wrap">
                {post.device_cookie === deviceCookie ? (
                  <button
                    onClick={handleDeletePost}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-600 hover:underline transition-colors cursor-pointer border-none bg-transparent"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Discussion
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
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-[#8B5E3C] bg-[#FAF7F2] border border-[#EDE5DA] px-4 py-2 rounded-full transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" /> Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* REPLIES SECTION (NOTIFICATION-LIST ROW SCANNABILITY) */}
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-lg font-black text-[#1F1712] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#8B5E3C]" /> Replies ({post.reply_count || replies.length})
          </h3>
          {replies.length > 1 && (
            <button
              onClick={() => setReplySort(prev => prev === 'oldest' ? 'newest' : 'oldest')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#8B5E3C] bg-white border border-[#EDE5DA] px-3.5 py-1.5 rounded-full shadow-2xs transition-all cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {replySort === 'oldest' ? 'Oldest first' : 'Newest first'}
            </button>
          )}
        </div>

        {/* Replies List */}
        {(() => {
          const visibleReplies = replies
            .filter(reply => !blockedCookies.includes(reply.device_cookie))
            .sort((a, b) => {
              const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
              return replySort === 'oldest' ? diff : -diff;
            });
          const shown = visibleReplies.slice(0, visibleRepliesCount);
          const remaining = visibleReplies.length - shown.length;

          return (
            <div className="mb-8 space-y-3">
              {shown.length > 0 && shown.map(reply => {
                const avatarColor = getAvatarColor(reply.device_cookie);
                const isOP = reply.device_cookie === post.device_cookie;
                const isYou = reply.device_cookie === deviceCookie;

                return (
                  <div key={reply.id} className="bg-white rounded-2xl p-5 border border-[#EDE5DA] shadow-2xs flex gap-3 sm:gap-4 items-start">
                    
                    {/* Avatar Icon (Scannable Notification Row) */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-2xs mt-0.5"
                      style={{ backgroundColor: avatarColor.bg }}
                    >
                      <PawPrint className="w-4.5 h-4.5" style={{ color: avatarColor.text }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name & Timestamp Header */}
                      <div className="flex justify-between items-center mb-1.5 gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-xs text-[#1F1712]">
                            {isOP ? 'Original Poster' : 'Community Member'}
                          </span>

                          {isOP && (
                            <span className="bg-[#8B5E3C] text-white px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold">OP</span>
                          )}
                          {isYou && (
                            <span className="bg-[#FAF7F2] text-[#8B5E3C] px-2 py-0.5 rounded-full border border-[#EDE5DA] text-[9px] uppercase tracking-wider font-extrabold">You</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {!isYou && (
                            <button
                              onClick={() => handleBlockUser(reply.device_cookie)}
                              className="text-gray-400 hover:text-rose-600 text-[10px] uppercase font-extrabold tracking-wider cursor-pointer border-none bg-transparent"
                            >
                              Block
                            </button>
                          )}
                          <span className="text-xs text-[#8C827A] font-medium">{formatDistanceToNow(new Date(reply.created_at))} ago</span>
                        </div>
                      </div>

                      {/* Reply Text */}
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-normal">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                );
              })}

              {remaining > 0 && (
                <button
                  onClick={() => setVisibleRepliesCount(c => c + REPLIES_PAGE_SIZE)}
                  className="w-full flex items-center justify-center gap-2 text-xs font-extrabold text-[#8B5E3C] bg-white border border-[#EDE5DA] hover:bg-[#FAF7F2] py-3 rounded-2xl shadow-2xs transition-all cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                  Show {Math.min(remaining, REPLIES_PAGE_SIZE)} more {remaining === 1 ? 'reply' : 'replies'}
                </button>
              )}

              {shown.length === 0 && (
                <div className="bg-white rounded-3xl p-8 border border-[#EDE5DA] shadow-xs text-center flex flex-col items-center justify-center">
                  <PenLine className="w-8 h-8 text-gray-300 mb-3" />
                  <p className="text-gray-500 text-xs font-bold">No replies yet. Be the first to join the conversation!</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* REPLY COMPOSER FORM */}
        <div className="bg-white rounded-3xl p-6 border border-[#EDE5DA] shadow-xs">
          {!userEmail ? (
            <div className="text-center py-6">
              <p className="text-gray-600 text-xs mb-3 font-medium">Sign in to reply to this discussion</p>
              <button
                onClick={() => window.dispatchEvent(new Event('lumo-open-signin'))}
                className="bg-[#8B5E3C] text-white px-6 py-2.5 rounded-full text-xs font-extrabold cursor-pointer border-none shadow-xs"
              >
                Sign In — It&apos;s Free
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateReply}>
              <textarea 
                value={newReply}
                onChange={e => setNewReply(e.target.value)}
                rows={3}
                placeholder="Write your reply to this thread..."
                className="w-full bg-[#FAF7F2] border border-[#EDE5DA] rounded-2xl p-4 text-sm text-[#1F1712] focus:outline-none focus:border-[#8B5E3C] focus:bg-white transition-all mb-3 font-medium placeholder:text-[#8C827A]"
                required
              />
              {replyError && (
                <div className="text-rose-600 text-xs font-bold mb-3 px-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  {replyError}
                </div>
              )}
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={isReplying} 
                  className="bg-[#8B5E3C] hover:bg-[#734A2E] text-white font-extrabold py-2.5 px-7 rounded-full text-xs transition-all disabled:opacity-50 shadow-xs cursor-pointer border-none"
                >
                  {isReplying ? 'Posting...' : 'Post Reply'}
                </button>
              </div>
            </form>
          )}
        </div>

      </main>

      {/* REPORT MODAL */}
      {reportPostId && (
        <div className="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-xs z-[60] flex items-center justify-center p-4" onClick={() => setReportPostId(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-[#EDE5DA] shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setReportPostId(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 font-bold border-none cursor-pointer">✕</button>
            <h3 className="text-xl font-black text-rose-700 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-700" /> Report Discussion
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
  );
}
