import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Brain,
  MessageSquare,
  Rocket,
  ArrowRight,
  Sparkles,
  Scale,
  BookOpenCheck,
  Shield,
  Zap,
  GraduationCap,
  PiggyBank,
  MessagesSquare,
  Lightbulb,
  HelpCircle,
  Coffee,
  User,
  Settings,
  CheckCircle,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  BookOpen,
  Layers,
  FileText
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from '@/lib/supabase';
import { FREE_MESSAGE_LIMIT } from '@/lib/subscription';
import { hasActiveSubscription } from '@/lib/subscription';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { OptimizedImage } from '@/components/ui/optimized-image';
import PageLayout from '@/components/askjds/PageLayout';
import { HomepageFlashcardDemo } from '@/components/home/HomepageFlashcardDemo';
import { HomepagePricingSection } from '@/components/home/HomepagePricingSection';
import { TLDRSection } from '@/components/home/TLDRSection';
import { CoursesSection } from '@/components/home/CoursesSection';
import { SectionDivider } from '@/components/home/SectionDivider';
import { NonServicesSection } from '@/components/home/NonServicesSection';
import { AboutSection } from '@/components/home/AboutSection';


// Define the benefits array
const benefits = [
  {
    icon: Shield,
    title: "No Judgment Zone",
    description: "We won't ask why you're learning Crim Pro at 2 AM.",
    color: "text-orange-500",
    gradient: "from-orange-500/20 to-orange-500/5"
  },
  {
    icon: Zap,
    title: "Fast & Accurate",
    description: "Like that one student who always had the perfect cold-call answer.",
    color: "text-blue-500",
    gradient: "from-blue-500/20 to-blue-500/5"
  },
  {
    icon: GraduationCap,
    title: "Trained on Real Law Student Resources",
    description: "Because bar exam prep shouldn't feel like deciphering the Rosetta Stone.",
    color: "text-green-500",
    gradient: "from-green-500/20 to-green-500/5"
  },
  {
    icon: PiggyBank,
    title: "Only $10/Month",
    description: '$10 dolla make you holla (because law school is already expensive enough).',
    color: "text-purple-500",
    gradient: "from-purple-500/20 to-purple-500/5"
  }
];

// Define the chat questions array
const questions = [
  {
    icon: Lightbulb,
    text: "Explain promissory estoppel like I'm five.",
    category: "Concept Clarification",
    color: "text-orange-500",
    bgColor: "bg-orange-500/5"
  },
  {
    icon: HelpCircle,
    text: "What's the difference between negligence and strict liability?",
    category: "Legal Distinctions",
    color: "text-blue-500",
    bgColor: "bg-blue-500/5"
  },
  {
    icon: MessagesSquare,
    text: "Group project gone wrong. Hadley v. Baxendale—what's the damage?",
    category: "Case Analysis",
    color: "text-green-500",
    bgColor: "bg-green-500/5"
  },
  {
    icon: Coffee,
    text: "For negligence, give me a one-paragraph high-yield summary of key rules.",
    category: "Rapid Topic Summaries",
    color: "text-purple-500",
    bgColor: "bg-purple-500/5"
  }
];

// Chat demo images corresponding to the question categories
const chatDemos = [
  {
    id: 'concept-clarification',
    image: '/images/chat/chat_demo_1.png',
    title: 'Concept Clarification',
    description: 'Example: "Explain promissory estoppel like I\'m five."'
  },
  {
    id: 'legal-distinctions', 
    image: '/images/chat/chat_demo_2.png',
    title: 'Legal Distinctions',
    description: 'Example: "What\'s the difference between negligence and strict liability?"'
  },
  {
    id: 'case-analysis',
    image: '/images/chat/chat_demo_3.png', 
    title: 'Case Analysis',
    description: 'Example: "Group project gone wrong. Hadley v. Baxendale—what\'s the damage?"'
  },
  {
    id: 'rapid-summaries',
    image: '/images/chat/chat_demo_4.png',
    title: 'Rapid Topic Summaries', 
    description: 'Example: "For negligence, give me a one-paragraph high-yield summary of key rules."'
  }
];

