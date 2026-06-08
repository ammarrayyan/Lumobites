import React, { useState, useEffect } from 'react';

interface CityBoardManagementProps {
  adminKey: string;
  onUnauthorized: () => void;
}

export default function CityBoardManagement({ adminKey, onUnauthorized }: CityBoardManagementProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/city-board/posts', {
        headers: {
          'x-admin-key': adminKey
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      } else if (res.status === 401) {
        onUnauthorized();
      } else {
        setError('Failed to fetch posts');
      }
    } catch (e) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (postId: string) => {
    setLoadingReplies(true);
    try {
      const res = await fetch(`/api/city-board/replies?post_id=${postId}`);
      if (res.ok) {
        const data = await res.json();
        setReplies(data.replies || []);
      }
    } catch (e) {
      console.error('Failed to fetch replies', e);
    } finally {
      setLoadingReplies(false);
    }
  };

  const toggleReplies = (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      setReplies([]);
    } else {
      setExpandedPostId(postId);
      fetchReplies(postId);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This will also delete all its replies, helpful votes, followers, and reports.')) return;
    
    try {
      const res = await fetch('/api/city-board/posts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ post_id: postId })
      });
      
      if (res.ok) {
        setPosts(posts.filter(p => p.post_id !== postId));
        if (expandedPostId === postId) {
          setExpandedPostId(null);
          setReplies([]);
        }
      } else if (res.status === 401) {
        onUnauthorized();
      } else {
        alert('Failed to delete post');
      }
    } catch (e) {
      alert('An error occurred');
    }
  };

  const deleteReply = async (replyId: string) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;
    
    try {
      const res = await fetch('/api/city-board/replies', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ id: replyId })
      });
      
      if (res.ok) {
        setReplies(replies.filter(r => r.id !== replyId));
      } else if (res.status === 401) {
        onUnauthorized();
      } else {
        alert('Failed to delete reply');
      }
    } catch (e) {
      alert('An error occurred');
    }
  };

  const dismissReports = async (postId: string) => {
    if (!confirm('Are you sure you want to dismiss all reports for this post?')) return;
    
    try {
      const res = await fetch('/api/admin/dismiss-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ post_id: postId })
      });
      
      if (res.ok) {
        setPosts(posts.map(p => p.post_id === postId ? { ...p, report_count: 0, reports: [] } : p));
      } else if (res.status === 401) {
        onUnauthorized();
      } else {
        alert('Failed to dismiss reports');
      }
    } catch (e) {
      alert('An error occurred');
    }
  };

  if (loading) return <div className="text-[#555555] text-center py-8">Loading posts...</div>;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#191919]">City Board Management</h2>
        <button onClick={fetchPosts} className="bg-gray-100 hover:bg-gray-200 text-[#191919] px-4 py-2 rounded-lg text-sm transition-colors">
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {posts.map(post => {
          const isReported = post.report_count > 0;
          const reportReasons = isReported
            ? Array.from(new Set(post.reports?.map((r: any) => r.reason) || [])).join(', ')
            : '';

          return (
            <div 
              key={post.id} 
              className={`border rounded-xl p-4 transition-colors ${
                isReported 
                  ? 'bg-red-950/20 border-red-500/30' 
                  : 'bg-white/40 border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-3 flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="bg-[#c2e59c] text-black text-xs font-bold px-2 py-0.5 rounded">{post.post_id}</span>
                    <span className="text-[#555555] text-sm">{post.city} • {post.category}</span>
                    {isReported && (
                      <span className="bg-red-500/20 text-red-600 border border-red-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        ⚠️ Reported ({post.report_count})
                      </span>
                    )}
                    <span className="text-[#191919] text-xs font-semibold px-2 py-0.5 bg-gray-100 rounded border border-gray-200 ml-2">
                      👍 {post.helpful_count || 0} helpful
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">Device: {post.device_cookie} • {new Date(post.created_at).toLocaleString()}</div>
                  {isReported && (
                    <div className="text-xs text-red-600 font-semibold mt-1">
                      Report Reasons: <span className="text-red-300 italic">{reportReasons || 'None'}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleReplies(post.post_id)}
                    className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 px-3 py-1 rounded text-sm transition-colors cursor-pointer"
                  >
                    Replies ({post.reply_count})
                  </button>
                  {isReported && (
                    <button 
                      onClick={() => dismissReports(post.post_id)}
                      className="bg-green-500/20 text-green-600 hover:bg-green-500/30 px-3 py-1 rounded text-sm transition-colors border border-green-500/20 cursor-pointer font-semibold"
                    >
                      Dismiss Reports
                    </button>
                  )}
                  <button 
                    onClick={() => deletePost(post.post_id)}
                    className="bg-red-500/20 text-red-600 hover:bg-red-500/30 px-3 py-1 rounded text-sm transition-colors cursor-pointer"
                  >
                    Delete Post
                  </button>
                </div>
              </div>
              <div className="text-[#191919] bg-gray-50 p-3 rounded-lg text-sm whitespace-pre-wrap">{post.content}</div>

              {expandedPostId === post.post_id && (
                <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-3">
                  <h4 className="text-sm font-bold text-[#555555]">Replies</h4>
                  {loadingReplies ? (
                    <div className="text-gray-500 text-sm">Loading replies...</div>
                  ) : replies.length === 0 ? (
                    <div className="text-gray-500 text-sm">No replies yet.</div>
                  ) : (
                    replies.map(reply => (
                      <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-xs text-gray-500">Device: {reply.device_cookie} • {new Date(reply.created_at).toLocaleString()}</div>
                          <button 
                            onClick={() => deleteReply(reply.id)}
                            className="text-red-600 hover:text-red-300 text-xs transition-colors cursor-pointer"
                          >
                            Delete Reply
                          </button>
                        </div>
                        <div className="text-gray-500 text-sm whitespace-pre-wrap">{reply.content}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
        {posts.length === 0 && (
          <div className="text-gray-500 text-center py-8">No posts found.</div>
        )}
      </div>
    </div>
  );
}
