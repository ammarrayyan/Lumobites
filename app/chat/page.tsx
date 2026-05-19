'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ChatBubble from '@/components/ChatBubble';
import { ChatMessage, ParsedPetInfo } from '@/lib/types';

const STORAGE_KEY = 'lumobites_last_search';

export default function ChatPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [retries, setRetries] = useState(0);
  const [tempAge, setTempAge] = useState<number | null>(null);
  const [returnBanner, setReturnBanner] = useState<{ petType: string; params: string } | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hey! 👋 I'm here to help find the perfect food \nfor your pet. Let's start — is your pet a 🐱 cat \nor 🐶 dog?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [parsedInfo, setParsedInfo] = useState<ParsedPetInfo>({});
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const brand = params.get('brand');
    if (brand) {
      const displayBrand = brand.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      setSelectedBrand(displayBrand);
    }
    // Check for returning user
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { petType, searchParams } = JSON.parse(saved);
        if (petType && searchParams) setReturnBanner({ petType, params: searchParams });
      }
    } catch (_) {}
  }, []);

  // Health Chips State
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const healthOptions = [
    { id: 'anxiety', label: '😰 Anxiety or stress' },
    { id: 'sensitive_stomach', label: '🤢 Sensitive stomach' },
    { id: 'allergies', label: '🌾 Food allergies' },
    { id: 'picky_eater', label: '🍽️ Picky eater' },
    { id: 'weight_control', label: '⚖️ Weight management' },
    { id: 'joint', label: '🦴 Joint issues' },
    { id: 'none', label: '✅ None of the above' }
  ];

  // Food Type Chips State
  const [selectedFoodType, setSelectedFoodType] = useState<string>('');
  const foodOptions = [
    { id: 'dry', label: '🥩 Dry food (kibble)' },
    { id: 'wet', label: '🍖 Wet food (canned)' },
    { id: 'treats', label: '🦴 Treats & snacks' },
    { id: 'both', label: '🔀 All / No preference' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    // Auto-focus input when bot finishes typing
    if (!isTyping && step !== 5 && inputRef.current) {
      // Small timeout to ensure render is complete
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [messages, isTyping, step]);

  const toggleChip = (id: string) => {
    if (step === 3) {
      if (id === 'none') {
        setSelectedChips(['none']);
        return;
      }
      let newSelected = selectedChips.filter(c => c !== 'none');
      if (newSelected.includes(id)) {
        newSelected = newSelected.filter(c => c !== id);
      } else {
        newSelected.push(id);
      }
      setSelectedChips(newSelected);
    } else if (step === 4) {
      if (selectedFoodType === id) {
        setSelectedFoodType('');
      } else {
        setSelectedFoodType(id);
      }
    }
  };

  const submitInput = async (userMessage: string, forceChipsSubmit: boolean = false) => {
    if (!userMessage.trim() && !forceChipsSubmit) return;
    if (step === 6) return;

    if (!forceChipsSubmit) setInput('');
    
    // Display user message if they typed one, or if they clicked continue on chips
    let displayMsg = forceChipsSubmit && !userMessage ? 'Selected options' : userMessage;
    if (forceChipsSubmit && step === 3 && selectedChips.length > 0) {
      if (selectedChips.includes('none')) {
        displayMsg = "No health issues";
      } else {
        displayMsg = healthOptions
          .filter(o => selectedChips.includes(o.id))
          .map(o => o.label.replace(/^[^\sA-Za-z]+/, '').trim())
          .join(', ');
      }
    }
    if (forceChipsSubmit && step === 4 && selectedFoodType) {
      displayMsg = foodOptions.find(o => o.id === selectedFoodType)?.label || displayMsg;
    }
    setMessages(prev => [...prev, { role: 'user', content: displayMsg }]);
    setIsTyping(true);

    try {
      const { extractAge, extractWeight, extractBudget, HEALTH_KEYWORD_MAP } = await import('@/lib/parser');
      const lowerInput = userMessage.toLowerCase();
      let nextStep = step;
      let botResponse = '';
      let currentInfo = { ...parsedInfo };
      let isValid = false;
      let skipToNext = false;

      const getNextStep = (info: ParsedPetInfo) => {
        if (info.pet_type === undefined) return { step: 0, text: "I got some details, but is your pet a 🐱 cat or 🐶 dog?" };
        if (info.age_years === undefined) return { step: 1, text: `Got it! A ${info.pet_type || 'pet'}. How old are they?\n(e.g. '2 years', '6 months')` };
        if (info.health_issues === undefined) return { step: 3, text: `Any health issues I should know about?\nYou can tap the options below, type them out, or say 'none'.` };
        if (info.budget_monthly_max === undefined) return { step: 5, text: `Almost done! What's your monthly budget for pet food?\n(e.g. '$30', '$50', '$80')` };
        return { step: 6, text: `Got it all! 🐾 ${info.pet_type === 'cat' ? '🐱' : '🐶'} Finding the best matches...` };
      };

      const handleRetry = (failMsg: string) => {
        if (retries >= 1) {
          skipToNext = true;
          setRetries(0);
        } else {
          botResponse = failMsg;
          setRetries(prev => prev + 1);
        }
      };

      if (step === 0) {
        const greetings = ['hi', 'hey', 'hello', 'sup', 'good morning', 'greetings'];
        const isGreeting = greetings.some(g => lowerInput === g || lowerInput.startsWith(g + ' '));

        if (isGreeting && !lowerInput.includes('cat') && !lowerInput.includes('dog')) {
          isValid = true;
          nextStep = 0; // Stay on step 0
          setRetries(0);
          botResponse = "Hey there! 😊 So let's find the perfect food for your pet — is your pet a 🐱 cat or 🐶 dog?";
        } else {
          // ── Robust Multi-field Extraction ──
          
          // 1. Pet type
          if (lowerInput.includes('cat') || lowerInput.includes('kitten')) currentInfo.pet_type = 'cat';
          else if (lowerInput.includes('dog') || lowerInput.includes('pup')) currentInfo.pet_type = 'dog';

          // 2. Age: any number followed by 'year', 'month', 'yr', 'mo'
          const ageMatch = lowerInput.match(/(\d+(?:\.\d+)?)\s*(year|yr|month|mo)/);
          if (ageMatch) {
            const val = parseFloat(ageMatch[1]);
            const isMonth = ageMatch[2].startsWith('mo');
            currentInfo.age_years = isMonth ? val / 12 : val;
          } else {
            const ageRes = await (async () => { const { extractAge } = await import('@/lib/parser'); return extractAge(userMessage); })();
            if (ageRes) currentInfo.age_years = ageRes.unit === 'months' ? ageRes.value / 12 : ageRes.value;
          }

          // 3. Budget: number with $, dollar, budget, under, around
          const budgetMatch = lowerInput.match(/(?:\$|dollars?|budget|under|around)\s*(\d+)/) || lowerInput.match(/(\d+)\s*(?:\$|dollars?|budget)/);
          if (budgetMatch) {
            currentInfo.budget_monthly_max = parseInt(budgetMatch[1], 10);
          } else {
            const budgetRes = await (async () => { const { extractBudget } = await import('@/lib/parser'); return extractBudget(userMessage); })();
            if (budgetRes) currentInfo.budget_monthly_max = budgetRes;
          }

          // 4. Health issues
          const issues: any[] = [];
          if (lowerInput.match(/anxiety|stress/)) issues.push('anxiety');
          if (lowerInput.match(/sensitive stomach|stomach|digestion/)) issues.push('sensitive_stomach');
          if (lowerInput.match(/allergies|allergy|itch/)) issues.push('allergies');
          if (lowerInput.match(/joint|hip/)) issues.push('joint');
          if (lowerInput.match(/weight|fat|overweight/)) issues.push('weight_control');
          if (lowerInput.match(/picky/)) issues.push('picky_eater');
          
          if (issues.length > 0) {
            currentInfo.health_issues = issues as any;
          }

          const extractedCount = [
            currentInfo.pet_type !== undefined,
            currentInfo.age_years !== undefined,
            currentInfo.budget_monthly_max !== undefined,
            currentInfo.health_issues !== undefined
          ].filter(Boolean).length;

          if (extractedCount === 0) {
            isValid = false;
          } else {
            isValid = true;
            setRetries(0);

            // Figure out the FIRST missing field and skip to that question
            const next = getNextStep(currentInfo);
            nextStep = next.step;
            botResponse = next.text;
          }

          if (!isValid) {
            handleRetry("I didn't quite catch that. Is your pet a cat or a dog?");
            if (skipToNext) {
              currentInfo.pet_type = 'dog';
              const next = getNextStep(currentInfo);
              nextStep = next.step;
              botResponse = next.text;
            }
          }
        }
      } else if (step === 1) {
        const ageRes = extractAge(userMessage);
        if (ageRes !== undefined) {
          if (ageRes.unit === 'unknown') {
            setTempAge(ageRes.value);
            isValid = true;
            nextStep = 1.5;
            setRetries(0);
            botResponse = `Got it! Is that ${ageRes.value} years or months?`;
          } else {
            currentInfo.age_years = ageRes.value;
            isValid = true;
            const next = getNextStep(currentInfo);
            nextStep = next.step;
            setRetries(0);
            botResponse = next.text;
          }
        } else {
          handleRetry("I didn't quite catch the age. How old are they in years or months?");
          if (skipToNext) {
            currentInfo.age_years = null as any;
            const next = getNextStep(currentInfo);
            nextStep = next.step;
            botResponse = next.text;
          }
        }
      } else if (step === 1.5) {
        if (lowerInput.includes('month') || lowerInput.includes('mo')) {
          currentInfo.age_years = (tempAge || 0) / 12;
          isValid = true;
        } else if (lowerInput.includes('year') || lowerInput.includes('yr')) {
          currentInfo.age_years = tempAge || 0;
          isValid = true;
        }
        if (isValid) {
          setTempAge(null);
          const next = getNextStep(currentInfo);
          nextStep = next.step;
          setRetries(0);
          botResponse = next.text;
        } else {
          handleRetry("Sorry, is that years or months?");
          if (skipToNext) {
             currentInfo.age_years = tempAge || 0;
             setTempAge(null);
             const next = getNextStep(currentInfo);
             nextStep = next.step;
             botResponse = next.text;
          }
        }
      } else if (step === 3) {
        if (forceChipsSubmit) {
          if (selectedChips.includes('none')) {
            currentInfo.health_issues = [];
          } else {
            currentInfo.health_issues = selectedChips as any;
          }
          isValid = true;
        } else {
          const vagueAnswers = ['none', 'no', 'nothing', 'na', 'n/a'];
          if (vagueAnswers.some(v => lowerInput === v)) {
             currentInfo.health_issues = [];
             isValid = true;
          } else {
             const issues: any[] = [];
             for (const [tag, keywords] of Object.entries(HEALTH_KEYWORD_MAP)) {
               if (keywords.some(k => lowerInput.includes(k))) issues.push(tag);
             }
             if (issues.length > 0) {
               currentInfo.health_issues = issues;
               isValid = true;
             }
          }
        }
        
        if (isValid) {
          const next = getNextStep(currentInfo);
          nextStep = next.step;
          setRetries(0);
          botResponse = next.text;
        } else {
          handleRetry("I didn't recognize those health issues. Could you pick from the list or say 'none'?");
          if (skipToNext) {
            currentInfo.health_issues = [];
            const next = getNextStep(currentInfo);
            nextStep = next.step;
            botResponse = next.text;
          }
        }
      } else if (step === 5) {
        const budget = extractBudget(userMessage);
        if (budget !== undefined) {
          currentInfo.budget_monthly_max = budget;
          isValid = true;
          const next = getNextStep(currentInfo);
          nextStep = next.step;
          setRetries(0);
          botResponse = next.text;
        } else {
          handleRetry("I didn't quite catch the budget. Could you give a dollar amount like '$50'?");
          if (skipToNext) {
             currentInfo.budget_monthly_max = 60; // Default fallback as requested
             const next = getNextStep(currentInfo);
             nextStep = next.step;
             botResponse = next.text;
          }
        }
      }

      setParsedInfo(currentInfo);

      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { role: 'assistant', content: botResponse }]);
        setStep(nextStep);

        if (nextStep === 6) {
          setTimeout(() => {
             const params = new URLSearchParams();
             if (currentInfo.pet_type) params.append('pet_type', currentInfo.pet_type);
             if (currentInfo.age_years !== undefined) params.append('age_years', currentInfo.age_years.toString());
             if (currentInfo.budget_monthly_max !== undefined) params.append('budget', currentInfo.budget_monthly_max.toString());
             if (currentInfo.health_issues && currentInfo.health_issues.length > 0) {
               params.append('issues', currentInfo.health_issues.join(','));
             }
             if (selectedBrand) params.append('brand', selectedBrand);
             // Save for returning user
             try {
               localStorage.setItem(STORAGE_KEY, JSON.stringify({
                 petType: currentInfo.pet_type,
                 searchParams: params.toString(),
               }));
             } catch (_) {}
             router.push(`/results?${params.toString()}`);
          }, 1500);
        }
      }, 800);

    } catch (err) {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: "Oops, something went wrong. Could you try saying that again?" }]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitInput(input);
  };

  const getQuestionNumber = (s: number): number => {
    const floor = Math.floor(s);
    if (floor === 0) return 1;
    if (floor === 1) return 2;
    if (floor === 3) return 3;
    if (floor === 5) return 4;
    return 4;
  };

  const getProgressPercentage = (s: number): number => {
    const floor = Math.floor(s);
    if (floor === 0) return 0;
    if (floor === 1) return 25;
    if (floor === 3) return 50;
    if (floor === 5) return 75;
    if (floor === 6) return 100;
    return 100;
  };

  const progress = getProgressPercentage(step);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDFAF7', display: 'flex', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#FFFFFF', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #E8DDD4' }}>

        {/* Returning User Banner */}
        {returnBanner && step === 0 && (
          <div style={{ background: '#F5EDE4', borderBottom: '1px solid #E8D5C0', padding: '14px 20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#191919', marginBottom: '8px' }}>
              👋 Welcome back! Search again for your {returnBanner.petType}?
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setReturnBanner(null); router.push(`/results?${returnBanner.params}`); }}
                style={{ flex: 1, background: '#8B5E3C', color: '#fff', border: 'none', borderRadius: '50px', padding: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                Yes, show results →
              </button>
              <button
                onClick={() => { setReturnBanner(null); try { localStorage.removeItem(STORAGE_KEY); } catch(_) {} }}
                style={{ flex: 1, background: '#fff', color: '#8B5E3C', border: '1.5px solid #E8D5C0', borderRadius: '50px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                No, start over
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <header style={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 20, display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid #F5EDE4' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', transform: 'scale(1.4)', transformOrigin: 'left center', margin: '-15px 0' }}>
                <img src="/Logo.png" alt="Lumo Bites" style={{ height: '70px', width: 'auto', display: 'block', objectFit: 'contain' }} />
                <sup style={{ fontSize: '10px', color: '#8B5A2B', fontWeight: 'bold', alignSelf: 'flex-start', marginTop: '12px', marginLeft: '2px', fontFamily: 'sans-serif', userSelect: 'none' }}>™</sup>
              </div>
            </Link>
            <p className="text-xs text-[#8B5E3C] font-semibold">Question {getQuestionNumber(step)} of 4</p>
          </div>
          {selectedBrand && (
            <div className="bg-[#8B5E3C] text-white py-1.5 px-4 text-[11px] font-bold text-center uppercase tracking-wider">
               Finding the best {selectedBrand} products for your pet 🐾
            </div>
          )}
          <div style={{ width: '100%', height: '4px', backgroundColor: '#F5EDE4', borderRadius: '100px', overflow: 'hidden' }}>
            <div style={{ height: '100%', backgroundColor: '#8B5E3C', borderRadius: '100px', transition: 'width 0.4s ease', width: `${progress}%` }}></div>
          </div>
        </header>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#FAFAFA' }}>
          {messages.map((m, i) => (
            <ChatBubble key={i} role={m.role} content={m.content} />
          ))}
          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start', backgroundColor: '#EEEEEE', padding: '12px 16px', borderRadius: '16px', borderBottomLeftRadius: '4px' }}>
              <div style={{ width: '6px', height: '6px', backgroundColor: '#888888', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }}></div>
              <div style={{ width: '6px', height: '6px', backgroundColor: '#888888', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></div>
              <div style={{ width: '6px', height: '6px', backgroundColor: '#888888', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></div>
            </div>
          )}
          
          {/* Interactive Health Chips UI */}
          {step === 3 && !isTyping && (
             <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                   {healthOptions.map(opt => {
                     const isSelected = selectedChips.includes(opt.id);
                     return (
                       <button
                         key={opt.id}
                         onClick={() => toggleChip(opt.id)}
                         style={{
                           width: '100%',
                           textAlign: 'left',
                           padding: '12px 16px',
                           borderRadius: '12px',
                           fontSize: '14px',
                           fontWeight: 600,
                           cursor: 'pointer',
                           transition: 'all 0.2s ease',
                           border: `1px solid #8B5E3C`,
                           backgroundColor: isSelected ? '#8B5E3C' : '#FFFFFF',
                           color: isSelected ? '#FFFFFF' : '#8B5E3C',
                         }}
                       >
                         {opt.label}
                       </button>
                     );
                   })}
                </div>
                {selectedChips.length > 0 && (
                  <button 
                    onClick={() => submitInput('', true)}
                    style={{ width: '100%', backgroundColor: '#8B5E3C', color: '#FFFFFF', border: 'none', padding: '14px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(139, 94, 60, 0.2)' }}
                  >
                    Continue →
                  </button>
                )}
             </div>
          )}

          {/* Interactive Food Type Chips UI */}
          {step === 4 && !isTyping && (
             <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                   {foodOptions.map(opt => {
                     const isSelected = selectedFoodType === opt.id;
                     return (
                       <button
                         key={opt.id}
                         onClick={() => toggleChip(opt.id)}
                         style={{
                           width: '100%',
                           textAlign: 'left',
                           padding: '12px 16px',
                           borderRadius: '12px',
                           fontSize: '14px',
                           fontWeight: 600,
                           cursor: 'pointer',
                           transition: 'all 0.2s ease',
                           border: `1px solid #8B5E3C`,
                           backgroundColor: isSelected ? '#8B5E3C' : '#FFFFFF',
                           color: isSelected ? '#FFFFFF' : '#8B5E3C',
                         }}
                       >
                         {opt.label}
                       </button>
                     );
                   })}
                </div>
                {selectedFoodType !== '' && (
                  <button 
                    onClick={() => submitInput('', true)}
                    style={{ width: '100%', backgroundColor: '#8B5E3C', color: '#FFFFFF', border: 'none', padding: '14px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(139, 94, 60, 0.2)' }}
                  >
                    Continue →
                  </button>
                )}
             </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '20px', borderTop: '1px solid #E8DDD4', backgroundColor: '#FFFFFF' }}>
          {step < 6 && (
            <div className="mb-4 text-center px-4 py-2 bg-[#FDFAF7] rounded-xl border border-[#F5EDE4]">
               <p className="text-[11px] text-[#8B5E3C] font-bold uppercase tracking-wider mb-1">Why this matters</p>
               <p className="text-xs text-[#666666] leading-snug">
                  {Math.floor(step) === 0 && "Helps us filter for species-specific nutritional needs"}
                  {Math.floor(step) === 1 && "Helps us find food for the right life stage"}
                  {Math.floor(step) === 2 && "Helps calculate the right portion and calorie needs"}
                  {Math.floor(step) === 3 && "We'll prioritize ingredients that help with these conditions"}
                  {Math.floor(step) === 4 && "We'll focus on your pet's preferred texture and type"}
                  {Math.floor(step) === 5 && "We only show options within your monthly budget"}
               </p>
            </div>
          )}
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type here..."
              style={{ flex: 1, backgroundColor: '#F9F9F9', border: '1px solid #EAEAEA', borderRadius: '50px', padding: '14px 20px', fontSize: '15px', color: '#191919', outline: 'none' }}
              disabled={step === 6 || isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || step === 6 || isTyping}
              style={{ width: '48px', height: '48px', backgroundColor: input.trim() ? '#8B5E3C' : '#D4C1B1', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', cursor: input.trim() ? 'pointer' : 'not-allowed', transition: 'background-color 0.2s', flexShrink: 0 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px', transform: 'translateX(2px)' }}>
                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        ::-webkit-scrollbar {
          width: 0px;
          height: 0px;
        }
      `}} />
    </div>
  );
}
