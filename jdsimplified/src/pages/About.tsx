
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';

const About = () => {
  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-jdblue text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2 order-2 md:order-1">
              <h5 className="inline-block bg-white/10 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
                ABOUT JD SIMPLIFIED
              </h5>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                A New Approach to Legal Education
              </h1>
              <p className="text-white/80 text-lg mb-8">
                JD Simplified was born from a simple observation: law school doesn't have to be overwhelming. Our mission is to break down complex legal concepts into strategic frameworks that make learning intuitive and effective.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/courses" className="btn-primary">
                  Explore Our Courses
                </Link>
                <Link to="/contact" className="bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-3 rounded-lg transition-all active:scale-95">
                  Contact Us
                </Link>
              </div>
            </div>
            
            <div className="w-full md:w-1/2 order-1 md:order-2 flex justify-center md:justify-end">
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-full h-full border-2 border-jdorange rounded-xl"></div>
                <img
                  src="https://randomuser.me/api/portraits/women/44.jpg"
                  alt="Founder of JD Simplified"
                  className="w-64 h-64 object-cover rounded-xl relative z-10"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h5 className="inline-block bg-jdorange/10 text-jdorange px-4 py-1 rounded-full text-sm font-medium mb-4">
              OUR STORY
            </h5>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              How It All Started
            </h2>
            <p className="text-gray-600 text-lg">
              From struggling law student to creating a revolutionary approach to legal education.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="bg-gray-50 p-8 rounded-xl hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-jdorange text-white rounded-full flex items-center justify-center font-bold text-lg mb-6">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">The Challenge</h3>
              <p className="text-gray-600">
                Like many law students, I struggled with the traditional approach to legal education - dense textbooks, confusing lectures, and little practical guidance on how to analyze legal problems systematically.
              </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-xl hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-jdorange text-white rounded-full flex items-center justify-center font-bold text-lg mb-6">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">The Realization</h3>
              <p className="text-gray-600">
                I discovered that by breaking down complex legal doctrines into strategic frameworks and step-by-step analyses, law became much more accessible and my grades improved dramatically.
              </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-xl hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-jdorange text-white rounded-full flex items-center justify-center font-bold text-lg mb-6">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">The Solution</h3>
              <p className="text-gray-600">
                JD Simplified was created to share these frameworks with other students, offering a more intuitive approach to learning law that focuses on understanding rather than memorization.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Mission Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2">
              <img
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                alt="Our Mission"
                className="rounded-xl shadow-lg"
              />
            </div>
            
            <div className="w-full md:w-1/2">
              <h5 className="inline-block bg-jdblue/10 text-jdblue px-4 py-1 rounded-full text-sm font-medium mb-4">
                OUR MISSION
              </h5>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Simplifying Legal Education
              </h2>
              <p className="text-gray-600 text-lg mb-6">
                We believe that legal education should be accessible, strategic, and focused on developing practical analytical skills rather than rote memorization.
              </p>
              <p className="text-gray-600 mb-8">
                Our mission is to transform how law is taught and learned by providing clear frameworks that break down complex legal concepts into manageable, intuitive steps. We're committed to helping students at all levels - from 1Ls just starting their journey to bar exam candidates making their final push.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-jdorange/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-jdorange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-bold text-gray-800">Strategic Frameworks</h3>
                    <p className="text-gray-600">We break down complex legal concepts into clear, systematic frameworks that make analysis intuitive.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-jdorange/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-jdorange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-bold text-gray-800">Practical Application</h3>
                    <p className="text-gray-600">Our approach emphasizes practical application over theoretical knowledge, helping you develop skills you'll actually use.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-jdorange/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-jdorange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-bold text-gray-800">Accessibility</h3>
                    <p className="text-gray-600">We're committed to making quality legal education accessible to all students, regardless of background or learning style.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h5 className="inline-block bg-gray-100 text-jdblue px-4 py-1 rounded-full text-sm font-medium mb-4">
              MEET THE FOUNDER
            </h5>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              The Brain Behind JD Simplified
            </h2>
            <p className="text-gray-600 text-lg">
              A passionate educator committed to transforming legal education.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-50 rounded-xl overflow-hidden shadow-sm">
              <div className="md:flex">
                <div className="md:w-1/3">
                  <img
                    src="https://randomuser.me/api/portraits/women/44.jpg"
                    alt="Sarah Johnson"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="p-8 md:w-2/3">
                  <h3 className="text-2xl font-bold mb-2">Sarah Johnson, J.D.</h3>
                  <p className="text-jdorange font-medium mb-4">Founder & Lead Instructor</p>
                  
                  <p className="text-gray-600 mb-4">
                    Proud mommy of the coolest and kindest kid. Lover of law, math, and tacos. Cheerleader of the underdog, and traveler, hopeless dreamer, and determined sleeper.
                  </p>
                  
                  <p className="text-gray-600 mb-6">
                    After graduating from law school and passing the bar, I realized how unnecessarily complicated many legal concepts are taught. I've dedicated my career to breaking down these concepts into strategic frameworks that make learning law more accessible and effective.
                  </p>
                  
                  <div className="flex space-x-4">
                    <a href="#" className="text-jdblue hover:text-jdorange transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.162 5.656a8.384 8.384 0 0 1-2.402.658A4.196 4.196 0 0 0 21.6 4c-.82.488-1.719.83-2.656 1.015a4.182 4.182 0 0 0-7.126 3.814 11.874 11.874 0 0 1-8.62-4.37 4.168 4.168 0 0 0-.566 2.103c0 1.45.738 2.731 1.86 3.481a4.168 4.168 0 0 1-1.894-.523v.052a4.185 4.185 0 0 0 3.355 4.101 4.21 4.21 0 0 1-1.89.072A4.185 4.185 0 0 0 7.97 16.65a8.394 8.394 0 0 1-6.191 1.732 11.83 11.83 0 0 0 6.41 1.88c7.693 0 11.9-6.373 11.9-11.9 0-.18-.005-.362-.013-.54a8.496 8.496 0 0 0 2.087-2.165z" />
                      </svg>
                    </a>
                    <a href="#" className="text-jdblue hover:text-jdorange transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </a>
                    <a href="#" className="text-jdblue hover:text-jdorange transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h5 className="inline-block bg-jdorange/10 text-jdorange px-4 py-1 rounded-full text-sm font-medium mb-4">
              OUR VALUES
            </h5>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              What We Stand For
            </h2>
            <p className="text-gray-600 text-lg">
              Our core values shape everything we do at JD Simplified.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-jdblue/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-jdblue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Excellence</h3>
              <p className="text-gray-600">
                We're committed to providing the highest quality educational materials and experience.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-jdblue/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-jdblue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Simplicity</h3>
              <p className="text-gray-600">
                We believe in making complex concepts accessible through clear, straightforward frameworks.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-jdblue/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-jdblue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Community</h3>
              <p className="text-gray-600">
                We foster a supportive community where students can learn, share, and grow together.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-jdblue/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-jdblue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Innovation</h3>
              <p className="text-gray-600">
                We're constantly exploring new ways to make legal education more effective and engaging.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h5 className="inline-block bg-gray-100 text-jdblue px-4 py-1 rounded-full text-sm font-medium mb-4">
              TESTIMONIALS
            </h5>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              What Our Students Say
            </h2>
            <p className="text-gray-600 text-lg">
              Hear from students who have transformed their legal education with our approach.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-xl shadow-sm">
              <div className="flex items-center mb-6">
                <img
                  src="https://randomuser.me/api/portraits/women/32.jpg"
                  alt="Emma L."
                  className="w-14 h-14 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-bold">Emma L.</h4>
                  <p className="text-gray-500 text-sm">Harvard Law '22</p>
                </div>
              </div>
              <p className="text-gray-600 italic mb-6">
                "The frameworks provided in the Constitutional Law course made complex concepts click for me in a way that three years of law school never did. I wish I had found JD Simplified earlier!"
              </p>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-xl shadow-sm">
              <div className="flex items-center mb-6">
                <img
                  src="https://randomuser.me/api/portraits/men/44.jpg"
                  alt="Michael T."
                  className="w-14 h-14 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-bold">Michael T.</h4>
                  <p className="text-gray-500 text-sm">UCLA Law '23</p>
                </div>
              </div>
              <p className="text-gray-600 italic mb-6">
                "After failing the bar the first time, I used JD Simplified's strategic approach to completely change how I studied. Passed with flying colors the second time around!"
              </p>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-xl shadow-sm">
              <div className="flex items-center mb-6">
                <img
                  src="https://randomuser.me/api/portraits/women/68.jpg"
                  alt="Sophia C."
                  className="w-14 h-14 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-bold">Sophia C.</h4>
                  <p className="text-gray-500 text-sm">NYU Law '21</p>
                </div>
              </div>
              <p className="text-gray-600 italic mb-6">
                "The Evidence course saved me during finals. The step-by-step analysis templates made me confident in tackling even the most complex hypotheticals on my exam."
              </p>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link to="/courses" className="inline-flex items-center text-jdorange font-medium group">
              Explore Our Courses 
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-jdblue py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Legal Education?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-3xl mx-auto">
            Join thousands of students who have already simplified their law school experience with our strategic approach.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/courses" className="btn-primary">
              Browse Our Courses
            </Link>
            <Link to="/contact" className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-medium px-6 py-3 rounded-lg transition-all active:scale-95">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default About;
