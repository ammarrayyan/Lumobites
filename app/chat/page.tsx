'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ChatBubble from '@/components/ChatBubble';
import { ChatMessage, ParsedPetInfo } from '@/lib/types';
import { Brain, Smile, Wheat, Sparkles, Scale, Activity, CheckCircle2, Inbox, ChevronRight, Camera, MessageSquare, ArrowLeft, Upload, Loader2, MessageCircle, Utensils, Heart, PawPrint, Leaf, AlertTriangle, ShoppingCart } from 'lucide-react';
import MobileFoodNav from '@/components/MobileFoodNav';
import AmazonProductCard, { AmazonProductCardSkeleton, AmazonProduct } from '@/components/AmazonProductCard';
import { getSignedInUserEmail } from '@/lib/authHelper';
import AiLimitModal from '@/components/AiLimitModal';

const STORAGE_KEY = 'lumobites_last_search';

export default function ChatPage() {
  const [proEmail, setProEmail] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const syncEmail = () => {
      const email = getSignedInUserEmail();
      setProEmail(email);
      setMounted(true);
    };

    syncEmail();
    window.addEventListener('lumo-pro-update', syncEmail);
    window.addEventListener('lumo-signin-success', syncEmail);

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'lumo_pro_email' || e.key === 'lumo_sitter_email' || e.key === 'lumo_shelter_email') {
        syncEmail();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('lumo-pro-update', syncEmail);
      window.removeEventListener('lumo-signin-success', syncEmail);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  if (!mounted) return null

  if (!proEmail) {
    return (
      <div 
        className="fixed inset-0 flex flex-col items-center justify-center text-center px-4"
        style={{ 
          zIndex: 50, 
          backgroundColor: 'white',
          paddingBottom: 'env(safe-area-inset-bottom, 20px)',
          paddingTop: 'env(safe-area-inset-top, 20px)',
          minHeight: '100dvh'
        }}
      >
        <p className="text-lg font-medium text-[#4A3E3D] mb-2">
          AI Pet Food Assistant
        </p>
        <p className="text-gray-500 mb-6">
          Sign in to use the assistant
        </p>
        <button
          onClick={() => {
            localStorage.setItem('lumo_redirect_after_login', '/chat')
            window.location.href = '/?signin=true'
          }}
          className="bg-[#8B5E3C] text-white px-8 py-3 rounded-xl font-medium"
          style={{
            marginBottom: 'env(safe-area-inset-bottom, 20px)'
          }}
        >
          Sign In — It's Free
        </button>
      </div>
    )
  }

  return <ChatPageContent />
}

