'use client';

import React, { useState } from 'react';
import MobileFoodNav from '@/components/MobileFoodNav';
import { Footprints, Gamepad2, Inbox, HeartPulse } from 'lucide-react';

export default function SuppliesPage() {
  // Toys State
  const [toyPetType, setToyPetType] = useState<'cat' | 'dog'>('dog');
  const [toySize, setToySize] = useState<'small' | 'medium' | 'large'>('medium');

  // Litter State (Cats only)
  const [litterType, setLitterType] = useState<'clumping' | 'non-clumping' | 'crystal' | 'natural'>('clumping');
  const [litterScent, setLitterScent] = useState<'scented' | 'unscented'>('unscented');

  // Supplements State
  const [suppPetType, setSuppPetType] = useState<'cat' | 'dog'>('dog');
  const [suppConcern, setSuppConcern] = useState<'joint' | 'skin' | 'digestive' | 'immune' | 'weight'>('joint');

  // --- Helpers ---
  const getToyRecommendations = () => {
    if (toyPetType === 'cat') {
      return [
        { name: 'Feather Wand', emoji: '🪶', desc: 'Stimulates their natural hunting instinct.' },
        { name: 'Laser Pointer', emoji: '🔴', desc: 'Great for high-energy burst cardio.' },
        { name: 'Crinkle Balls', emoji: '🧶', desc: 'Lightweight toys perfect for batting around.' },
        { name: 'Cat Tunnel', emoji: '🚇', desc: 'A cozy spot for hiding and ambushing.' },
      ];
    }
    if (toySize === 'small') {
      return [
        { name: 'Puzzle Toy', emoji: '🧩', desc: 'Keeps clever small minds sharp.' },
        { name: 'Small Fetch Ball', emoji: '🎾', desc: 'Sized perfectly for little jaws.' },
        { name: 'Chew Ring', emoji: '🍩', desc: 'Great for teething and anxiety.' },
        { name: 'Squeaky Plush', emoji: '🧸', desc: 'A soft companion they can carry around.' },
      ];
    }
    if (toySize === 'large') {
      return [
        { name: 'Heavy Duty Chew Bone', emoji: '🦴', desc: 'Built for strong, aggressive chewers.' },
        { name: 'Tug Rope', emoji: '🪢', desc: 'Perfect for interactive strength games.' },
        { name: 'Large Fetch Ball', emoji: '⚾', desc: 'A durable ball that won\'t be easily destroyed.' },
        { name: 'Interactive Treat Dispenser', emoji: '🎾', desc: 'Slows down eating and burns mental energy.' },
      ];
    }
    return [
      { name: 'Classic Tennis Ball', emoji: '🎾', desc: 'The gold standard for fetch.' },
      { name: 'Rope Toy', emoji: '🪢', desc: 'Great for tug-of-war and teeth cleaning.' },
      { name: 'Treat Kong', emoji: '🥜', desc: 'Stuff with peanut butter to keep them busy.' },
      { name: 'Squeaky Toy', emoji: '🧸', desc: 'A fun toy for active play.' },
    ];
  };

  const getLitterRecommendations = () => {
    const typeLabel = litterType.charAt(0).toUpperCase() + litterType.slice(1);
    const scentLabel = litterScent === 'scented' ? 'Scented' : 'Unscented';
    
    return [
      { name: `Premium ${typeLabel} Litter`, emoji: '✨', desc: `High quality ${litterType} formula that is ${litterScent}.` },
      { name: `Odor Control ${typeLabel} Litter`, emoji: '🌬️', desc: `Maximum odor blocking power for multi-cat homes.` },
      { name: `Dust-Free ${typeLabel} Litter`, emoji: '💨', desc: `99% dust free for sensitive respiratory systems.` },
      { name: `Lightweight ${typeLabel} Litter`, emoji: '🪶', desc: `Easy to pour and scoop, ${litterScent} formula.` },
    ];
  };

  const getSupplementRecommendations = () => {
    const typeStr = suppPetType === 'cat' ? 'Cat' : 'Dog';
    
    const concerns = {
      joint: { name: 'Joint Health', emoji: '🦴', items: ['Glucosamine Chews', 'Omega-3 Fish Oil', 'Hip & Joint Powder', 'Mobility Bites'] },
      skin: { name: 'Skin & Coat', emoji: '✨', items: ['Salmon Oil', 'Allergy Chews', 'Vitamin E Supplement', 'Coat Shine Powder'] },
      digestive: { name: 'Digestive Health', emoji: '🦠', items: ['Probiotic Powder', 'Pumpkin Supplement', 'Digestive Enzymes', 'Prebiotic Chews'] },
      immune: { name: 'Immune Support', emoji: '🛡️', items: ['Multivitamin', 'Colostrum Powder', 'Mushroom Complex', 'Vitamin C Drops'] },
      weight: { name: 'Weight Management', emoji: '⚖️', items: ['Metabolism Booster', 'L-Carnitine', 'High-Fiber Supplement', 'Weight Control Chews'] }
    };
    
    const data = concerns[suppConcern];
    return data.items.map(item => ({
      name: `${typeStr} ${item}`,
      emoji: data.emoji,
      desc: `Targeted ${data.name.toLowerCase()} support for your ${suppPetType}.`
    }));
  };

  const generateAmazonLink = (query: string) => {
    return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=lumobites-20`;
  };

  return (
    <div className="min-h-screen bg-[#FDFAF7] text-[#191919] font-sans pt-[52px] md:pt-0">
            <MobileFoodNav />

      <main className="max-w-[800px] mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-[800] text-[#191919] mb-4 flex items-center justify-center gap-2">
            <Footprints className="w-8 h-8 text-[#8B5E3C]" />
            Pet Supplies
          </h1>
          <p className="text-lg text-[#666666]">Find the best toys, litter, and supplements for your pet</p>
        </div>

        {/* SECTION 1: TOYS */}
        <section className="bg-white border border-[#E8DDD4] rounded-3xl p-6 md:p-10 mb-12 shadow-sm">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-[#8B5E3C]" />
            Toys
          </h2>
          
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">Pet Type</label>
              <div className="flex bg-[#F5EDE4] p-1 rounded-xl">
                <button onClick={() => setToyPetType('dog')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${toyPetType === 'dog' ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Dog</button>
                <button onClick={() => setToyPetType('cat')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${toyPetType === 'cat' ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Cat</button>
              </div>
            </div>
            {toyPetType === 'dog' && (
              <div className="flex-1 animate-fade-in">
                <label className="block text-sm font-bold text-gray-700 mb-2">Dog Size</label>
                <div className="flex bg-[#F5EDE4] p-1 rounded-xl">
                  <button onClick={() => setToySize('small')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${toySize === 'small' ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Small</button>
                  <button onClick={() => setToySize('medium')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${toySize === 'medium' ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Medium</button>
                  <button onClick={() => setToySize('large')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${toySize === 'large' ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Large</button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {getToyRecommendations().map((toy, i) => {
              const query = `${toy.name} for ${toyPetType === 'dog' ? toySize : ''} ${toyPetType} toy`;
              return (
                <div key={i} className="bg-[#FDFAF7] border border-[#E8DDD4] rounded-2xl p-4 flex flex-col items-center text-center">
                  <div className="text-4xl mb-3 bg-white w-14 h-14 rounded-full flex items-center justify-center shadow-sm">{toy.emoji}</div>
                  <h4 className="font-bold text-sm mb-1">{toy.name}</h4>
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-grow">{toy.desc}</p>
                  <a href={generateAmazonLink(query)} target="_blank" rel="noopener noreferrer" className="w-full bg-[#f0c14b] text-[#111] border border-[#a88734] py-2 rounded-lg text-xs font-bold hover:bg-[#ddb347] transition-colors">Buy on Amazon</a>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-center text-gray-400 italic">Product recommendations will be updated with live Amazon data soon.</p>
        </section>

        {/* SECTION 2: LITTER */}
        <section className="bg-white border border-[#E8DDD4] rounded-3xl p-6 md:p-10 mb-12 shadow-sm">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Inbox className="w-6 h-6 text-[#8B5E3C]" />
            Cat Litter
          </h2>
          
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-[2]">
              <label className="block text-sm font-bold text-gray-700 mb-2">Litter Type</label>
              <div className="flex flex-wrap bg-[#F5EDE4] p-1 rounded-xl gap-1">
                {(['clumping', 'non-clumping', 'crystal', 'natural'] as const).map(type => (
                  <button key={type} onClick={() => setLitterType(type)} className={`flex-1 min-w-[100px] py-2 rounded-lg text-sm font-bold transition-colors ${litterType === type ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">Scent</label>
              <div className="flex bg-[#F5EDE4] p-1 rounded-xl">
                <button onClick={() => setLitterScent('unscented')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${litterScent === 'unscented' ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Unscented</button>
                <button onClick={() => setLitterScent('scented')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${litterScent === 'scented' ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Scented</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {getLitterRecommendations().map((litter, i) => {
              const query = `${litterScent} ${litterType} cat litter`;
              return (
                <div key={i} className="bg-[#FDFAF7] border border-[#E8DDD4] rounded-2xl p-4 flex flex-col items-center text-center">
                  <div className="text-4xl mb-3 bg-white w-14 h-14 rounded-full flex items-center justify-center shadow-sm">{litter.emoji}</div>
                  <h4 className="font-bold text-sm mb-1">{litter.name}</h4>
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-grow">{litter.desc}</p>
                  <a href={generateAmazonLink(query)} target="_blank" rel="noopener noreferrer" className="w-full bg-[#f0c14b] text-[#111] border border-[#a88734] py-2 rounded-lg text-xs font-bold hover:bg-[#ddb347] transition-colors">Buy on Amazon</a>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-center text-gray-400 italic">Product recommendations will be updated with live Amazon data soon.</p>
        </section>

        {/* SECTION 3: SUPPLEMENTS */}
        <section className="bg-white border border-[#E8DDD4] rounded-3xl p-6 md:p-10 mb-12 shadow-sm">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-[#8B5E3C]" />
            Supplements
          </h2>
          
          <div className="flex flex-col gap-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Pet Type</label>
              <div className="flex bg-[#F5EDE4] p-1 rounded-xl max-w-[300px]">
                <button onClick={() => setSuppPetType('dog')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${suppPetType === 'dog' ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Dog</button>
                <button onClick={() => setSuppPetType('cat')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${suppPetType === 'cat' ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Cat</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Health Concern</label>
              <div className="flex flex-wrap bg-[#F5EDE4] p-1 rounded-xl gap-1">
                {(['joint', 'skin', 'digestive', 'immune', 'weight'] as const).map(concern => (
                  <button key={concern} onClick={() => setSuppConcern(concern)} className={`flex-1 min-w-[120px] py-2 rounded-lg text-sm font-bold transition-colors ${suppConcern === concern ? 'bg-white text-[#8B5E3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {concern.charAt(0).toUpperCase() + concern.slice(1)} Health
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {getSupplementRecommendations().map((supp, i) => {
              const query = `${suppPetType} ${suppConcern} supplement ${supp.name}`;
              return (
                <div key={i} className="bg-[#FDFAF7] border border-[#E8DDD4] rounded-2xl p-4 flex flex-col items-center text-center">
                  <div className="text-4xl mb-3 bg-white w-14 h-14 rounded-full flex items-center justify-center shadow-sm">{supp.emoji}</div>
                  <h4 className="font-bold text-sm mb-1">{supp.name}</h4>
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-grow">{supp.desc}</p>
                  <a href={generateAmazonLink(query)} target="_blank" rel="noopener noreferrer" className="w-full bg-[#f0c14b] text-[#111] border border-[#a88734] py-2 rounded-lg text-xs font-bold hover:bg-[#ddb347] transition-colors">Buy on Amazon</a>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-center text-gray-400 italic">Product recommendations will be updated with live Amazon data soon.</p>
        </section>
      </main>
    </div>
  );
}
