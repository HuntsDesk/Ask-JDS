import { Link } from 'react-router-dom';

const AboutSection = () => {
  return (
    <section className="py-20 bg-gray-50 relative overflow-hidden box-border">
      <div className="max-w-6xl mx-auto px-4 relative box-border">
        <div className="flex flex-col lg:flex-row items-center">
          <div className="w-full lg:w-1/3 mb-10 lg:mb-0 flex justify-center lg:justify-start">
            <div className="relative">
              <div className="absolute -top-6 -right-6 w-full h-full border-2 border-jdorange rounded-xl"></div>
              <img 
                alt="About JD Simplified" 
                className="w-64 h-64 object-cover rounded-xl relative z-10" 
                src="/images/JD_Simplified_About_Me.jpg" 
              />
            </div>
          </div>
          
          <div className="w-full lg:w-2/3 lg:pl-20">
            <h5 className="inline-block bg-jdorange/10 text-jdorange px-4 py-1 rounded-full text-sm font-medium mb-4">
              ABOUT ME
            </h5>
            <h2 className="text-3xl font-bold mb-6">
              J.D. grad specializing in strategy-based legal instruction
            </h2>
            <p className="text-gray-600 mb-6">
              Proud mommy of the coolest and kindest kid. Lover of law, math, and tacos. Cheerleader of the underdog, and traveler, hopeless dreamer, and determined sleeper.
            </p>
            <p className="text-gray-600 mb-8">
              After graduating from law school and passing the bar, I realized how unnecessarily complicated many legal concepts are taught. I've dedicated my career to breaking down these concepts into strategic frameworks that make learning law more accessible and effective.
            </p>
            
            <Link to="/about" className="btn-primary">
              Learn More About Me
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
