import React from 'react';
import { Link } from 'react-router-dom';

export function AboutSection() {
  return (
    <section className="py-20 bg-white relative overflow-hidden box-border">
      <div className="max-w-6xl mx-auto px-4 relative box-border">
        <div className="flex flex-col lg:flex-row items-center">
          <div className="w-full lg:w-1/3 mb-10 lg:mb-0 flex justify-center lg:justify-start">
            <div className="relative">
              <div className="absolute -top-6 -right-6 w-full h-full border-2 border-[#F37022] rounded-xl"></div>
              <img 
                alt="About JD Simplified" 
                className="w-64 h-64 object-cover rounded-xl relative z-10" 
                src="/images/JD_Simplified_About_Me.jpg" 
              />
            </div>
          </div>
          
          <div className="w-full lg:w-2/3 lg:pl-20">
            <h5 className="inline-block bg-[#F37022]/10 text-[#F37022] px-4 py-1 rounded-full text-sm font-medium mb-4">
              ABOUT ME
            </h5>
            <h2 className="text-3xl font-bold mb-6 text-[#00178E]">
              J.D. grad specializing in strategy-based legal instruction
            </h2>
            <p className="text-gray-600 mb-6">
              Proud mommy of the coolest and kindest kid. Lover of law, math, and tacos. Cheerleader of the underdog, and traveler, hopeless dreamer, and determined sleeper.
              <br />
              <br />
              Law school and bar exam course are unnecessarily complicated, boring, and lacking in quality. Let's do this right. 
            </p>
          </div>
        </div>
      </div>
    </section>
  );
} 