function ChatPageContent() {
  const router = useRouter();
  const [flow, setFlow] = useState<'selection' | 'questions' | 'photo'>('selection');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoAnalysisResult, setPhotoAnalysisResult] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoAmazonProducts, setPhotoAmazonProducts] = useState<AmazonProduct[]>([]);
  const [photoAmazonLoading, setPhotoAmazonLoading] = useState(false);
  const [isAiLimitModalOpen, setIsAiLimitModalOpen] = useState(false);
  const [aiLimitReason, setAiLimitReason] = useState<string | null>(null);
  const [aiLimitIsPro, setAiLimitIsPro] = useState<boolean | undefined>(undefined);

  const handleAnalyzePhoto = async () => {
    if (!photoFile) return;
    setPhotoLoading(true);
    setPhotoError(null);
    setPhotoAnalysisResult(null);
    setPhotoAmazonProducts([]);
    setPhotoAmazonLoading(false);

    try {
      const userEmail = getSignedInUserEmail();
      const formData = new FormData();
      formData.append('image', photoFile);
      if (userEmail) formData.append('email', userEmail);

      const res = await fetch('/api/vision-food', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 || data.error?.toLowerCase().includes('limit') || data.error?.toLowerCase().includes('sign in') || data.error?.toLowerCase().includes('checks')) {
          setAiLimitReason(data.error || 'Limit reached');
          if (typeof data.isPro === 'boolean') setAiLimitIsPro(data.isPro);
          setIsAiLimitModalOpen(true);
          return;
        }
        throw new Error(data.error || 'Failed to analyze pet photo.');
      }

      setPhotoAnalysisResult(data.analysis);

      // Fetch Amazon product suggestions
      if (data.recommendations && data.recommendations.length > 0) {
        setPhotoAmazonLoading(true);
        try {
          const allProducts: AmazonProduct[] = [];
          const fetchPromises = data.recommendations.map(async (query: string) => {
            try {
              const res = await fetch(`/api/amazon/search?q=${encodeURIComponent(query)}&limit=3`);
              if (res.ok) {
                const searchData = await res.json();
                return searchData.products || [];
              }
            } catch (err) {
              console.error(`Failed to fetch Amazon search for ${query}:`, err);
            }
            return [];
          });

          const results = await Promise.all(fetchPromises);
          for (const list of results) {
            allProducts.push(...list);
          }

          // Deduplicate by ASIN
          const uniqueProducts: AmazonProduct[] = [];
          const seenAsins = new Set<string>();
          for (const prod of allProducts) {
            if (!seenAsins.has(prod.asin)) {
              seenAsins.add(prod.asin);
              uniqueProducts.push(prod);
            }
          }

          setPhotoAmazonProducts(uniqueProducts);
        } catch (err) {
          console.error("Failed fetching Amazon suggestions:", err);
        } finally {
          setPhotoAmazonLoading(false);
        }
      }
    } catch (err: any) {
      console.error(err);
      setPhotoError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setPhotoLoading(false);
    }
  };

  const [step, setStep] = useState(0);
  const [retries, setRetries] = useState(0);
  const [tempAge, setTempAge] = useState<number | null>(null);
  const [returnBanner, setReturnBanner] = useState<{ petType: string; params: string } | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hey! I'm here to help find the perfect food \nfor your pet. Let's start — is your pet a cat \nor dog?" }
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
      const lookupKey = brand.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const BRAND_MAP: Record<string, string> = {
        'hill-s': "Hill's Science Diet",
        'hills': "Hill's Science Diet",
        'hills-science-diet': "Hill's Science Diet",
        'royal-canin': 'Royal Canin',
        'blue-buffalo': 'Blue Buffalo',
        'fancy-feast': 'Fancy Feast',
        'purina': 'Purina',
        'iams': 'Iams',
      };
      const displayBrand = BRAND_MAP[lookupKey] || brand.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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
    { id: 'anxiety', label: 'Anxiety or stress', icon: Brain },
    { id: 'sensitive_stomach', label: 'Sensitive stomach', icon: Smile },
    { id: 'allergies', label: 'Food allergies', icon: Wheat },
    { id: 'picky_eater', label: 'Picky eater', icon: Sparkles },
    { id: 'weight_control', label: 'Weight management', icon: Scale },
    { id: 'joint', label: 'Joint issues', icon: Activity },
    { id: 'none', label: 'None of the above', icon: CheckCircle2 }
  ];

  // Food Type Chips State
  const [selectedFoodType, setSelectedFoodType] = useState<string>('');
  const foodOptions = [
    { id: 'dry', label: 'Dry food (kibble)', icon: Inbox },
    { id: 'wet', label: 'Wet food (canned)', icon: Inbox },
    { id: 'treats', label: 'Treats & snacks', icon: Inbox },
    { id: 'both', label: 'All / No preference', icon: ChevronRight }
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
        if (info.pet_type === undefined) return { step: 0, text: "I got some details, but is your pet a cat or dog?" };
        if (info.age_years === undefined) return { step: 1, text: `Got it! A ${info.pet_type || 'pet'}. How old are they?\n(e.g. '2 years', '6 months')` };
        if (info.health_issues === undefined) return { step: 3, text: `Any health issues I should know about?\nYou can tap the options below, type them out, or say 'none'.` };
        if (info.budget_monthly_max === undefined) return { step: 5, text: `Almost done! What's your monthly budget for pet food?\n(e.g. '$30', '$50', '$80')` };
        return { step: 6, text: "Got it all! Finding the best matches..." };
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
          botResponse = "Hey there! So let's find the perfect food for your pet — is your pet a cat or dog?";
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
    <div className="min-h-screen bg-[#FDFAF7] font-sans flex flex-col items-center px-4 sm:px-6 pb-12 pt-14 md:pt-4 w-full">
      <MobileFoodNav />

      <AiLimitModal
        isOpen={isAiLimitModalOpen}
        onClose={() => setIsAiLimitModalOpen(false)}
        reason={aiLimitReason}
        isPro={aiLimitIsPro}
      />
      
      {flow === 'selection' && (
        <div className="w-full max-w-[440px] bg-white rounded-2xl sm:rounded-3xl border border-[#E8DDD4] shadow-sm overflow-hidden mt-3 p-6 sm:p-8 text-center animate-fade-in flex flex-col items-center">
          {/* Logo */}
          <div className="flex items-center justify-center mb-5">
            <img src="/Logo.png" alt="Lumo Bites" className="h-10 w-auto object-contain block" />
            <sup className="text-[10px] text-[#8B5E3C] font-bold self-start mt-1 ml-0.5 select-none">™</sup>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-[#191919] mb-2 leading-snug tracking-tight">
            How would you like to find the best food for your pet?
          </h2>
          <p className="text-xs sm:text-sm text-[#666666] mb-6 leading-relaxed">
            Choose a method to start finding recommendations
          </p>

          <div className="flex flex-col gap-3.5 w-full">
            {/* Option 1: Upload Pet Photo */}
            <button
              type="button"
              onClick={() => setFlow('photo')}
              className="w-full bg-white hover:bg-[#FAF6F4] border-2 border-[#E8DDD4] hover:border-[#8B5E3C] rounded-2xl p-4 sm:p-5 text-left flex items-start gap-4 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="p-3 bg-[#FAF6F4] group-hover:bg-white text-[#8B5E3C] rounded-xl flex items-center justify-center border border-[#E8DDD4]/60 transition-colors shrink-0 mt-0.5">
                <Camera className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-sm sm:text-base font-bold text-[#191919] mb-1">Upload Pet Photo</span>
                <span className="block text-xs text-[#666666] leading-relaxed">AI analyzes your pet photo and suggests food instantly.</span>
              </div>
            </button>

            {/* Option 2: Answer Questions */}
            <button
              type="button"
              onClick={() => setFlow('questions')}
              className="w-full bg-white hover:bg-[#FAF6F4] border-2 border-[#E8DDD4] hover:border-[#8B5E3C] rounded-2xl p-4 sm:p-5 text-left flex items-start gap-4 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="p-3 bg-[#FAF6F4] group-hover:bg-white text-[#8B5E3C] rounded-xl flex items-center justify-center border border-[#E8DDD4]/60 transition-colors shrink-0 mt-0.5">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-sm sm:text-base font-bold text-[#191919] mb-1">Answer Questions</span>
                <span className="block text-xs text-[#666666] leading-relaxed">Tell us about your pet's age, weight, and health step by step.</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {flow === 'photo' && (
        <div className="w-full max-w-[440px] bg-white rounded-2xl sm:rounded-3xl border border-[#E8DDD4] shadow-sm overflow-hidden mt-3 animate-fade-in flex flex-col">
          {/* Header */}
          <header className="bg-white/95 backdrop-blur-sm px-5 py-4 flex items-center justify-between border-b border-[#E8DDD4] shrink-0">
            <button
              type="button"
              onClick={() => {
                setFlow('selection');
                setPhotoFile(null);
                setPhotoPreview(null);
                setPhotoAnalysisResult(null);
                setPhotoError(null);
              }}
              className="bg-transparent border-none text-[#8B5E3C] hover:text-[#7A5234] text-xs font-bold cursor-pointer flex items-center gap-1 p-0 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex items-center mx-auto">
              <img src="/Logo.png" alt="Lumo Bites" className="h-7 w-auto object-contain block" />
              <sup className="text-[8px] text-[#8B5E3C] font-bold self-start mt-0.5 ml-0.5 select-none">™</sup>
            </div>
            <div className="w-12" />
          </header>

          {/* Body */}
          <div className="p-5 sm:p-6 flex flex-col gap-5 bg-[#FAF6F4]/40">
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-extrabold text-[#191919] mb-1 flex items-center gap-1.5 justify-center">
                <Camera className="w-4 h-4 text-[#8B5E3C]" /> Upload Pet Photo
              </h3>
              <p className="text-xs text-[#666666] leading-relaxed">Take a picture or select one. AI will analyze your pet to suggest ideal foods.</p>
            </div>

            {!photoAnalysisResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                {photoPreview ? (
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '20px', overflow: 'hidden', border: '1px solid #E8DDD4', backgroundColor: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    <button
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                      style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#EF4444', color: '#FFFFFF', border: 'none', borderRadius: '50px', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label style={{ width: '100%', aspectRatio: '1', backgroundColor: '#FFFFFF', border: '2px dashed #C17D3C', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', padding: '24px' }}>
                    <div style={{ padding: '12px', backgroundColor: '#FAF6F4', color: '#8B5E3C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Upload size={24} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#8B5E3C' }}>Choose photo or take picture</span>
                    <span style={{ fontSize: '10px', color: '#BBB' }}>Supports JPG, PNG (Max 5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPhotoFile(file);
                          setPhotoPreview(URL.createObjectURL(file));
                          setPhotoError(null);
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}

                {photoError && (
                  <p style={{ fontSize: '12px', color: '#EF4444', fontWeight: 'bold', textAlign: 'center' }}>{photoError}</p>
                )}

                {photoPreview && (
                  <button
                    onClick={handleAnalyzePhoto}
                    disabled={photoLoading}
                    style={{
                      width: '100%',
                      backgroundColor: '#8B5E3C',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '14px',
                      borderRadius: '50px',
                      fontWeight: 'bold',
                      cursor: photoLoading ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      boxShadow: '0 4px 12px rgba(139, 94, 60, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {photoLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Analyzing pet photo...</span>
                      </>
                    ) : (
                      <span>Analyze & Suggest Food →</span>
                    )}
                  </button>
                )}
              </div>
            )}

            {photoAnalysisResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD4', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8B5E3C', fontWeight: 'bold', fontSize: '13px' }}>
                    <Sparkles size={14} /> AI Analysis & Food Picks
                  </div>
                  <div style={{ fontSize: '13px', color: '#333333', lineHeight: '1.6' }}>
                    {formatMarkdown(photoAnalysisResult)}
                  </div>
                </div>

                {/* Recommended Products (Amazon links) */}
                {(photoAmazonLoading || photoAmazonProducts.length > 0) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#191919', display: 'flex', alignItems: 'center', gap: '6px', margin: '8px 0 4px 0' }}>
                      <ShoppingCart size={18} /> Recommended Products
                    </h4>
                    {photoAmazonLoading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[0, 1, 2].map((i) => (
                          <AmazonProductCardSkeleton key={i} compact={true} />
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {photoAmazonProducts.map((p) => (
                          <AmazonProductCard key={p.asin} product={p} compact={true} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    setPhotoAnalysisResult(null);
                    setPhotoError(null);
                    setPhotoAmazonProducts([]);
                    setPhotoAmazonLoading(false);
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: '#FAF6F4',
                    color: '#8B5E3C',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '50px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Analyze Another Photo
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {flow === 'questions' && (
        <div className="w-full max-w-[440px] h-[calc(100dvh-130px)] bg-white rounded-2xl sm:rounded-3xl border border-[#E8DDD4] shadow-sm overflow-hidden mt-3 flex flex-col">
          {/* Returning User Banner */}
          {returnBanner && step === 0 && (
            <div className="bg-[#F5EDE4] border-b border-[#E8D5C0] p-4 text-left animate-fade-in">
              <p className="text-xs sm:text-sm font-bold text-[#191919] mb-2">
                Welcome back! Search again for your {returnBanner.petType}?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setReturnBanner(null); router.push(`/results?${returnBanner.params}`); }}
                  className="flex-1 bg-[#8B5E3C] hover:bg-[#7A5234] text-white py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer border-none shadow-2xs"
                >
                  Yes, show results →
                </button>
                <button
                  type="button"
                  onClick={() => { setReturnBanner(null); try { localStorage.removeItem(STORAGE_KEY); } catch(_) {} }}
                  className="flex-1 bg-white hover:bg-[#FAF6F4] text-[#8B5E3C] border border-[#E8DDD4] py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  No, start over
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <header className="bg-white px-5 py-3.5 flex flex-col gap-2.5 shrink-0 border-b border-[#E8DDD4]">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => { setFlow('selection'); }}
                className="bg-transparent border-none text-[#8B5E3C] hover:text-[#7A5234] text-xs font-bold cursor-pointer flex items-center gap-1 p-0 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <Link href="/" className="no-underline">
                <div className="flex items-center">
                  <img src="/Logo.png" alt="Lumo Bites" className="h-7 w-auto object-contain block" />
                  <sup className="text-[8px] text-[#8B5E3C] font-bold self-start mt-0.5 ml-0.5 select-none">™</sup>
                </div>
              </Link>
              <span className="text-xs text-[#8B5E3C] font-bold">Question {getQuestionNumber(step)} of 4</span>
            </div>
            {selectedBrand && (
              <div className="bg-[#8B5E3C] text-white py-1 px-3 rounded-md text-[10px] font-bold text-center uppercase tracking-wider">
                 Finding the best {selectedBrand} products for your pet
              </div>
            )}
            <div className="w-full h-1.5 bg-[#FAF6F4] border border-[#E8DDD4] rounded-full overflow-hidden">
              <div className="h-full bg-[#8B5E3C] rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </header>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3.5 bg-[#FAF6F4]/30">
            {messages.map((m, i) => (
              <ChatBubble key={i} role={m.role} content={m.content} />
            ))}
            {isTyping && (
              <div className="flex items-center gap-1.5 self-start bg-white border border-[#E8DDD4] p-3 rounded-2xl shadow-2xs">
                <div className="w-2 h-2 bg-[#8B5E3C] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#8B5E3C] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-[#8B5E3C] rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            )}
            
            {/* Interactive Health Chips UI */}
            {step === 3 && !isTyping && (
               <div className="animate-fade-in flex flex-col gap-2.5 mt-2">
                  <div className="flex flex-col gap-2 w-full">
                     {healthOptions.map(opt => {
                       const isSelected = selectedChips.includes(opt.id);
                       const Icon = opt.icon;
                       return (
                         <button
                           key={opt.id}
                           type="button"
                           onClick={() => toggleChip(opt.id)}
                           className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-between ${
                             isSelected
                               ? 'bg-[#8B5E3C] text-white border-[#8B5E3C] shadow-2xs'
                               : 'bg-white text-[#4A3E3D] hover:bg-[#FAF6F4] border-[#E8DDD4]'
                           }`}
                         >
                           <span className="flex items-center gap-2">
                             <Icon className="w-4 h-4 shrink-0" />
                             {opt.label}
                           </span>
                           {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                         </button>
                       );
                     })}
                  </div>
                  {selectedChips.length > 0 && (
                    <button 
                      type="button"
                      onClick={() => submitInput('', true)}
                      className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer border-none"
                    >
                      Continue <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
               </div>
            )}

            {/* Interactive Food Type Chips UI */}
            {step === 4 && !isTyping && (
               <div className="animate-fade-in flex flex-col gap-2.5 mt-2">
                  <div className="flex flex-col gap-2 w-full">
                     {foodOptions.map(opt => {
                       const isSelected = selectedFoodType === opt.id;
                       const Icon = opt.icon;
                       return (
                         <button
                           key={opt.id}
                           type="button"
                           onClick={() => toggleChip(opt.id)}
                           className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-between ${
                             isSelected
                               ? 'bg-[#8B5E3C] text-white border-[#8B5E3C] shadow-2xs'
                               : 'bg-white text-[#4A3E3D] hover:bg-[#FAF6F4] border-[#E8DDD4]'
                           }`}
                         >
                           <span className="flex items-center gap-2">
                             <Icon className="w-4 h-4 shrink-0" />
                             {opt.label}
                           </span>
                           {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                         </button>
                       );
                     })}
                  </div>
                   {selectedFoodType !== '' && (
                     <button 
                       type="button"
                       onClick={() => submitInput('', true)}
                       className="w-full bg-[#8B5E3C] hover:bg-[#7A5234] text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer border-none"
                     >
                       Continue <ChevronRight className="w-4 h-4" />
                     </button>
                   )}
               </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3.5 sm:p-4 border-t border-[#E8DDD4] bg-white">
            {step < 6 && (
              <div className="mb-3 text-center px-3 py-1.5 bg-[#FAF6F4] rounded-xl border border-[#E8DDD4]">
                 <p className="text-[10px] text-[#8B5E3C] font-bold uppercase tracking-wider mb-0.5">Why this matters</p>
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
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type here..."
                className="flex-1 bg-[#FAF6F4] border border-[#E8DDD4] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#191919] focus:outline-none focus:border-[#8B5E3C] focus:bg-white transition-all placeholder:text-[#8B7E7D]"
                disabled={step === 6 || isTyping}
              />
              <button
                type="submit"
                disabled={!input.trim() || step === 6 || isTyping}
                className="w-10 h-10 bg-[#8B5E3C] hover:bg-[#7A5234] disabled:opacity-40 text-white rounded-xl flex items-center justify-center cursor-pointer disabled:cursor-not-allowed transition-all shrink-0 border-none shadow-2xs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 translate-x-0.5">
                  <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        ::-webkit-scrollbar {
          width: 0px;
          height: 0px;
        }
      `}} />
    </div>
  );
}

function formatMarkdown(text: string) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Check if it's a heading: starts with one or more #
        const headingMatch = trimmed.match(/^(#{1,6})\s*(.*)/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const content = headingMatch[2];
          const parsedContent = parseInlineText(content);
          if (level === 1) return <h1 key={i} style={{ fontSize: '15px', fontWeight: '800', color: '#191919', marginTop: '8px', marginBottom: '4px' }}>{parsedContent}</h1>;
          if (level === 2) return <h2 key={i} style={{ fontSize: '14px', fontWeight: '800', color: '#191919', marginTop: '8px', marginBottom: '4px' }}>{parsedContent}</h2>;
          return <h3 key={i} style={{ fontSize: '13px', fontWeight: '800', color: '#191919', marginTop: '6px', marginBottom: '4px' }}>{parsedContent}</h3>;
        }

        // Check if it is a list item: starts with *, -, or numbers like 1., 2.
        const listMatch = trimmed.match(/^(?:\*|-|\d+\.)\s*(.*)/);
        if (listMatch) {
          const content = listMatch[1];
          return (
            <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'start', paddingLeft: '8px', fontSize: '12px', lineHeight: '1.5', color: '#4A3E3D' }}>
              <span style={{ color: '#8B5E3C', marginTop: '2px', flexShrink: 0 }}>•</span>
              <span style={{ flex: 1 }}>{parseInlineText(content)}</span>
            </div>
          );
        }

        // Default paragraph
        return <p key={i} style={{ fontSize: '12px', lineHeight: '1.5', color: '#4A3E3D', margin: 0 }}>{parseInlineText(trimmed)}</p>;
      })}
    </div>
  );
}

const EMOJI_ICON_MAP: Record<string, React.ReactNode> = {
  '📷': <Camera size={16} className="inline-block mx-1" />,
  '💬': <MessageCircle size={16} className="inline-block mx-1" />,
  '🥩': <Utensils size={16} className="inline-block mx-1" />,
  '🐟': <Utensils size={16} className="inline-block mx-1" />,
  '🫀': <Heart size={16} className="inline-block mx-1" />,
  '🦴': <PawPrint size={16} className="inline-block mx-1" />,
  '🌿': <Leaf size={16} className="inline-block mx-1" />,
  '⚠️': <AlertTriangle size={16} className="inline-block mx-1" />,
  '🐾': <PawPrint size={16} className="inline-block mx-1" />,
  '🐱': <PawPrint size={16} className="inline-block mx-1" />,
};

function parseInlineText(text: string) {
  // Strip all emojis that are not in our map
  const strippedText = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, (match) => {
    if (EMOJI_ICON_MAP[match]) return match;
    return '';
  });

  // Split by bold text OR any of our specific emojis
  const parts = strippedText.split(/(\*\*.*?\*\*|📷|💬|🥩|🐟|🫀|🦴|🌿|⚠️|🐾|🐱)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 'bold', color: '#191919' }}>{part.slice(2, -2)}</strong>;
    }
    if (EMOJI_ICON_MAP[part]) {
      return <span key={i} style={{ color: '#8B5E3C', display: 'inline-flex', verticalAlign: 'text-bottom' }}>{EMOJI_ICON_MAP[part]}</span>;
    }
    return part;
  });
}