// Define the flashcard demo features array
const flashcardFeatures = [
  {
    icon: Brain,
    text: "Cut the noise. Focus on what's left. Mark cards as mastered, skip the ones you know, and drill what you don't — all in one seamless view.",
    category: "Study Mode",
    color: "text-orange-500",
    bgColor: "bg-orange-500/5"
  },
  {
    icon: BookOpen,
    text: "Organize your law life, one subject at a time. Stay organized with built-in subject structure—less mess, more mastery.",
    category: "Subjects",
    color: "text-blue-500",
    bgColor: "bg-blue-500/5"
  },
  {
    icon: Layers,
    text: "Make your own mini decks. Group flashcards however your brain works — by exam, topic, or your professor's favorite trick questions.",
    category: "Collections",
    color: "text-green-500",
    bgColor: "bg-green-500/5"
  },
  {
    icon: FileText,
    text: "Study-ready and lightning-fast. Search, filter, mark mastered. Study smarter with a flashcard system designed to keep pace with your busy schedule.",
    category: "Flashcards",
    color: "text-purple-500",
    bgColor: "bg-purple-500/5"
  },
  {
    icon: FileText,
    text: "Unlimited. Intuitive. Yours. Add as many flashcards as you want with a free account. Tag them, group them, and come back anytime.",
    category: "Create Flashcards",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/5"
  }
];

// Flashcard demo images corresponding to the flashcard features
const flashcardDemos = [
  {
    id: 'core-subject',
    image: '/images/flashcards/flashcard_demo_1.png',
    title: 'Study Mode',
    description: 'Cut the noise. Focus on what\'s left.'
  },
  {
    id: 'concept-breakdown', 
    image: '/images/flashcards/flashcard_demo_2.png',
    title: 'Subjects',
    description: 'Organize your law life, one subject at a time.'
  },
  {
    id: 'exam-focused',
    image: '/images/flashcards/flashcard_demo_3.png', 
    title: 'Collections',
    description: 'Make your own mini decks.'
  },
  {
    id: 'memory-reinforcement',
    image: '/images/flashcards/flashcard_demo_4.png',
    title: 'Flashcards', 
    description: 'Study-ready and lightning-fast.'
  },
  {
    id: 'create-flashcards',
    image: '/images/flashcards/flashcard_demo_5.png',
    title: 'Create Flashcards',
    description: 'Unlimited. Intuitive. Yours.'
  }
];

