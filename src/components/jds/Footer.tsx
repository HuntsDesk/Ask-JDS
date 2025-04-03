import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-[#002171] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Logo and Description */}
          <div className="col-span-1">
            <Link to="/" className="flex items-center mb-4">
              <img 
                src="/images/JDSimplified_Logo_wht.png" 
                alt="JD Simplified Logo" 
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-gray-300 mb-4 text-base">
              Your AI-powered law school study companion that helps you understand complex legal concepts, prepare for exams, and boost your confidence.
            </p>
            <div className="flex space-x-6 mt-6">
              <a href="https://facebook.com" className="text-white hover:text-jdorange transition-colors" aria-label="Facebook">
                <Facebook size={24} />
              </a>
              <a href="https://twitter.com" className="text-white hover:text-jdorange transition-colors" aria-label="Twitter">
                <Twitter size={24} />
              </a>
              <a href="https://instagram.com" className="text-white hover:text-jdorange transition-colors" aria-label="Instagram">
                <Instagram size={24} />
              </a>
              <a href="https://youtube.com" className="text-white hover:text-jdorange transition-colors" aria-label="YouTube">
                <Youtube size={24} />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-xl font-bold mb-6">Quick Links</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/" className="text-gray-200 hover:text-jdorange transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/auth" className="text-gray-200 hover:text-jdorange transition-colors">Sign In</Link>
              </li>
              <li>
                <Link to="/auth?tab=signup" className="text-gray-200 hover:text-jdorange transition-colors">Sign Up</Link>
              </li>
            </ul>
          </div>
          
          {/* Legal */}
          <div className="col-span-1">
            <h3 className="text-xl font-bold mb-6">Legal</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/terms" className="text-gray-200 hover:text-jdorange transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-200 hover:text-jdorange transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/cookies" className="text-gray-200 hover:text-jdorange transition-colors">Cookie Policy</Link>
              </li>
              <li>
                <Link to="/disclaimer" className="text-gray-200 hover:text-jdorange transition-colors">Disclaimer</Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            © {currentYear} JD Simplified, LLC. All rights reserved.
          </div>
          <div className="text-gray-400 text-sm">
            Made with ❤️ for law students everywhere
          </div>
        </div>
      </div>
    </footer>
  );
} 