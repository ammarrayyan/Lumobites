'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow } from 'date-fns';

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
    <div className="min-h-screen bg-[#FDFAF7] font-sans">
      <header className="bg-white border-b border-[#E8DDD4] py-4 px-6 flex items-center gap-4 shadow-sm">
        <Link href="/city-board" className="text-xl">🔙</Link>
        <div className="font-black text-[#8B5E3C] text-xl">Thread: {postId}</div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        
        {/* OP Post */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8DDD4] shadow-sm mb-8 relative">
          {post.device_cookie === deviceCookie && (
            <div className="absolute top-4 right-4 bg-[#FAF6F4] text-[#8B5E3C] text-xs font-bold px-2 py-1 rounded border border-[#E8DDD4]">
              You
            </div>
          )}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-sm font-black text-white bg-[#8B5E3C] px-2.5 py-1 rounded">📍 {post.city}</span>
            <span className="text-sm font-bold text-[#8B5E3C] bg-[#FAF6F4] px-2.5 py-1 rounded border border-[#E8DDD4]">{post.category}</span>
            <span className="text-sm text-[#8B7E7D] ml-auto">{formatDistanceToNow(new Date(post.created_at))} ago</span>
          </div>
          <p className="text-[#4A3E3D] whitespace-pre-wrap text-lg">{post.content}</p>
          <div className="flex items-center justify-end border-t border-[#E8DDD4] pt-4 mt-6">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/city-board/${post.post_id}`);
                alert('Link copied to clipboard!');
              }}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#8B7E7D] hover:text-[#4A3E3D] transition-colors bg-[#FAF6F4] px-4 py-2 rounded-lg border border-[#E8DDD4]"
            >
              🔗 Copy Share Link
            </button>
          </div>
        </div>

        <h3 className="text-xl font-black text-[#4A3E3D] mb-4 pl-2">Replies ({replies.length})</h3>

        {/* Replies List */}
        <div className="space-y-4 mb-8">
          {replies.map(reply => (
            <div key={reply.id} className="bg-white rounded-2xl p-5 border border-[#E8DDD4] shadow-sm relative ml-4 md:ml-8">
              <div className="absolute -left-4 md:-left-8 top-6 w-4 md:w-8 border-t-2 border-[#E8DDD4] rounded-bl-lg"></div>
              <div className="absolute -left-4 md:-left-8 -top-4 bottom-6 w-0 border-l-2 border-[#E8DDD4]"></div>

              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-[#8B7E7D]">
                  {reply.device_cookie === post.device_cookie ? (
                    <span className="bg-[#8B5E3C] text-white px-2 py-0.5 rounded">OP</span>
                  ) : (
                    <span>Anonymous</span>
                  )}
                  {reply.device_cookie === deviceCookie && (
                    <span className="ml-2 bg-[#FAF6F4] text-[#8B5E3C] px-2 py-0.5 rounded border border-[#E8DDD4]">You</span>
                  )}
                </span>
                <span className="text-xs text-[#8B7E7D]">{formatDistanceToNow(new Date(reply.created_at))} ago</span>
              </div>
              <p className="text-[#4A3E3D] whitespace-pre-wrap">{reply.content}</p>
            </div>
          ))}
          {replies.length === 0 && (
            <p className="text-[#8B7E7D] font-medium pl-2">No replies yet. Be the first to reply!</p>
          )}
        </div>

        {/* Reply Form */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8DDD4] shadow-sm ml-4 md:ml-8 relative">
          <div className="absolute -left-4 md:-left-8 top-10 w-4 md:w-8 border-t-2 border-[#E8DDD4] rounded-bl-lg"></div>
          <div className="absolute -left-4 md:-left-8 -top-4 bottom-10 w-0 border-l-2 border-[#E8DDD4]"></div>
          
          <form onSubmit={handleCreateReply}>
            <textarea 
              value={newReply}
              onChange={e => setNewReply(e.target.value)}
              rows={3}
              placeholder="Write a reply..."
              className="w-full bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-3 text-[#4A3E3D] focus:outline-none focus:border-[#8B5E3C] mb-3"
              required
            />
            {replyError && <div className="text-red-500 text-sm font-bold mb-3">{replyError}</div>}
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={isReplying} 
                className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-2 px-6 rounded-xl transition-colors disabled:opacity-50"
              >
                {isReplying ? 'Replying...' : 'Post Reply'}
              </button>
            </div>
          </form>
        </div>

      </main>
    </div>
  );
}
