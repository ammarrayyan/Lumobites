'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow } from 'date-fns';
import {
  MapPin, MessageSquare, AlertTriangle, Share2, PenLine, Ban, Trash2, PawPrint, ChevronDown, ArrowUpDown,
  ArrowBigUp, MessageCircle, Stethoscope, Scissors, Search, Utensils, TreePine,
  GraduationCap, HeartPulse, Heart, ShoppingBag, Camera, Star, Calendar
} from 'lucide-react';

// Same category metadata as the feed page (app/city-board/page.tsx) — kept in sync manually,
// matching this codebase's existing per-page convention for category/avatar helpers.
const CATEGORY_META: Record<string, { color: string; icon: any }> = {
  'General': { color: 'bg-[#E8DDD4] text-[#3B2410] border-[#3B2410]/20', icon: MessageCircle },
  'Vet Recommendations': { color: 'bg-[#E1E8D5] text-[#2C3B1E] border-[#2C3B1E]/20', icon: Stethoscope },
  'Groomers': { color: 'bg-[#F5E6DA] text-[#6E4225] border-[#6E4225]/20', icon: Scissors },
  'Pet Sitters': { color: 'bg-[#E6E2F0] text-[#3A2C5C] border-[#3A2C5C]/20', icon: PawPrint },
  'Lost & Found': { color: 'bg-[#F2D5D5] text-[#7A2222] border-[#7A2222]/20', icon: Search },
  'Diet & Nutrition': { color: 'bg-[#FFF3CD] text-[#664D03] border-[#664D03]/20', icon: Utensils },
  'Parks & Activities': { color: 'bg-[#E2EBEB] text-[#234A4A] border-[#234A4A]/20', icon: TreePine },
  'Training & Behavior': { color: 'bg-[#D9E2E8] text-[#2B3D45] border-[#2B3D45]/20', icon: GraduationCap },
  'Pet Health & Wellness': { color: 'bg-[#EADBCE] text-[#5C4533] border-[#5C4533]/20', icon: HeartPulse },
  'Adoption & Rescue': { color: 'bg-[#F5D5E0] text-[#7A2255] border-[#7A2255]/20', icon: Heart },
  'Product Recommendations': { color: 'bg-[#DCEAF7] text-[#1E4E70] border-[#1E4E70]/20', icon: ShoppingBag },
  'Show & Tell': { color: 'bg-[#FDE8CE] text-[#8A5A1E] border-[#8A5A1E]/20', icon: Camera },
  'New Pet Owners': { color: 'bg-[#E3F0E1] text-[#2D5A3D] border-[#2D5A3D]/20', icon: Star },
  'Events & Meetups': { color: 'bg-[#EDE0F5] text-[#4A2E6B] border-[#4A2E6B]/20', icon: Calendar },
};

const getCategoryColor = (category: string) => CATEGORY_META[category]?.color || 'bg-[#FAF6F4] text-[#3B2410] border-[#3B2410]/20';
const getCategoryIcon = (category: string) => CATEGORY_META[category]?.icon || MessageCircle;