export function HomePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const checkSubscription = async () => {
      if (user) {
        try {
          setLoading(true);
          const hasActiveSubResult = await hasActiveSubscription(user.id);
          if (isMounted) {
            setHasSubscription(hasActiveSubResult);
          }
        } catch (error) {
          console.error("Error checking subscription:", error);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };

    // Check subscription if user exists
    if (user) {
      checkSubscription();
    }
    
    return () => {
      isMounted = false;
    };
  }, [user]); // Only rerun if user changes

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isModalOpen && !isFlashcardModalOpen) return;
      
      switch (e.key) {
        case 'Escape':
          if (isModalOpen) closeModal();
          if (isFlashcardModalOpen) closeFlashcardModal();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isModalOpen, isFlashcardModalOpen]);

  // Global keyboard navigation for carousel
  useEffect(() => {
    const handleGlobalKeyPress = (e: KeyboardEvent) => {
      // Only handle if no input/textarea is focused and modal is not open
      if (isModalOpen || isFlashcardModalOpen || document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      switch (e.key) {
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
      }
    };

    document.addEventListener('keydown', handleGlobalKeyPress);
    return () => document.removeEventListener('keydown', handleGlobalKeyPress);
  }, [isModalOpen, isFlashcardModalOpen]);

  const handleSignOut = async () => {
    console.log('HomePage: Sign out button clicked');
    try {
      await signOut();
      // Force a page reload to clear any stale state
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      // Force a page reload as a fallback
      window.location.href = '/';
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % chatDemos.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + chatDemos.length) % chatDemos.length);
  };

  const nextFlashcard = () => {
    setCurrentFlashcardIndex((prev) => (prev + 1) % flashcardDemos.length);
  };

  const prevFlashcard = () => {
    setCurrentFlashcardIndex((prev) => (prev - 1 + flashcardDemos.length) % flashcardDemos.length);
  };

  const openModal = (index: number) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openFlashcardModal = (index: number) => {
    setCurrentFlashcardIndex(index);
    setIsFlashcardModalOpen(true);
  };

  const closeFlashcardModal = () => {
    setIsFlashcardModalOpen(false);
  };
  
  return (
    <PageLayout hideFooter>
    <div 
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white force-light-mode"
      style={{ 
        minHeight: '100vh',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Hero Section */}
        <section id="top" className="pt-16 pb-16 md:pt-20 md:pb-24 relative overflow-hidden">
          <div className="absolute inset-0 animated-gradient opacity-60"></div>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#F37022]/10 rounded-full filter blur-3xl animate-float-slow"></div>
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#00178E]/10 rounded-full filter blur-3xl animate-float-medium"></div>
          </div>
          <div className="max-w-4xl mx-auto px-4 box-border relative z-10">
            {/* Hero Logo Section - Larger, vertically stacked */}
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="relative w-40 h-40 mb-3">
                <div className="absolute -top-4 -right-4 animate-float-delayed z-0">
                  <Scale className="w-12 h-12 text-[#F5B111] opacity-60" />
                </div>
                <div className="absolute -bottom-3 -left-4 animate-float z-0">
                  <BookOpenCheck className="w-12 h-12 text-[#9333EA] opacity-70" />
                </div>
                <div className="absolute -bottom-4 -right-3 z-0">
                  <Sparkles className="w-10 h-10 text-[#38BDF8] animate-pulse" />
                </div>
                <div className="absolute top-0 left-0 animate-float-slow z-10">
                  <Brain className="w-32 h-32 text-[#F37022]" />
                </div>
              </div>
              <span className="text-5xl font-bold text-black">Ask JDS</span>
            </div>

            {/* Hero Content */}
            <div className="text-center mt-16">
              <h1 className="text-3xl md:text-5xl font-bold text-black mb-8">
                The <i className="text-[#F37022]">Law Study Buddy</i> that won't judge you for procrastinating.
              </h1>

              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Here for your panic sessions, your bar meltdown, and yes, when you forget the rule against perpetuities (again).
              </p>

              <div className="flex flex-col md:flex-row gap-4 mt-8 justify-center">
                {user ? (
                  <button 
                    onClick={() => navigate('/chat')}
                    className="bg-[#F37022] hover:bg-[#E35D10] text-white font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Start Chatting
                  </button>
                ) : (
                  <Link 
                    to="/auth?tab=signup"
                    className="bg-[#F37022] hover:bg-[#E35D10] text-white font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Rocket className="w-5 h-5" />
                    Sign Up
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

      {/* TL;DR Section */}
      <TLDRSection />

      {/* What Can You Ask? - Chat Section */}
      <section className="py-20 bg-gray-50 overflow-x-hidden">
        <SectionDivider label="Chat" className="mb-20" />
        <div className="max-w-6xl mx-auto px-4 box-border">
          <div className="text-center mb-16">
            <h2 id="chat" className="text-4xl font-bold text-black mb-4" style={{scrollMarginTop: '6rem'}}>Chat Your Way Through Law School</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get instant answers without group chat chaos. No dumb questions, no side-eyes. Just real explanations when you need them.
            </p>
            <p className="text-lg text-gray-500 max-w-xl mx-auto mt-2 italic">
              Try it when your outline isn't outlining.
            </p>
          </div>
          
          {/* How It Works - moved from separate section */}
          <div className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <MessageSquare className="w-12 h-12 text-[#00178E] mb-4" />
                <h3 className="text-2xl font-semibold mb-2 text-[#F37022]">Ask a Question</h3>
                <p className="text-gray-600">Type in your legal query. Bar prep, case law, general despair—it's all fair game.</p>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <Brain className="w-12 h-12 text-[#00178E] mb-4" />
                <h3 className="text-2xl font-semibold mb-2 text-[#F37022]">Get an Answer</h3>
                <p className="text-gray-600">Powered by legal outlines, case summaries, and the AI equivalent of an over-caffeinated law nerd.</p>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <Rocket className="w-12 h-12 text-[#00178E] mb-4" />
                <h3 className="text-2xl font-semibold mb-2 text-[#F37022]">Master the Topic</h3>
                <p className="text-gray-600">We can't guarantee an A, but we can make sure you at least sound like you know what you're talking about.</p>
              </div>
            </div>
          </div>
          
          {/* See It in Action Header */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-black mb-2">See It in Action</h3>
          </div>

          {/* Single Question Card with Image - Synced */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200">
              
              <div className="relative p-8">
                {/* Gradient Background - only covers content area, not bottom banner */}
                <div className={`absolute inset-0 bg-gradient-to-br ${questions[currentImageIndex].bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                
                {/* Question Content */}
                <div className="relative flex items-start space-x-6 mb-6">
                  <div className={`${questions[currentImageIndex].color} p-3 rounded-lg`}>
                    {React.createElement(questions[currentImageIndex].icon, { className: "w-12 h-12" })}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-2xl font-semibold ${questions[currentImageIndex].color} mb-2`}>
                      {questions[currentImageIndex].category}
                    </h3>
                    <p className="text-lg text-gray-600 group-hover:text-gray-700 transition-colors italic">
                      "{questions[currentImageIndex].text}"
                    </p>
                  </div>
                </div>

                {/* Integrated Image */}
                <div className="relative bg-gray-50 rounded-lg overflow-hidden">
                  <img 
                    src={chatDemos[currentImageIndex].image} 
                    alt={chatDemos[currentImageIndex].title}
                    className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => openModal(currentImageIndex)}
                  />
                  <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Bottom Navigation Bar */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex-shrink-0">
                <div className="flex justify-between items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prevImage}
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  <div className="flex space-x-2">
                    {chatDemos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-[#F37022]' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextImage}
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flashcards Section */}
      <section className="py-20 bg-orange-50 relative overflow-hidden">
        <SectionDivider label="Flashcards" className="mb-20" />
        <div className="max-w-6xl mx-auto px-4 relative box-border">
          <div className="text-center mb-4">
            <h2 id="flashcards" className="text-4xl font-bold text-black mb-4" style={{scrollMarginTop: '6rem'}}>Need Help Remembering?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Law school isn't just reading. It's remembering. Drill key rules and topics with 400+ expert-created cards. No fluff.
            </p>
            <p className="text-lg text-gray-500 max-w-xl mx-auto mt-2 italic">
              Cold-call killers. No shame, just reps.
            </p>
          </div>
          
          {/* Pop Quiz Header */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-black mb-2">Pop Quiz!</h3>
          </div>
          
          {/* Interactive Flashcard Demo */}
          <HomepageFlashcardDemo />
          
          {/* Feature Items */}
          <div className="text-center mt-16 mb-16">
            <div className="grid md:grid-cols-3 gap-8 mb-6">
              <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm">
                <div className="bg-orange-100 p-3 rounded-full mb-4">
                  <CreditCard className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert-Curated Cards</h3>
                <p className="text-gray-600">Skip all the guesswork. Study high-yield flashcards crafted by law school experts.</p>
              </div>
              <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm">
                <div className="bg-blue-100 p-3 rounded-full mb-4">
                  <BookOpenCheck className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">1-Click Reinforcement</h3>
                <p className="text-gray-600">Review the trickiest topics with targeted practice—so you'll never blank on the tough stuff again.</p>
              </div>
              <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm">
                <div className="bg-green-100 p-3 rounded-full mb-4">
                  <GraduationCap className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Anywhere, Anytime</h3>
                <p className="text-gray-600">Available across all your devices so you can review on the go, between classes, or while waiting for coffee.</p>
              </div>
            </div>
          </div>
          
          {/* See It in Action for Flashcards */}
          <div className="mt-20">
            {/* See It in Action Header */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-black mb-2">See It in Action</h3>
            </div>

            {/* Single Flashcard Feature Card with Image - Synced */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200">
                
                <div className="relative p-8">
                  {/* Gradient Background - only covers content area, not bottom banner */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${flashcardFeatures[currentFlashcardIndex].bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  
                  {/* Feature Content */}
                  <div className="relative flex items-start space-x-6 mb-6">
                    <div className={`${flashcardFeatures[currentFlashcardIndex].color} p-3 rounded-lg`}>
                      {React.createElement(flashcardFeatures[currentFlashcardIndex].icon, { className: "w-12 h-12" })}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-2xl font-semibold ${flashcardFeatures[currentFlashcardIndex].color} mb-2`}>
                        {flashcardFeatures[currentFlashcardIndex].category}
                      </h3>
                      <p className="text-lg text-gray-600 group-hover:text-gray-700 transition-colors">
                        {flashcardFeatures[currentFlashcardIndex].text}
                      </p>
                    </div>
                  </div>

                  {/* Integrated Image */}
                  <div className="relative bg-gray-50 rounded-lg overflow-hidden">
                    <img 
                      src={flashcardDemos[currentFlashcardIndex].image} 
                      alt={flashcardDemos[currentFlashcardIndex].title}
                      className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openFlashcardModal(currentFlashcardIndex)}
                    />
                    <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                      <ZoomIn className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Bottom Navigation Bar */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex-shrink-0">
                  <div className="flex justify-between items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={prevFlashcard}
                      className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>

                    <div className="flex space-x-2">
                      {flashcardDemos.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentFlashcardIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentFlashcardIndex ? 'bg-[#F37022]' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextFlashcard}
                      className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* Courses Section */}
      <CoursesSection />

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50 overflow-x-hidden">
        <SectionDivider label="Pricing" className="mb-20" />
        <div className="max-w-4xl mx-auto text-center px-4 box-border">
          <h2 className="text-4xl font-bold text-black">Simple, Transparent Pricing</h2>
          <p className="text-lg text-gray-600 mt-2">
            Ask JDS. Smarter than your group chat, cheaper than a tutor.
          </p>
        </div>
        <div className="mt-12 px-4 box-border">
          <HomepagePricingSection />
        </div>
      </section>

      <NonServicesSection />

      {/* Benefits */}
      <section className="py-20 bg-gray-50 relative overflow-hidden box-border">
        <div className="max-w-6xl mx-auto px-4 relative box-border">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-4">Why Use Ask JDS?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your personal legal study companion that's always ready to help, without the hefty price tag.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                
                <div className="relative flex items-start space-x-6">
                  <div className={`${benefit.color} p-3 rounded-lg`}>
                    <benefit.icon className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-[#00178E] mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-lg text-gray-600 group-hover:text-gray-700 transition-colors">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* CTA Button */}
          <div className="text-center mt-12">
            {user ? (
              <button 
                onClick={() => navigate('/chat')}
                className="bg-[#F37022] hover:bg-[#E35D10] text-white font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                I've Seen Enough
              </button>
            ) : (
              <Link 
                to="/auth?tab=signup"
                className="bg-[#F37022] hover:bg-[#E35D10] text-white font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
              >
                <Rocket className="w-5 h-5" />
                I've Seen Enough
              </Link>
            )}
          </div>
        </div>
      </section>

      <AboutSection />

      {/* CTA */}
      <section className="py-20 bg-gray-50 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10 box-border">
          <h2 className="text-5xl font-bold text-[#00178E] mb-6">
            {user ? (hasSubscription ? "Thank you for your support." : "Upgrade Your Experience") : "Sign Up Now"}
          </h2>
          <p className="text-2xl text-[#00178E] mb-10">
            {hasSubscription 
              ? "You're all set with your premium subscription. Head to the chat to start asking questions."
              : "Skip the overpriced tutors and questionable Reddit advice— Ask JDS."}
          </p>
          <div className="flex flex-col items-center gap-8">
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              {user ? (
                <button 
                  onClick={() => navigate('/chat')}
                  className="bg-[#F37022] hover:bg-[#E35D10] text-white font-medium py-4 px-8 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-xl"
                >
                  <MessageSquare className="w-6 h-6" />
                  Start Chatting
                </button>
              ) : (
                <Link 
                  to="/auth?tab=signup"
                  className="bg-[#F37022] hover:bg-[#E35D10] text-white font-medium py-4 px-8 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-xl"
                >
                  <Rocket className="w-6 h-6" />
                  Sign Up
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#00178E] text-white py-16 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 box-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <OptimizedImage 
                  src="/images/JDSimplified_Logo_wht.png" 
                  alt="JD Simplified Logo" 
                  className="h-12" 
                />
              </div>
              <p className="text-gray-300 mb-4">
                Your AI-powered law school study companion that helps you understand complex legal concepts, prepare for exams, and boost your confidence.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#top" className="text-gray-300 hover:text-white transition-colors">Home</a>
                </li>
                <li>
                  <Link to="/auth" className="text-gray-300 hover:text-white transition-colors">Sign In</Link>
                </li>
                <li>
                  <Link to="/auth?tab=signup" className="text-gray-300 hover:text-white transition-colors">Sign Up</Link>
                </li>
                {user && (
                  <>
                    <li>
                      <Link to="/chat" className="text-gray-300 hover:text-white transition-colors">Chat</Link>
                    </li>
                    <li>
                      <Link to="/settings" className="text-gray-300 hover:text-white transition-colors">Settings</Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/terms" className="text-gray-300 hover:text-white transition-colors">Terms of Service</Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</Link>
                </li>
                <li>
                  <Link to="/disclaimer" className="text-gray-300 hover:text-white transition-colors">Disclaimer</Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-blue-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} JD Simplified, LLC. All rights reserved.
            </p>
            <p className="text-gray-300 text-sm">
              Made with ❤️ for law students everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>

    {/* Image Enlargement Modal */}
    {isModalOpen && (
      <div 
        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
        onClick={closeModal}
      >
        <div className="relative w-full h-full max-w-[90vw] max-h-[99vh] flex items-center justify-center">
          <button
            onClick={closeModal}
            className="absolute top-6 right-6 bg-black/70 text-white p-3 rounded-full hover:bg-black/90 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={chatDemos[currentImageIndex].image}
            alt={chatDemos[currentImageIndex].title}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    )}

    {/* Flashcard Image Enlargement Modal */}
    {isFlashcardModalOpen && (
      <div 
        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
        onClick={closeFlashcardModal}
      >
        <div className="relative w-full h-full max-w-[90vw] max-h-[99vh] flex items-center justify-center">
          <button
            onClick={closeFlashcardModal}
            className="absolute top-6 right-6 bg-black/70 text-white p-3 rounded-full hover:bg-black/90 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={flashcardDemos[currentFlashcardIndex].image}
            alt={flashcardDemos[currentFlashcardIndex].title}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    )}
    </PageLayout>
  );
}