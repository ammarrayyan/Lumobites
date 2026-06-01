'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { HelpCircle, Star, Footprints, MessageSquare, Megaphone, MapPin, ThumbsUp } from 'lucide-react';

interface CityPostPreview {
  post_id: string;
  city: string;
  category: string;
  content: string;
  created_at: string;
  helpful_count: number;
  reply_count: number;
}

export default function CityBoardPreview() {
  const [posts, setPosts] = useState<CityPostPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const mockPosts: CityPostPreview[] = [
    {
      post_id: 'LB-M1',
      city: 'Riverside, CA',
      category: 'Question',
      content: 'Any recommendations for a great mobile pet groomer in Riverside who does goldendoodles?',
      created_at: new Date().toISOString(),
      helpful_count: 5,
      reply_count: 3
    },
    {
      post_id: 'LB-M2',
      city: 'Boston, MA',
      category: 'Recommendation',
      content: 'The new dog bakery on Tremont St is amazing! Organic peanut butter treats were a huge hit with my pug.',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      helpful_count: 8,
      reply_count: 2
    },
    {
      post_id: 'LB-M3',
      city: 'Austin, TX',
      category: 'Lost Pet',
      content: 'Found a sweet tabby cat near Zilker Park. Wearing a blue collar but no tags. Keeping him safe until owner is found!',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      helpful_count: 12,
      reply_count: 4
    }
  ];

  useEffect(() => {
    const fetchPreviewPosts = async () => {
      try {
        const res = await fetch('/api/city-board/posts?sort=popular');
        const data = await res.json();
        
        if (res.ok && data.posts && data.posts.length > 0) {
          setPosts(data.posts.slice(0, 3));
        } else {
          setPosts(mockPosts);
        }
      } catch (err) {
        console.error('Failed to fetch preview posts:', err);
        setPosts(mockPosts);
      } finally {
        setLoading(false);
      }
    };
    fetchPreviewPosts();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Question':
        return <HelpCircle className="w-5 h-5 text-blue-500" />;
      case 'Recommendation':
        return <Star className="w-5 h-5 text-amber-500 fill-amber-500" />;
      case 'Lost Pet':
        return <Footprints className="w-5 h-5 text-rose-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-[#8B5E3C]" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Question': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Recommendation': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Lost Pet': return 'bg-rose-50 text-rose-600 border-rose-200';
      default: return 'bg-[#FAF6F4] text-[#8B7E7D] border-[#E8DDD4]';
    }
  };

  return (
    <section className="w-full bg-[#FDFAF7] border-t border-[#E8DDD4] px-6 py-16">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-10">
        
        {/* Left Side: Call to Action */}
        <div className="flex-1 text-center md:text-left order-1 md:order-1">
          <div className="inline-block bg-[#8B5E3C]/10 text-[#8B5E3C] text-xs font-bold tracking-[0.1em] uppercase px-3 py-1 rounded-full mb-4">
            City Discussion Board
          </div>
          <h2 className="text-3xl md:text-4xl font-[800] text-[#191919] tracking-[-0.02em] leading-tight mb-4 flex items-center justify-center md:justify-start gap-2.5">
            <Megaphone className="w-8 h-8 text-[#8B5E3C] flex-shrink-0" /> Join Your Local Neighborhood Discussion
          </h2>
          <p className="text-[#666666] text-lg leading-[1.6] mb-8 max-w-[500px] mx-auto md:mx-0">
            Connect with local pet lovers in your area. Ask questions, get advice, share recommendations, report sightings of lost pets, and participate in community discussions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <NextLink 
              href="/city-board" 
              className="bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md text-center text-decoration-none"
              style={{ textDecoration: 'none' }}
            >
              Browse City Board &rarr;
            </NextLink>
            <NextLink 
              href="/city-board" 
              className="bg-white hover:bg-[#F5EDE4] border-2 border-[#E8DDD4] text-[#4A3E3D] font-bold py-3 px-6 rounded-xl transition-all shadow-sm text-center text-decoration-none"
              style={{ textDecoration: 'none' }}
            >
              Post a Discussion &rarr;
            </NextLink>
          </div>
        </div>

        {/* Right Side: Latest Posts */}
        <div className="flex-1 w-full md:w-auto mt-8 md:mt-0 flex flex-col gap-4 order-2 md:order-2">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E8DDD4]">
            <h3 className="text-sm font-bold text-[#8B7E7D] uppercase tracking-wider mb-4 border-b border-[#F0E8E0] pb-2">
              Latest Discussions
            </h3>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map(post => (
                  <NextLink href={`/city-board/${post.post_id}`} key={post.post_id} className="flex gap-4 items-start group text-decoration-none" style={{ textDecoration: 'none' }}>
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF6F4] border border-[#E8DDD4] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                      {getCategoryIcon(post.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getCategoryColor(post.category)}`}>
                          {post.category}
                        </span>
                        <span className="text-[#8B7E7D] text-xs font-semibold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#8B7E7D]" /> {post.city}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#191919] leading-tight truncate group-hover:text-[#8B5E3C] transition-colors mb-1">
                        {post.content}
                      </p>
                      <p className="text-xs text-[#8B7E7D] font-medium flex items-center gap-1.5 flex-wrap">
                        <ThumbsUp className="w-3 h-3 text-[#8B7E7D]" /> {post.helpful_count || 0} helpful
                        <span>&bull;</span>
                        <MessageSquare className="w-3 h-3 text-[#8B7E7D]" /> {post.reply_count || 0} {post.reply_count === 1 ? 'reply' : 'replies'}
                      </p>
                    </div>
                  </NextLink>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#8B7E7D] italic text-center py-4">No active discussions right now.</p>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
