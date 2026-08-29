'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ThumbsUp, Trash2, Camera, Send, X, Share2, MoreHorizontal, ChevronDown, Check } from 'lucide-react';

const AVATAR_COLORS = [
  { bg: '#FEE2E2', text: '#991B1B' },
  { bg: '#D1FAE5', text: '#065F46' },
  { bg: '#E0E7FF', text: '#3730A3' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#CCFBF1', text: '#115E59' },
  { bg: '#FFEDD5', text: '#9A3412' },
  { bg: '#E0F2FE', text: '#075985' },
  { bg: '#FAF6F4', text: '#8B5E3C' },
  { bg: '#F3E8FF', text: '#6B21A8' },
  { bg: '#FCE7F3', text: '#9D174D' },
];

export const getCommentAvatarColor = (seed: string) => {
  if (!seed) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

export const formatFacebookTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 45) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}d`;
    const diffWeek = Math.floor(diffDay / 7);
    if (diffWeek < 52) return `${diffWeek}w`;
    return `${Math.floor(diffDay / 365)}y`;
  } catch (e) {
    return '1d';
  }
};

export interface RawComment {
  id: string;
  lost_pet_id?: string;
  post_id?: string;
  author_name?: string;
  commenter_name?: string;
  author_email?: string;
  comment_text?: string;
  content?: string;
  photo_url?: string;
  created_at: string;
  device_cookie?: string;
  parent_id?: string;
}

export interface ThreadedComment {
  id: string;
  parentId?: string | null;
  replyToName?: string | null;
  authorName: string;
  authorEmail?: string;
  deviceCookie?: string;
  text: string;
  photoUrl?: string;
  createdAt: string;
  badge?: string | null;
  replies: ThreadedComment[];
}

interface FacebookStyleCommentThreadProps {
  comments: RawComment[];
  currentUserEmail?: string;
  currentUserName?: string;
  postAuthorEmail?: string;
  postAuthorCookie?: string;
  currentUserCookie?: string;
  isPostAuthor?: boolean;
  onAddComment: (text: string, photoUrl?: string | null, parentId?: string, replyToName?: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onBlockUser?: (cookieOrEmail: string) => void;
  title?: string;
  placeholder?: string;
  allowPhoto?: boolean;
  signInPromptText?: string;
  requireAuth?: boolean;
}

export default function FacebookStyleCommentThread({
  comments,
  currentUserEmail = '',
  currentUserName = '',
  postAuthorEmail = '',
  postAuthorCookie = '',
  currentUserCookie = '',
  isPostAuthor = false,
  onAddComment,
  onDeleteComment,
  onBlockUser,
  title = 'Comments',
  placeholder = 'Write a comment...',
  allowPhoto = true,
  signInPromptText = 'Sign in to comment or share a sighting',
  requireAuth = true,
}: FacebookStyleCommentThreadProps) {
  const [newCommentText, setNewCommentText] = useState('');
  const [commentPhoto, setCommentPhoto] = useState<string | null>(null);
  const [commentPhotoPreview, setCommentPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [likesMap, setLikesMap] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [visibleCount, setVisibleCount] = useState(10);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const replyInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize stored likes from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('lumo_fb_comment_likes');
      if (stored) {
        setLikesMap(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const toggleLike = (commentId: string) => {
    setLikesMap(prev => {
      const current = prev[commentId] || { count: 0, liked: false };
      const nextLiked = !current.liked;
      const nextCount = nextLiked ? current.count + 1 : Math.max(0, current.count - 1);
      const updated = {
        ...prev,
        [commentId]: { count: nextCount, liked: nextLiked }
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('lumo_fb_comment_likes', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCommentPhotoPreview(result);

      // Compress photo before saving
      const img = new Image();
      img.src = result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        setCommentPhoto(canvas.toDataURL('image/jpeg', 0.8));
      };
    };
    reader.readAsDataURL(file);
  };

  const handleMainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onAddComment(newCommentText.trim(), commentPhoto);
      setNewCommentText('');
      setCommentPhoto(null);
      setCommentPhotoPreview(null);
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentComment: ThreadedComment) => {
    if (!replyText.trim() || replySubmitting) return;

    setReplySubmitting(true);
    try {
      await onAddComment(replyText.trim(), null, parentComment.id, parentComment.authorName);
      setReplyText('');
      setReplyingToId(null);
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setReplySubmitting(false);
    }
  };

  // Determine badge for a commenter based on trackable application data
  const getBadgeForCommenter = (
    email?: string,
    cookie?: string,
    authorName?: string,
    parentId?: string | null
  ): string | null => {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPostEmail = (postAuthorEmail || '').toLowerCase().trim();

    // 1. Post Author / Owner
    if (cleanPostEmail && cleanEmail && cleanEmail === cleanPostEmail) {
      return 'Author';
    }
    if (postAuthorCookie && cookie && cookie === postAuthorCookie) {
      return 'Author';
    }

    // 2. Verified Admin / Staff
    if (
      cleanEmail === 'ammar-rayyan@hotmail.com' ||
      cleanEmail === 'reviewer@lumobites.net'
    ) {
      return 'Staff';
    }

    // 3. Top Helper (Users with proven community activity or verified sitter account)
    if (authorName && authorName.toLowerCase().includes('sitter')) {
      return 'Verified Sitter';
    }

    return null;
  };

  // Parse raw comments into threaded hierarchy
  const buildThreadHierarchy = (): ThreadedComment[] => {
    const itemMap = new Map<string, ThreadedComment>();
    const rootComments: ThreadedComment[] = [];

    // 1. Normalize all items
    comments.forEach(c => {
      const rawText = c.comment_text || c.content || '';
      let parentId = c.parent_id || null;
      let replyToName: string | null = null;
      let displayText = rawText;

      // Check for inline metadata tag: [[reply_to:PARENT_ID:AUTHOR_NAME]]
      const replyMatch = rawText.match(/^\[\[reply_to:([^:]+):([^\]]+)\]\]\s*(.*)$/s);
      if (replyMatch) {
        parentId = replyMatch[1];
        replyToName = replyMatch[2];
        displayText = replyMatch[3];
      }

      const authorName = c.author_name || c.commenter_name || (c.device_cookie === postAuthorCookie ? 'Original Poster' : 'Community Member');
      const badge = getBadgeForCommenter(c.author_email, c.device_cookie, authorName, parentId);

      const threadedItem: ThreadedComment = {
        id: c.id,
        parentId,
        replyToName,
        authorName,
        authorEmail: c.author_email,
        deviceCookie: c.device_cookie,
        text: displayText,
        photoUrl: c.photo_url,
        createdAt: c.created_at,
        badge,
        replies: []
      };

      itemMap.set(c.id, threadedItem);
    });

    // 2. Link child replies into their parents
    itemMap.forEach(item => {
      if (item.parentId && itemMap.has(item.parentId)) {
        itemMap.get(item.parentId)!.replies.push(item);
      } else {
        rootComments.push(item);
      }
    });

    return rootComments;
  };

  const threadedList = buildThreadHierarchy();
  const displayedComments = threadedList.slice(0, visibleCount);

  // Render individual comment / reply item in Facebook UI format
  const renderCommentNode = (comment: ThreadedComment, isNested: boolean = false) => {
    const avatarColor = getCommentAvatarColor(comment.authorEmail || comment.authorName || comment.id);
    const initial = (comment.authorName || 'U').charAt(0).toUpperCase();
    const timeAgo = formatFacebookTime(comment.createdAt);
    const likeState = likesMap[comment.id] || { count: 0, liked: false };

    const isOwnComment = (
      (currentUserEmail && comment.authorEmail && currentUserEmail.toLowerCase().trim() === comment.authorEmail.toLowerCase().trim()) ||
      (currentUserCookie && comment.deviceCookie && currentUserCookie === comment.deviceCookie) ||
      currentUserEmail.toLowerCase().trim() === 'ammar-rayyan@hotmail.com' ||
      currentUserEmail.toLowerCase().trim() === 'reviewer@lumobites.net'
    );

    const isReplyOpen = replyingToId === comment.id;

    return (
      <div key={comment.id} className="group/item text-left">
        <div className="flex items-start gap-2.5">
          {/* Small Circular Avatar */}
          <div
            className={`${isNested ? 'w-7 h-7 text-[11px]' : 'w-8 h-8 text-xs'} rounded-full flex items-center justify-center font-bold shrink-0 select-none shadow-2xs border border-black/5 mt-0.5`}
            style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
          >
            {initial}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header: Bold Name · Badge · Timestamp */}
            <div className="flex items-center gap-1.5 flex-wrap leading-tight">
              <span className="font-bold text-[13.5px] sm:text-[14px] text-[#1c1e21] hover:underline cursor-pointer">
                {comment.authorName}
              </span>

              {comment.badge && (
                <>
                  <span className="text-gray-400 text-xs select-none">·</span>
                  <span className={`text-[10.5px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                    comment.badge === 'Author'
                      ? 'bg-[#FAF6F4] text-[#8B5E3C] border border-[#E8DDD4]'
                      : comment.badge === 'Staff'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : comment.badge === 'Verified Sitter'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {comment.badge}
                  </span>
                </>
              )}

              <span className="text-gray-400 text-xs select-none">·</span>
              <span className="text-xs text-gray-500 font-normal select-none">
                {timeAgo}
              </span>
            </div>

            {/* Comment Body Text: Plain Text on Page (No Card, No Border, No Shadow) */}
            <div className="text-[13.5px] sm:text-[14px] text-[#1c1e21] leading-relaxed whitespace-pre-wrap mt-0.5 break-words">
              {comment.replyToName && (
                <span className="text-[#1877F2] font-semibold mr-1.5 select-none hover:underline cursor-pointer">
                  {comment.replyToName}
                </span>
              )}
              {comment.text}
            </div>

            {/* Photo Attachment (if present) */}
            {comment.photoUrl && (
              <div className="mt-2">
                <img
                  src={comment.photoUrl}
                  alt="Attachment"
                  onClick={() => setPreviewImage(comment.photoUrl!)}
                  className="max-w-[240px] sm:max-w-[300px] max-h-[220px] object-cover rounded-xl border border-[#E8DDD4] shadow-xs cursor-pointer hover:opacity-95 transition-opacity"
                />
              </div>
            )}

            {/* Action Row: Thumbs Up / Like · Reply · Share · Delete */}
            <div className="flex items-center gap-3 mt-1 text-xs font-semibold text-gray-500">
              <button
                type="button"
                onClick={() => toggleLike(comment.id)}
                className={`flex items-center gap-1 transition-colors cursor-pointer border-none bg-transparent p-0 ${
                  likeState.liked ? 'text-[#8B5E3C] font-bold' : 'hover:text-gray-900'
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${likeState.liked ? 'fill-[#8B5E3C]' : ''}`} />
                <span>{likeState.count > 0 ? `${likeState.count} Like` : 'Like'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (requireAuth && !currentUserEmail && !currentUserCookie) {
                    window.dispatchEvent(new Event('lumo-open-signin'));
                    return;
                  }
                  if (replyingToId === comment.id) {
                    setReplyingToId(null);
                  } else {
                    setReplyingToId(comment.id);
                    setReplyText('');
                    setTimeout(() => replyInputRef.current?.focus(), 50);
                  }
                }}
                className="hover:text-gray-900 transition-colors cursor-pointer border-none bg-transparent p-0"
              >
                Reply
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  setCopiedId(comment.id);
                  setTimeout(() => setCopiedId(null), 2000);
                }}
                className="hover:text-gray-900 transition-colors cursor-pointer border-none bg-transparent p-0"
              >
                {copiedId === comment.id ? (
                  <span className="text-emerald-600 flex items-center gap-0.5"><Check className="w-3 h-3" /> Copied</span>
                ) : (
                  'Share'
                )}
              </button>

              {isOwnComment && (
                <button
                  type="button"
                  onClick={() => onDeleteComment(comment.id)}
                  className="text-rose-600 hover:text-rose-800 transition-colors cursor-pointer border-none bg-transparent p-0"
                >
                  Delete
                </button>
              )}
            </div>

            {/* Inline Reply Form (when user clicks Reply) */}
            {isReplyOpen && (
              <div className="mt-2.5 flex items-center gap-2 pt-1 animate-fade-in">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border border-black/5"
                  style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                >
                  {(currentUserName || 'Y').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 flex items-center bg-[#FAF6F4] border border-[#E8DDD4] rounded-full px-3 py-1.5 focus-within:bg-white focus-within:border-[#8B5E3C] transition-all">
                  <input
                    ref={replyInputRef}
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={`Reply to ${comment.authorName}...`}
                    className="w-full bg-transparent text-xs text-[#2B231D] focus:outline-none placeholder:text-gray-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleReplySubmit(comment);
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={!replyText.trim() || replySubmitting}
                    onClick={() => handleReplySubmit(comment)}
                    className="ml-1 text-[#8B5E3C] hover:text-[#7A5234] disabled:opacity-40 transition-opacity cursor-pointer border-none bg-transparent p-0"
                    title="Send Reply"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingToId(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent p-0"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Nested Replies Indented Under Parent (Facebook Threading Structure) */}
            {comment.replies.length > 0 && (
              <div className="mt-2.5 ml-1 sm:ml-2 pl-3 border-l-2 border-[#E8DDD4]/80 space-y-3">
                {comment.replies.map(reply => renderCommentNode(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const userInitial = (currentUserName || currentUserEmail || 'Y').charAt(0).toUpperCase();
  const userAvatarColor = getCommentAvatarColor(currentUserEmail || currentUserName || 'user');

  return (
    <section className="w-full text-left">
      {/* Header with Title & Count */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-[#E8DDD4]">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-[#1c1e21]">{title}</h2>
          <span className="text-xs font-semibold text-gray-500">
            {comments.length}
          </span>
        </div>
      </div>

      {/* Main Comment Composer (Facebook Style Pill) */}
      <div className="mb-5">
        {requireAuth && !currentUserEmail ? (
          <div className="text-center py-3.5 px-4 bg-[#FAF6F4] rounded-2xl border border-[#E8DDD4]/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-600 font-medium">{signInPromptText}</p>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('lumo-open-signin'))}
              className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white px-4 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
            >
              Sign In — It&apos;s Free
            </button>
          </div>
        ) : (
          <form onSubmit={handleMainSubmit} className="flex items-start gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-2xs border border-black/5 mt-0.5"
              style={{ backgroundColor: userAvatarColor.bg, color: userAvatarColor.text }}
            >
              {userInitial}
            </div>

            <div className="flex-1 bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl p-2.5 focus-within:bg-white focus-within:border-[#8B5E3C] transition-all">
              <textarea
                required
                rows={1}
                value={newCommentText}
                onChange={e => setNewCommentText(e.target.value)}
                placeholder={placeholder}
                className="w-full text-[#1c1e21] text-xs sm:text-sm focus:outline-none resize-none placeholder:text-gray-400 bg-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleMainSubmit(e);
                  }
                }}
              />

              {commentPhotoPreview && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={commentPhotoPreview}
                    alt="Attachment Preview"
                    className="w-16 h-16 object-cover rounded-xl border border-[#E8DDD4]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCommentPhoto(null);
                      setCommentPhotoPreview(null);
                    }}
                    className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shadow-md hover:bg-rose-700 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[#E8DDD4]/60 mt-1">
                {allowPhoto ? (
                  <label
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-gray-500 hover:text-[#8B5E3C] hover:bg-white cursor-pointer transition-all border border-transparent hover:border-[#E8DDD4]"
                    title={commentPhotoPreview ? 'Change photo' : 'Attach photo'}
                  >
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                  </label>
                ) : (
                  <div />
                )}

                <button
                  type="submit"
                  disabled={submitting || !newCommentText.trim()}
                  className="inline-flex items-center gap-1.5 bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-1 px-3.5 rounded-xl transition-all disabled:opacity-40 text-xs shadow-2xs cursor-pointer"
                >
                  {submitting ? 'Posting...' : 'Post'} <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Facebook-style Minimalist Comment Feed (No Card Boxes, Tight Spacing) */}
      <div className="space-y-4">
        {displayedComments.length > 0 ? (
          displayedComments.map(comment => renderCommentNode(comment, false))
        ) : (
          <div className="py-6 text-center text-gray-500 text-xs font-normal">
            No comments yet. Be the first to start the conversation!
          </div>
        )}

        {threadedList.length > visibleCount && (
          <button
            type="button"
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 py-2 transition-colors cursor-pointer border-none bg-transparent"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            View {Math.min(threadedList.length - visibleCount, 10)} more comments
          </button>
        )}
      </div>

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-black rounded-2xl overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center font-bold z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Full size attachment preview"
              className="max-w-full max-h-[85vh] object-contain mx-auto"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </section>
  );
}
