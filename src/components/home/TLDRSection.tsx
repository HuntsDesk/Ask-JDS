import React from 'react';
import { MessageSquare, CreditCard, BookOpen, ArrowRight } from 'lucide-react';

const features = [
  {
    id: 'chat',
    icon: MessageSquare,
    title: 'Real-time Legal Answers',
    description: 'Ask anything from “what’s negligence?” to “does this MBE question even make sense?',
    anchor: '#chat',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/5',
    hoverBg: 'hover:bg-orange-50'
  },
  {
    id: 'flashcards',
    icon: CreditCard,
    title: '1-Click Reinforcement',
    description: 'Study smarter, not longer—with high-yield flashcards that actually stick.',
    anchor: '#flashcards',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/5',
    hoverBg: 'hover:bg-blue-50'
  },
  {
    id: 'courses',
    icon: BookOpen,
    title: 'Courses That Don’t Suck',
    description: 'Tackle tough concepts with structured breakdowns — no fluff, just straight-up clarity.',
    anchor: '#courses',
    color: 'text-green-500',
    bgColor: 'bg-green-500/5',
    hoverBg: 'hover:bg-green-50'
  }
];

export function TLDRSection() {
  const handleFeatureClick = (anchor: string) => {
    const element = document.querySelector(anchor);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 box-border">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-black mb-4">TL;DR: You’re Not Just Here to Chat</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            You're not just here to ask questions. You're here to actually learn stuff (maybe at 2am).
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              onClick={() => handleFeatureClick(feature.anchor)}
              className={`group relative bg-white rounded-xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden ${feature.hoverBg}`}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              <div className="relative flex flex-col items-center text-center">
                {/* Feature Number */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm font-medium text-gray-400 tracking-wide">
                    0{index + 1}
                  </span>
                  <div className={`${feature.color} p-3 rounded-lg`}>
                    <feature.icon className="w-8 h-8" />
                  </div>
                </div>
                
                <div>
                  <h3 className={`text-2xl font-semibold ${feature.color} mb-3`}>
                    {feature.title}
                  </h3>
                  <p className="text-lg text-gray-600 group-hover:text-gray-700 transition-colors mb-4">
                    {feature.description}
                  </p>
                  
                  {/* Arrow indicator */}
                  <div className="flex items-center justify-center text-gray-400 group-hover:text-gray-600 transition-colors">
                    <span className="text-sm font-medium mr-2">Learn more</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 