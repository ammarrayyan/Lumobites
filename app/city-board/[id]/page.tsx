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

const AVATAR_COLORS = [
  { bg: '#FEE2E2', text: '#991B1B' },
  { bg: '#D1FAE5', text: '#065F46' },
  { bg: '#E0E7FF', text: '#3730A3' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#CCFBF1', text: '#115E59' },
  { bg: '#FFEDD5', text: '#9A3412' },
  { bg: '#E0F2FE', text: '#075985' },
  { bg: '#FAF6F4', text: '#8B5E3C' },
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

    // Signed-in requirement check
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
  useScrollLock(!!reportPostId);
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
      <div className="min-h-screen bg-[#FCFAF8] font-sans flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full border border-[#E8DDD4] shadow-sm animate-pulse text-center space-y-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded-full w-3/4 mx-auto"></div>
          <div className="h-3 bg-gray-100 rounded-full w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#FDFAF7] font-sans flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center border border-[#E8DDD4] shadow-sm">
          <h2 className="text-xl font-bold text-[#4A3E3D] mb-2">Discussion Not Found</h2>
          <p className="text-[#8B7E7D] text-xs mb-6 font-medium">This post may have been deleted or removed.</p>
          <Link
            href="/city-board"
            className="inline-flex items-center justify-center gap-2 bg-[#8B5E3C] text-white font-bold px-6 py-3 rounded-xl text-xs"
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
      className="min-h-screen bg-[#FCFAF8] font-sans flex flex-col pt-4 pb-16 relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[10000] bg-[#4A3E3D] text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-xl backdrop-blur-md transition-all animate-bounce flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-4 w-full">
        
        {/* Back Link with Swipe Hint */}
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/city-board');
              }
            }}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#8B5E3C] hover:text-[#734A2E] transition-colors cursor-pointer bg-transparent border-0 p-0"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Discussions
          </button>
          <span className="text-[10px] font-bold text-[#8B7E7D] uppercase tracking-wider hidden sm:inline-block">
            👉 Swipe right to go back
          </span>
        </div>

        {/* MAIN POST CARD (SITE-WIDE CONSISTENT CARD STYLING) */}
        <div className="bg-white rounded-2xl border border-[#E8DDD4] shadow-sm mb-8 overflow-hidden">
          <div className="p-6 sm:p-8 relative">
            {post.device_cookie === deviceCookie && (
              <div className="absolute top-6 right-6 bg-[#8B5E3C] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md">
                Your Post
              </div>
            )}

            {/* Badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap pr-16">
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md border bg-[#FAF6F4] text-[#8B5E3C] border-[#E8DDD4]">
                {post.category}
              </span>
              <span className="text-xs font-semibold text-[#4A3E3D] bg-[#FAF6F4] border border-[#E8DDD4] px-3 py-1 rounded-md flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#8B5E3C]" /> {post.city}
              </span>
              <span className="text-xs text-[#8B7E7D] font-medium ml-auto">
                {formatDistanceToNow(new Date(post.created_at))} ago
              </span>
            </div>

            {/* Title / Post Content */}
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#2B231D] leading-snug tracking-tight mb-6 whitespace-pre-wrap">
              {post.content}
            </h1>

            {/* Action Row */}
            <div className="flex items-center justify-between border-t border-[#E8DDD4] pt-4 mt-4 flex-wrap gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Facebook Reaction Picker */}
                <FacebookReactionPicker
                  itemId={post.post_id}
                  initialHelpfulCount={post.helpful_count || 0}
                  size="md"
                  showSummary={true}
                />

                {/* Bookmark Toggle - Signed-in Gated */}
                <button
                  type="button"
                  onClick={toggleSavePost}
                  title={!userEmail ? 'Sign in to save discussions' : isBookmarked ? 'Remove bookmark' : 'Bookmark discussion'}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    isBookmarked && userEmail 
                      ? 'bg-[#8B5E3C] text-white border-[#8B5E3C] shadow-2xs' 
                      : 'bg-[#FAF6F4] text-[#4A3E3D] border-[#E8DDD4] hover:border-[#8B5E3C]'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isBookmarked && userEmail ? 'fill-white' : ''}`} />
                  <span>{isBookmarked && userEmail ? 'Bookmarked' : 'Save'}</span>
                </button>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {post.device_cookie === deviceCookie ? (
                  <button
                    onClick={handleDeletePost}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:underline transition-colors cursor-pointer border-none bg-transparent"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Discussion
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
                    showToast('Link copied to clipboard ✓');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A3E3D] hover:text-[#8B5E3C] bg-white border border-[#E8DDD4] px-4 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5" /> Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Facebook-style Discussion Replies Section */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#E8DDD4] shadow-sm mb-8">
          <FacebookStyleCommentThread
            comments={replies.filter(r => !blockedCookies.includes(r.device_cookie))}
            currentUserEmail={userEmail}
            currentUserName={userEmail ? userEmail.split('@')[0] : ''}
            postAuthorCookie={post.device_cookie}
            currentUserCookie={deviceCookie}
            isPostAuthor={post.device_cookie === deviceCookie}
            title={`Replies (${post.reply_count || replies.length})`}
            placeholder="Write a reply..."
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
                setReplies(prev => [...prev, data.reply]);
                setPost((prev: any) => prev ? { ...prev, reply_count: (prev.reply_count || 0) + 1 } : prev);
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

              setReplies(prev => prev.filter(r => r.id !== replyId));
              setPost((prev: any) => prev ? { ...prev, reply_count: Math.max(0, (prev.reply_count || 1) - 1) } : prev);
              showToast("Reply deleted.");
            }}
            onBlockUser={handleBlockUser}
          />
        </div>

      </main>

      {/* REPORT MODAL */}
      {reportPostId && (
        <div className="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-xs z-[60] flex items-center justify-center p-4" onClick={() => setReportPostId(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-[#E8DDD4] shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setReportPostId(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#FAF6F4] text-[#4A3E3D] font-bold border border-[#E8DDD4] cursor-pointer">✕</button>
            <h3 className="text-xl font-bold text-rose-700 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-700" /> Report Discussion
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
    </div>
  );
}
