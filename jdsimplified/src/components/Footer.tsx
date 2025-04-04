import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Youtube, Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-jdblue text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center mb-4">
              <img 
                src="/images/JDSimplified_Logo_wht.png" 
                alt="JD Simplified Logo" 
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-gray-300 mb-4">
              The strategic approach to the study of law. Simplified learning for better results.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="https://youtube.com" className="text-gray-300 hover:text-jdorange transition-colors" aria-label="YouTube">
                <Youtube size={20} />
              </a>
              <a href="https://twitter.com" className="text-gray-300 hover:text-jdorange transition-colors" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="https://linkedin.com" className="text-gray-300 hover:text-jdorange transition-colors" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
              <a href="https://instagram.com" className="text-gray-300 hover:text-jdorange transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-jdorange transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/courses" className="text-gray-300 hover:text-jdorange transition-colors">Courses</Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-jdorange transition-colors">About</Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-jdorange transition-colors">Contact</Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-300 hover:text-jdorange transition-colors">Blog</Link>
              </li>
            </ul>
          </div>
          
          {/* Legal */}
          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-jdorange transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-jdorange transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/refund" className="text-gray-300 hover:text-jdorange transition-colors">Refund Policy</Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-300 hover:text-jdorange transition-colors">FAQ</Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <Mail size={20} className="mt-1 flex-shrink-0 text-jdorange" />
                <span className="text-gray-300">info@jdsimplified.com</span>
              </li>
              <li className="flex items-start space-x-3">
                <Phone size={20} className="mt-1 flex-shrink-0 text-jdorange" />
                <span className="text-gray-300">(555) 123-4567</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin size={20} className="mt-1 flex-shrink-0 text-jdorange" />
                <span className="text-gray-300">
                  123 Law School Ave, Suite 200<br />
                  San Francisco, CA 94110
                </span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            &copy; {currentYear} JD Simplified. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/support" className="text-gray-400 hover:text-jdorange text-sm transition-colors">
              Support
            </Link>
            <span className="text-gray-600">|</span>
            <Link to="/login" className="text-gray-400 hover:text-jdorange text-sm transition-colors">
              Student Login
            </Link>
            <span className="text-gray-600">|</span>
            <Link to="/sitemap" className="text-gray-400 hover:text-jdorange text-sm transition-colors">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
