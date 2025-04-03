
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import ContactForm from '@/components/ContactForm';

const Contact = () => {
  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="bg-jdblue text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h5 className="inline-block bg-white/10 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              CONTACT US
            </h5>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Get in Touch
            </h1>
            <p className="text-white/80 text-lg mb-8">
              Have questions about our courses? Need help choosing the right course for your needs? We're here to help!
            </p>
          </div>
        </div>
      </section>
      
      {/* Contact Info & Form Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold mb-6">Contact Information</h2>
              <p className="text-gray-600 mb-8">
                Fill out the form or get in touch with us directly using the contact information below.
              </p>
              
              <div className="space-y-6 mb-10">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-jdorange/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-jdorange" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-bold text-gray-800 mb-1">Our Location</h3>
                    <p className="text-gray-600">
                      123 Law School Ave, Suite 200<br />
                      San Francisco, CA 94110
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-jdorange/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-jdorange" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-bold text-gray-800 mb-1">Phone Number</h3>
                    <p className="text-gray-600">
                      (555) 123-4567
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-jdorange/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-jdorange" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-bold text-gray-800 mb-1">Email Address</h3>
                    <p className="text-gray-600">
                      info@jdsimplified.com
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-jdorange/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-jdorange" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-bold text-gray-800 mb-1">Business Hours</h3>
                    <p className="text-gray-600">
                      Monday - Friday: 9:00 AM - 5:00 PM<br />
                      Saturday & Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-4">Frequently Asked Questions</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-jdblue">How quickly will you respond to my inquiry?</h4>
                    <p className="text-gray-600 mt-1">
                      We aim to respond to all inquiries within 24-48 business hours.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-jdblue">Do you offer personalized study plans?</h4>
                    <p className="text-gray-600 mt-1">
                      Yes, we can help you create a customized study plan based on your needs and goals. Contact us for more information.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-jdblue">Are there group discounts available?</h4>
                    <p className="text-gray-600 mt-1">
                      Yes, we offer discounts for study groups or law school organizations. Please contact us for details.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact Form */}
            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
      
      {/* Map Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Location</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We're located in the heart of San Francisco, just a short walk from public transit.
            </p>
          </div>
          
          <div className="relative h-96 rounded-xl overflow-hidden shadow-lg">
            {/* In a real implementation, this would be an actual Google Maps embed */}
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d50470.42051504231!2d-122.45128880105796!3d37.773856212817856!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80859a6d00690021%3A0x4a501367f076adff!2sSan%20Francisco%2C%20CA!5e0!3m2!1sen!2sus!4v1656603341092!5m2!1sen!2sus" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="JD Simplified Location"
            ></iframe>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-jdblue py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Simplify Your Legal Studies?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-3xl mx-auto">
            Browse our collection of courses designed to make learning law more intuitive and effective.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="/courses" className="btn-primary">
              Explore Our Courses
            </a>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Contact;
