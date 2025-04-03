
const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-white relative overflow-hidden box-border">
      <div className="max-w-6xl mx-auto px-4 relative box-border">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h5 className="inline-block bg-gray-100 text-jdblue px-4 py-1 rounded-full text-sm font-medium mb-4">
            STUDENT SUCCESS
          </h5>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            What Our Students Say
          </h2>
          <p className="text-gray-600 text-lg">
            Our approach has helped thousands of law students and bar exam takers achieve their goals.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-50 p-8 rounded-xl shadow-sm">
            <div className="flex items-center mb-4">
              <img
                src="https://randomuser.me/api/portraits/women/32.jpg"
                alt="Emma L."
                className="w-12 h-12 rounded-full object-cover mr-4"
              />
              <div>
                <h4 className="font-bold">Emma L.</h4>
                <p className="text-gray-500 text-sm">Harvard Law '22</p>
              </div>
            </div>
            <p className="text-gray-600 italic">
              "The frameworks provided in the Constitutional Law course made complex concepts click for me in a way that three years of law school never did. I wish I had found JD Simplified earlier!"
            </p>
          </div>
          
          <div className="bg-gray-50 p-8 rounded-xl shadow-sm">
            <div className="flex items-center mb-4">
              <img
                src="https://randomuser.me/api/portraits/men/44.jpg"
                alt="Michael T."
                className="w-12 h-12 rounded-full object-cover mr-4"
              />
              <div>
                <h4 className="font-bold">Michael T.</h4>
                <p className="text-gray-500 text-sm">UCLA Law '23</p>
              </div>
            </div>
            <p className="text-gray-600 italic">
              "After failing the bar the first time, I used JD Simplified's strategic approach to completely change how I studied. Passed with flying colors the second time around!"
            </p>
          </div>
          
          <div className="bg-gray-50 p-8 rounded-xl shadow-sm">
            <div className="flex items-center mb-4">
              <img
                src="https://randomuser.me/api/portraits/women/68.jpg"
                alt="Sophia C."
                className="w-12 h-12 rounded-full object-cover mr-4"
              />
              <div>
                <h4 className="font-bold">Sophia C.</h4>
                <p className="text-gray-500 text-sm">NYU Law '21</p>
              </div>
            </div>
            <p className="text-gray-600 italic">
              "The Evidence course saved me during finals. The step-by-step analysis templates made me confident in tackling even the most complex hypotheticals on my exam."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
