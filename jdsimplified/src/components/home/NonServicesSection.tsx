
import React from 'react';

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

const NonServicesSection = () => {
  return (
    <section className="py-20 bg-gray-50 relative overflow-hidden box-border">
      <div className="max-w-6xl mx-auto px-4 relative box-border">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h5 className="inline-block bg-jdorange/10 text-jdorange px-4 py-1 rounded-full text-sm font-medium mb-4">
            NON-SERVICES
          </h5>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-jdblue">
            I'm Proud to Say I Do Not Offer
          </h2>
          <p className="text-muted-foreground text-lg">
            Unlike traditional law school supplements, I focus on quality over quantity, and strategic learning over rote memorization.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {nonServicesItems.map((item, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-8 border border-gray-100"
            >
              <div className="w-14 h-14 bg-jdorange/10 rounded-lg flex items-center justify-center mb-6">
                <span role="img" aria-label={item.title} className="text-4xl">{item.emoji}</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">{item.title}</h3>
              <p className="text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NonServicesSection;
