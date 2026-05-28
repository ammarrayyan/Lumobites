'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow } from 'date-fns';
import Navbar from '@/components/Navbar';

export default function CityBoardPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [deviceCookie, setDeviceCookie] = useState<string>('');
  const [post, setPost] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newReply, setNewReply] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [replyError, setReplyError] = useState('');

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
      // Fetch post details (by post_id)
      const postRes = await fetch(`/api/city-board/posts?post_id=${postId}`);
      if (postRes.ok) {
        const postData = await postRes.json();
        const foundPost = postData.posts.find((p: any) => p.post_id === postId);
        if (foundPost) {
          setPost(foundPost);
        } else {
          setPost(null); // Not found
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
    if (postId) {
      fetchData();
    }
  }, [postId]);

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
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8">
        
        {/* Back Button & Thread ID Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <Link href="/city-board" className="inline-flex items-center gap-2 text-[#8B5E3C] font-bold hover:bg-[#8B5E3C] hover:text-white transition-all bg-white px-5 py-2.5 rounded-full shadow-sm border border-[#3B2410]/10 text-sm w-fit">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to City Board
          </Link>
          <div className="bg-[#FFFBF5] px-4 py-2 rounded-xl border border-[#3B2410]/10 shadow-sm inline-flex items-center gap-2 w-fit">
            <span className="text-[#3B2410]/60 text-xs font-bold uppercase tracking-wider">Thread ID</span>
            <span className="font-black text-[#3B2410]">{postId}</span>
          </div>
        </div>
        
        {/* OP Post */}
        <div className="bg-[#FFFBF5] rounded-3xl p-6 md:p-8 border border-[#3B2410]/10 shadow-sm mb-8 relative">
          {post.device_cookie === deviceCookie && (
            <div className="absolute top-4 right-4 bg-[#8B5E3C] text-white text-[10px] font-black uppercase tracking-[0.12em] px-2.5 py-1 rounded-full shadow-sm">
              You
            </div>
          )}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="text-sm font-black text-white bg-[#3B2410] px-3 py-1.5 rounded-xl shadow-sm">📍 {post.city}</span>
            <span className="text-sm font-bold text-[#8B5E3C] bg-[#F5F0E8] px-3 py-1.5 rounded-xl border border-[#3B2410]/10">{post.category}</span>
            <span className="text-sm text-[#3B2410]/50 ml-auto font-medium">{formatDistanceToNow(new Date(post.created_at))} ago</span>
          </div>
          <p className="text-[#3B2410] whitespace-pre-wrap text-lg md:text-xl font-medium leading-relaxed">{post.content}</p>
          <div className="flex items-center justify-end border-t border-[#3B2410]/10 pt-5 mt-6">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/city-board/${post.post_id}`);
                alert('Link copied to clipboard!');
              }}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#8B5E3C] hover:bg-[#F5F0E8] transition-colors bg-white px-4 py-2 rounded-xl border border-[#3B2410]/10 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              Copy Share Link
            </button>
          </div>
        </div>

        <h3 className="text-xl font-black text-[#3B2410] mb-5 pl-2 flex items-center gap-2">
          <span>💬</span> Replies ({replies.length})
        </h3>

        {/* Replies List */}
        <div className="space-y-4 mb-8">
          {replies.map(reply => (
            <div key={reply.id} className="bg-[#FFFBF5] rounded-2xl p-5 border border-[#3B2410]/10 shadow-sm relative ml-4 md:ml-8">
              <div className="absolute -left-4 md:-left-8 top-6 w-4 md:w-8 border-t-2 border-[#3B2410]/10 rounded-bl-lg"></div>
              <div className="absolute -left-4 md:-left-8 -top-4 bottom-6 w-0 border-l-2 border-[#3B2410]/10"></div>

              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold text-[#3B2410]/70 flex items-center gap-2">
                  {reply.device_cookie === post.device_cookie ? (
                    <span className="bg-[#8B5E3C] text-white px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">OP</span>
                  ) : (
                    <span>Anonymous</span>
                  )}
                  {reply.device_cookie === deviceCookie && (
                    <span className="bg-[#F5F0E8] text-[#8B5E3C] px-2 py-0.5 rounded border border-[#3B2410]/10 text-[10px] uppercase tracking-wider">You</span>
                  )}
                </span>
                <span className="text-xs text-[#3B2410]/50 font-medium">{formatDistanceToNow(new Date(reply.created_at))} ago</span>
              </div>
              <p className="text-[#3B2410] whitespace-pre-wrap font-medium">{reply.content}</p>
            </div>
          ))}
          {replies.length === 0 && (
            <div className="bg-[#FFFBF5] rounded-2xl p-8 border border-[#3B2410]/10 shadow-sm text-center ml-4 md:ml-8">
              <span className="text-3xl mb-3 block">✍️</span>
              <p className="text-[#3B2410]/60 font-bold">No replies yet. Be the first to jump in!</p>
            </div>
          )}
        </div>

        {/* Reply Form */}
        <div className="bg-[#FFFBF5] rounded-3xl p-6 border border-[#3B2410]/10 shadow-sm ml-4 md:ml-8 relative">
          <div className="absolute -left-4 md:-left-8 top-10 w-4 md:w-8 border-t-2 border-[#3B2410]/10 rounded-bl-lg"></div>
          <div className="absolute -left-4 md:-left-8 -top-4 bottom-10 w-0 border-l-2 border-[#3B2410]/10"></div>
          
          <form onSubmit={handleCreateReply}>
            <textarea 
              value={newReply}
              onChange={e => setNewReply(e.target.value)}
              rows={3}
              placeholder="Write a reply to this thread..."
              className="w-full bg-white border border-[#3B2410]/10 rounded-2xl px-5 py-4 text-[#3B2410] focus:outline-none focus:border-[#8B5E3C] focus:ring-1 focus:ring-[#8B5E3C] transition-all mb-3 font-medium placeholder:text-[#3B2410]/40"
              required
            />
            {replyError && <div className="text-red-500 text-sm font-bold mb-3 px-2">⚠️ {replyError}</div>}
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
        </div>

      </main>
    </div>
  );
}
