import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Rocket } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const nonServicesItems = [
  {
    emoji: "😴",
    title: "Boring Lectures",
    description: "Learning needn't be fun, but boring lectures are counterproductive."
  },
  {
    emoji: "📖",
    title: "Put-You-To-Sleep Textbooks",
    description: "Instead, I offer you a concise approach without sacrificing thoroughness."
  },
  {
    emoji: "📝",
    title: "Unnecessary Workbooks",
    description: "Ugh...you really REALLY do not need a 100+ page workbook."
  },
  {
    emoji: "❓",
    title: "Overrated Question Banks",
    description: "Alright...these are helpful. 🙄 I'm working on it. I'm a one-man show. Chill."
  },
  {
    emoji: "📊",
    title: "Analytics",
    description: "These add to the illusion of productivity but fail to accurately reflect readiness."
  },
  {
    emoji: "👎",
    title: "Ugly People",
    description: "Kiiiidding! But instead of looking at people, you will get visuals of legal concepts."
  }
];

export function NonServicesSection() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-white relative overflow-hidden box-border">
      <div className="max-w-6xl mx-auto px-4 relative box-border">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h5 className="inline-block bg-[#F37022]/10 text-[#F37022] px-4 py-1 rounded-full text-sm font-medium mb-4">
            NON-SERVICES
          </h5>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#00178E]">
            I'm Proud to Say I Do Not Offer
          </h2>
          <p className="text-gray-600 text-lg">
            Unlike traditional law school supplements, I focus on quality over quantity, and strategic learning over rote memorization.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {nonServicesItems.map((item, index) => (
            <div 
              key={index} 
              className="bg-gray-50 rounded-xl shadow-sm hover:shadow-md transition-all p-8 border border-gray-100"
            >
              <div className="w-14 h-14 bg-[#F37022]/10 rounded-lg flex items-center justify-center mb-6">
                <span role="img" aria-label={item.title} className="text-4xl">{item.emoji}</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-black">{item.title}</h3>
              <p className="text-gray-600">
                {item.description}
              </p>
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
              Get the Good Stuff
            </button>
          ) : (
            <Link 
              to="/auth?tab=signup"
              className="bg-[#F37022] hover:bg-[#E35D10] text-white font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              <Rocket className="w-5 h-5" />
              Get the Good Stuff
            </Link>
          )}
        </div>
      </div>
    </section>
  );
} 