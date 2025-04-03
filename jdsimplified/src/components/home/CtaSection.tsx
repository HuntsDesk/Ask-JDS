
import { Link } from 'react-router-dom';

const CtaSection = () => {
  return (
    <section className="bg-jdblue py-16 relative overflow-hidden box-border">
      <div className="max-w-6xl mx-auto px-4 text-center relative box-border">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Ready to Simplify Your Legal Education?
        </h2>
        <p className="text-white/80 text-lg mb-8 max-w-3xl mx-auto">
          Start learning with our strategic approach today and experience the difference for yourself.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/courses" className="btn-primary">
            Browse Courses
          </Link>
          <Link to="/contact" className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-medium px-6 py-3 rounded-lg transition-all active:scale-95">
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
