
import { Zap, BookOpen, Award } from 'lucide-react';

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-white relative overflow-hidden box-border">
      <div className="max-w-6xl mx-auto px-4 relative box-border">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h5 className="inline-block bg-gray-100 text-jdblue px-4 py-1 rounded-full text-sm font-medium mb-4">
            WHY CHOOSE JD SIMPLIFIED
          </h5>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            A Better Way to Master Law
          </h2>
          <p className="text-gray-600 text-lg">
            Our courses are designed to break down complex legal concepts into easy-to-understand frameworks that help you learn faster and retain more.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div className="bg-gray-50 p-8 rounded-xl hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-jdorange/10 rounded-lg flex items-center justify-center mb-6">
              <Zap className="h-7 w-7 text-jdorange" />
            </div>
            <h3 className="text-xl font-bold mb-3">Strategic Frameworks</h3>
            <p className="text-gray-600">
              We provide clear, structured frameworks that simplify complex legal topics into manageable, logical steps.
            </p>
          </div>
          
          <div className="bg-gray-50 p-8 rounded-xl hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-jdorange/10 rounded-lg flex items-center justify-center mb-6">
              <BookOpen className="h-7 w-7 text-jdorange" />
            </div>
            <h3 className="text-xl font-bold mb-3">Practical Application</h3>
            <p className="text-gray-600">
              Learn by doing with numerous examples and practice scenarios that help solidify your understanding.
            </p>
          </div>
          
          <div className="bg-gray-50 p-8 rounded-xl hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-jdorange/10 rounded-lg flex items-center justify-center mb-6">
              <Award className="h-7 w-7 text-jdorange" />
            </div>
            <h3 className="text-xl font-bold mb-3">Expert Instruction</h3>
            <p className="text-gray-600">
              Courses created by experienced legal professionals who understand what it takes to succeed.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
