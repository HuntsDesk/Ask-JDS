import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';

const AppFeaturesSection = () => {
  return (
    <div className="relative overflow-hidden box-border">
      <div className="py-16 relative overflow-hidden box-border">
        <div className="max-w-6xl mx-auto px-4 relative box-border">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-jdblue mb-6">
              Everything You Need For Law School Success
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our comprehensive app is designed to help law students learn efficiently, study effectively, and excel in their exams.
            </p>
          </div>
        </div>
      </div>
      
      {/* AI Study Buddy Section */}
      <section className="py-20 bg-white relative overflow-hidden box-border">
        <div className="max-w-6xl mx-auto px-4 relative box-border">
          <div className="flex flex-col-reverse md:flex-row md:items-center gap-12">
            <div className="md:w-1/2">
              <div className="max-w-lg">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-jdblue">AI Study Buddy</h3>
                <p className="text-lg mb-6 text-muted-foreground">
                  Ask burning law school and bar prep questions to friendly AI Law Nerd who won't shame you for forgetting the rule against perpetuities (again).
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-jdorange mr-3 mt-1 flex-shrink-0" />
                    <span>Ask questions about any legal concept</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-jdorange mr-3 mt-1 flex-shrink-0" />
                    <span>Get clear, concise explanations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-jdorange mr-3 mt-1 flex-shrink-0" />
                    <span>Available 24/7 for studying support</span>
                  </li>
                </ul>
                <Link to="/chat" className="inline-flex items-center py-3 px-6 bg-jdorange hover:bg-jdorange-dark text-white font-medium rounded-lg transition-colors group">
                  Start Chatting
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 mb-8 md:mb-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-jdorange/30 to-transparent rounded-lg -rotate-3 scale-105"></div>
                <img 
                  src="/images/JDSimplified_Logo.png" 
                  alt="AI Chat Assistant"
                  className="w-full h-auto rounded-lg shadow-lg relative"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Flashcards Section */}
      <section className="py-20 bg-gray-50 relative overflow-hidden box-border">
        <div className="max-w-6xl mx-auto px-4 relative box-border">
          <div className="flex flex-col md:flex-row md:items-center gap-12">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/30 to-transparent rounded-lg rotate-3 scale-105"></div>
                <img 
                  src="/images/JD_Simplified_About_Me.jpg" 
                  alt="Flashcards"
                  className="w-full h-auto rounded-lg shadow-lg relative"
                />
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="max-w-lg md:ml-auto">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-jdblue">Flashcards</h3>
                <p className="text-lg mb-6 text-muted-foreground">
                  Master legal concepts with spaced repetition learning that helps you retain information for the long term.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-jdorange mr-3 mt-1 flex-shrink-0" />
                    <span className="text-foreground">Create your own custom flashcards</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-jdorange mr-3 mt-1 flex-shrink-0" />
                    <span className="text-foreground">Access 400+ premium flashcards</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-jdorange mr-3 mt-1 flex-shrink-0" />
                    <span className="text-foreground">Track your progress with analytics</span>
                  </li>
                </ul>
                <Link to="/flashcards" className="inline-flex items-center py-3 px-6 bg-jdorange hover:bg-jdorange-dark text-white font-medium rounded-lg transition-colors group">
                  Study Flashcards
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Courses Section */}
      <section className="py-20 bg-white relative overflow-hidden box-border">
        <div className="max-w-6xl mx-auto px-4 relative box-border">
          <div className="flex flex-col-reverse md:flex-row md:items-center gap-12">
            <div className="md:w-1/2">
              <div className="max-w-lg">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-jdblue">Courses</h3>
                <p className="text-lg mb-6 text-muted-foreground">
                  Comprehensive learning experiences designed specifically for law students to help you master complex legal topics.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-jdorange mr-3 mt-1 flex-shrink-0" />
                    <span className="text-foreground">Expert-created learning materials</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-jdorange mr-3 mt-1 flex-shrink-0" />
                    <span className="text-foreground">Self-paced learning experience</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-jdorange mr-3 mt-1 flex-shrink-0" />
                    <span className="text-foreground">Interactive quizzes and assessments</span>
                  </li>
                </ul>
                <Link to="/courses" className="inline-flex items-center py-3 px-6 bg-jdorange hover:bg-jdorange-dark text-white font-medium rounded-lg transition-colors group">
                  Browse Courses
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 mb-8 md:mb-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-jdorange/30 to-transparent rounded-lg -rotate-3 scale-105"></div>
                <img 
                  src="/images/JD_Simplified_Hero.png" 
                  alt="Law Courses"
                  className="w-full h-auto rounded-lg shadow-lg relative"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AppFeaturesSection;
