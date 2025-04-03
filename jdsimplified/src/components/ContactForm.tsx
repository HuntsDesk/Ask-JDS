
import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubmitted(true);
      toast.success('Message sent successfully!');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isSubmitted) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-lg text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
        <p className="text-gray-600 mb-6">
          Your message has been received. We'll get back to you as soon as possible.
        </p>
        <button 
          className="btn-primary"
          onClick={() => setIsSubmitted(false)}
        >
          Send Another Message
        </button>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 shadow-lg">
      <h3 className="text-2xl font-bold mb-6">Get in Touch</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-gray-700 font-medium">
            Your Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-jdorange focus:border-transparent transition-colors"
            placeholder="John Doe"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="email" className="block text-gray-700 font-medium">
            Your Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-jdorange focus:border-transparent transition-colors"
            placeholder="john@example.com"
          />
        </div>
      </div>
      
      <div className="space-y-2 mb-6">
        <label htmlFor="subject" className="block text-gray-700 font-medium">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          value={formData.subject}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-jdorange focus:border-transparent transition-colors"
          placeholder="Course Inquiry"
        />
      </div>
      
      <div className="space-y-2 mb-6">
        <label htmlFor="message" className="block text-gray-700 font-medium">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          value={formData.message}
          onChange={handleChange}
          rows={6}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-jdorange focus:border-transparent transition-colors resize-none"
          placeholder="Your message here..."
        />
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className={`btn-primary w-full ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
};

export default ContactForm;