// Deterministic per-anonymous-poster avatar color, drawn from the same palette
// used for category pills so it stays visually consistent with the rest of the page.
const AVATAR_COLORS = [
  { bg: '#F2D5D5', text: '#7A2222' },
  { bg: '#E1E8D5', text: '#2C3B1E' },
  { bg: '#E6E2F0', text: '#3A2C5C' },
  { bg: '#FFF3CD', text: '#664D03' },
  { bg: '#E2EBEB', text: '#234A4A' },
  { bg: '#F5E6DA', text: '#6E4225' },
  { bg: '#D9E2E8', text: '#2B3D45' },
  { bg: '#EADBCE', text: '#5C4533' },
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('lumo_pro_email') || localStorage.getItem('lumo_sitter_email') || '';
      setUserEmail(email);
      const blocked = localStorage.getItem('lumo_blocked_device_cookies');
      if (blocked) {
        try {
          setBlockedCookies(JSON.parse(blocked));
        } catch (e) {}
      }
    }
  }, []);

  const handleBlockUser = (cookieToBlock: string) => {
    if (!cookieToBlock) return;
    if (cookieToBlock === deviceCookie) {
      alert("You cannot block yourself.");
      return;
    }
    if (!window.confirm("Are you sure you want to block this user? You will no longer see their posts or replies.")) return;

    const nextBlocked = [...blockedCookies, cookieToBlock];
    setBlockedCookies(nextBlocked);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lumo_blocked_device_cookies', JSON.stringify(nextBlocked));
    }
    alert("User blocked successfully.");
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
      alert("Post deleted successfully.");
      router.push('/city-board');
    } catch (err: any) {
      alert(err.message || "Failed to delete post. Please try again.");
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
      // Fetch post details (by post_id) with device_cookie passed for helpful vote check
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

      // Fetch replies
      const repliesRes = await fetch(`/api/city-board/replies?post_id=${postId}`);
      if (repliesRes.ok) {
        const repliesData = await repliesRes.json();
        setReplies(repliesData.replies || []);
      }
    } catch (e) {
      console.error('Failed to fetch data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId && deviceCookie) {
      fetchData();
    }
  }, [postId, deviceCookie]);

  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim()) return;
    setIsReplying(true);
    setReplyError('');

    try {
      const res = await fetch('/api/city-board/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          content: newReply,
          device_cookie: deviceCookie
        })
      });

      if (res.ok) {
        setNewReply('');
        fetchData();
      } else {
        const err = await res.json();
        setReplyError(err.error || 'Failed to post reply');
      }
    } catch (e) {
      setReplyError('An unexpected error occurred.');
    } finally {
      setIsReplying(false);
    }
  };

  // States & Modals for Helpful and Report features

  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('Spam');
  const [submittingReport, setSubmittingReport] = useState(false);

  const handleMarkHelpful = async (postIdToVote: string) => {
    if (!deviceCookie) return;
    try {
      const res = await fetch('/api/city-board/helpful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postIdToVote, device_cookie: deviceCookie })
      });
      if (res.ok) {
        setPost((prev: any) => ({
          ...prev,
          helpful_count: (prev.helpful_count || 0) + 1,
          voted_helpful: true
        }));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to vote helpful');
      }
    } catch (e) {
      console.error(e);
    }
  };



  const openReportModal = (postIdToReport: string) => {
    setReportPostId(postIdToReport);
    setReportReason('Spam');
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportPostId || !deviceCookie) return;
    setSubmittingReport(true);
    try {
      const userEmail = (typeof window !== 'undefined' && localStorage.getItem('lumo_pro_email')) || 'anonymous@lumobites.net';
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reported_by_email: userEmail,
          reporter_email: userEmail,
          reported_email: 'anonymous@lumobites.net',
          reported_type: 'city_board',
          post_id: reportPostId,
          post_type: 'city_board',
          reason: reportReason,
          status: 'pending'
        })
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

  if (loading) {
    return <div className="min-h-screen bg-[#FDFAF7] flex items-center justify-center font-bold text-[#8B7E7D]">Loading...</div>;
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#FDFAF7] p-8 text-center">
        <h1 className="text-2xl font-black text-[#4A3E3D] mb-4">Post not found</h1>
        <Link href="/city-board" className="text-[#8B5E3C] font-bold hover:underline">← Back to City Board</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] font-sans">
      
      <main className="max-w-3xl mx-auto px-4 py-8">
        
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/city-board" className="inline-flex items-center gap-2 text-[#8B5E3C] font-bold hover:bg-[#8B5E3C] hover:text-white transition-all bg-white px-5 py-2.5 rounded-full shadow-sm border border-[#3B2410]/10 text-sm w-fit">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to City Board
          </Link>
        </div>
        
        {/* OP Post */}
        <div className="flex gap-0 bg-gradient-to-br from-[#FFFDF9] to-[#FAF6F4] rounded-3xl border border-[#3B2410]/12 shadow-[0_4px_20px_rgba(59,36,16,0.03)] mb-8 relative overflow-hidden">
          {/* Vote column — Reddit-style single upvote (this app has no downvote) */}
          <div className="flex flex-col items-center justify-start gap-1 py-6 px-3 sm:px-4 bg-[#3B2410]/[0.03] shrink-0">
            <button
              onClick={() => handleMarkHelpful(post.post_id)}
              disabled={post.voted_helpful}
              title="Mark as helpful"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                post.voted_helpful
                  ? 'bg-[#8B5E3C] text-white shadow-inner cursor-not-allowed'
                  : 'bg-white text-[#3B2410]/60 border border-[#3B2410]/15 hover:bg-[#FAF6F4] hover:text-[#8B5E3C] hover:border-[#8B5E3C]/40 cursor-pointer'
              }`}
            >
              <ArrowBigUp className="w-5 h-5" fill={post.voted_helpful ? 'currentColor' : 'none'} />
            </button>
            <span className={`text-sm font-black ${post.voted_helpful ? 'text-[#8B5E3C]' : 'text-[#3B2410]'}`}>
              {post.helpful_count || 0}
            </span>
            <span className="text-[9px] text-[#3B2410]/40 font-bold uppercase tracking-wide hidden sm:block">Helpful</span>
          </div>

          <div className="flex-1 min-w-0 p-6 md:p-8">
          {post.device_cookie === deviceCookie && (
            <div className="absolute top-4 right-4 bg-[#3B2410] text-[#FFFDF9] text-[10px] font-black uppercase tracking-[0.15em] px-3.5 py-1 rounded-full shadow-sm">
              You
            </div>
          )}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="text-sm font-black text-[#3B2410] bg-[#FAF6F4] border border-[#3B2410]/15 px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#3B2410]/70" /> {post.city}
            </span>
            <span className={`text-sm font-black px-3 py-1.5 rounded-xl border shadow-sm flex items-center gap-1.5 ${getCategoryColor(post.category)}`}>
              {(() => { const Icon = getCategoryIcon(post.category); return <Icon className="w-4 h-4" />; })()}
              {post.category}
            </span>
            <span className="text-sm text-[#3B2410]/50 ml-auto font-medium">{formatDistanceToNow(new Date(post.created_at))} ago</span>
          </div>
          <p className="text-[#3B2410] whitespace-pre-wrap text-lg md:text-xl font-medium leading-relaxed">{post.content}</p>

          <div className="flex items-center justify-end border-t border-[#3B2410]/10 pt-5 mt-6 flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              {post.device_cookie === deviceCookie ? (
                <button
                  onClick={handleDeletePost}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:underline transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Post
                </button>
              ) : (
                <>
                  <button
                    onClick={() => openReportModal(post.post_id)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#3B2410]/50 hover:text-red-600 hover:underline transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Flag Post
                  </button>
                  <button
                    onClick={() => handleBlockUser(post.device_cookie)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#3B2410]/50 hover:text-red-600 hover:underline transition-colors cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" /> Block Poster
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/city-board/${post.post_id}`);
                  alert('Link copied to clipboard!');
                }}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#3B2410] bg-white border border-[#3B2410]/15 px-5 py-2.5 rounded-full shadow-sm hover:bg-[#FAF6F4] hover:border-[#3B2410]/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-[#3B2410]" /> Copy Share Link
              </button>
            </div>
          </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-5 pl-2 pr-1 flex-wrap gap-2">
          <h3 className="text-xl font-black text-[#3B2410] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#3B2410]" /> Replies ({replies.length})
          </h3>
          {replies.length > 1 && (
            <button
              onClick={() => setReplySort(prev => prev === 'oldest' ? 'newest' : 'oldest')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3B2410]/60 hover:text-[#3B2410] bg-white border border-[#3B2410]/10 px-3 py-1.5 rounded-full shadow-sm hover:border-[#3B2410]/25 transition-all cursor-pointer"
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
            <div className="mb-8">
              {shown.length > 0 && (
                <div className="relative ml-5 md:ml-9">
                  {/* Continuous thread rail connecting all replies back to the post */}
                  <div className="absolute -left-5 md:-left-9 top-0 bottom-6 w-0 border-l-2 border-[#3B2410]/10"></div>

                  <div className="space-y-3">
                    {shown.map(reply => {
                      const avatarColor = getAvatarColor(reply.device_cookie);
                      const isOP = reply.device_cookie === post.device_cookie;
                      const isYou = reply.device_cookie === deviceCookie;
                      return (
                        <div key={reply.id} className="relative flex gap-3">
                          <div className="absolute -left-5 md:-left-9 top-6 w-5 md:w-9 border-t-2 border-[#3B2410]/10 rounded-bl-lg"></div>
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm"
                            style={{ backgroundColor: avatarColor.bg }}
                          >
                            <PawPrint className="w-4 h-4" style={{ color: avatarColor.text }} />
                          </div>
                          <div className="flex-1 bg-[#FFFBF5] rounded-2xl p-5 border border-[#3B2410]/10 shadow-sm min-w-0">
                            <div className="flex justify-between items-start mb-2 gap-2 flex-wrap">
                              <span className="text-xs font-bold text-[#3B2410]/70 flex items-center gap-2">
                                {isOP ? (
                                  <span className="bg-[#8B5E3C] text-white px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">OP</span>
                                ) : (
                                  <span>Anonymous</span>
                                )}
                                {isYou ? (
                                  <span className="bg-[#F5F0E8] text-[#8B5E3C] px-2 py-0.5 rounded border border-[#3B2410]/10 text-[10px] uppercase tracking-wider">You</span>
                                ) : (
                                  <button
                                    onClick={() => handleBlockUser(reply.device_cookie)}
                                    className="text-[#3B2410]/40 hover:text-red-600 text-[10px] uppercase font-bold tracking-wider hover:underline cursor-pointer"
                                  >
                                    Block User
                                  </button>
                                )}
                              </span>
                              <span className="text-xs text-[#3B2410]/50 font-medium whitespace-nowrap">{formatDistanceToNow(new Date(reply.created_at))} ago</span>
                            </div>
                            <p className="text-[#3B2410] whitespace-pre-wrap font-medium">{reply.content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {remaining > 0 && (
                    <button
                      onClick={() => setVisibleRepliesCount(c => c + REPLIES_PAGE_SIZE)}
                      className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-bold text-[#3B2410]/70 hover:text-[#3B2410] bg-white border border-[#3B2410]/10 hover:border-[#3B2410]/25 py-3 rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                      Show {Math.min(remaining, REPLIES_PAGE_SIZE)} more {remaining === 1 ? 'reply' : 'replies'}
                    </button>
                  )}
                </div>
              )}
              {shown.length === 0 && (
                <div className="bg-[#FFFBF5] rounded-2xl p-8 border border-[#3B2410]/10 shadow-sm text-center ml-5 md:ml-9 flex flex-col items-center justify-center">
                  <PenLine className="w-8 h-8 text-[#3B2410]/40 mb-3" />
                  <p className="text-[#3B2410]/60 font-bold">No replies yet. Be the first to jump in!</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* Reply Form */}
        <div className="bg-[#FFFBF5] rounded-3xl p-6 border border-[#3B2410]/10 shadow-sm ml-5 md:ml-9 relative">
          <div className="absolute -left-5 md:-left-9 top-10 w-5 md:w-9 border-t-2 border-[#3B2410]/10 rounded-bl-lg"></div>
          <div className="absolute -left-5 md:-left-9 -top-4 bottom-10 w-0 border-l-2 border-[#3B2410]/10"></div>
          
          {!userEmail ? (
            <div className="text-center py-6">
              <p className="text-[#3B2410]/70 mb-3 font-medium">Sign in to reply</p>
              <button
                onClick={() => window.dispatchEvent(new Event('lumo-open-signin'))}
                className="bg-[#8B5E3C] text-white px-6 py-3 rounded-xl font-medium"
              >
                Sign In — It's Free
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateReply}>
              <textarea 
                value={newReply}
                onChange={e => setNewReply(e.target.value)}
                rows={3}
                placeholder="Write a reply to this thread..."
                className="w-full bg-white border border-[#3B2410]/10 rounded-2xl px-5 py-4 text-[#3B2410] focus:outline-none focus:border-[#8B5E3C] focus:ring-1 focus:ring-[#8B5E3C] transition-all mb-3 font-medium placeholder:text-[#3B2410]/40"
                required
              />
              {replyError && (
                <div className="text-red-500 text-sm font-bold mb-3 px-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  {replyError}
                </div>
              )}
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={isReplying} 
                  className="bg-[#8B5E3C] hover:bg-[#724C2F] text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50 shadow-sm flex items-center gap-2"
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
        <div className="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setReportPostId(null)}>
          <div className="bg-[#FFFBF5] rounded-3xl p-8 pb-32 sm:pb-8 max-w-md w-full border border-[#3B2410]/15 shadow-2xl relative" onClick={e => e.stopPropagation()}>
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
