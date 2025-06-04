import React from 'react';
import { BookOpen, Target, Clock } from 'lucide-react';
import { SectionDivider } from './SectionDivider';

const courseFeatures = [
  {
    icon: Target,
    title: 'Topic-Based Courses',
    description: 'Contracts, Torts, Constitutional Law, and more—taught through Q&A.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-100'
  },
  {
    icon: BookOpen,
    title: 'Mixed Format Lessons',
    description: 'Flashcards, summaries, and examples that actually feel digestible.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100'
  },
  {
    icon: Clock,
    title: 'Guided but Flexible',
    description: 'Go at your pace. Jump in for a refresher or take it from the top.',
    color: 'text-green-500',
    bgColor: 'bg-green-100'
  }
];

export function CoursesSection() {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <SectionDivider label="Courses" className="mb-20" />
      <div className="max-w-6xl mx-auto px-4 relative box-border">
        <div className="text-center mb-4">
          <h2 id="courses" className="text-4xl font-bold text-black mb-4" style={{scrollMarginTop: '6rem'}}>Go Deeper When You're Ready</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Quick refreshers. In-depth walk-throughs. It’s all inside.
          </p>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mt-2 italic">
            Like your professor … but without the tears and judgement.
          </p>
        </div>
        
        {/* Feature Items */}
        <div className="text-center mb-8">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            {courseFeatures.map((feature, index) => (
              <div key={index} className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm">
                <div className={`${feature.bgColor} p-3 rounded-full mb-4`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Course Demo/Preview Area */}
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-[#F37022] to-[#E35D10] rounded-2xl flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Structured Learning, Your Way
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              Each course breaks down complex legal topics into manageable lessons with interactive elements, real examples, and practice questions to reinforce your understanding.
            </p>
            <div className="inline-flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Self-paced learning
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Interactive content
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Progress tracking
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 