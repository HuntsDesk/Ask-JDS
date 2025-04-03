import ContactForm from '../ContactForm';

const ContactSection = () => {
  return (
    <section className="py-20 bg-gray-50 relative overflow-hidden box-border">
      <div className="max-w-6xl mx-auto px-4 relative box-border">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h5 className="inline-block bg-gray-100 text-jdblue px-4 py-1 rounded-full text-sm font-medium mb-4">
            GET IN TOUCH
          </h5>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Have Questions?
          </h2>
          <p className="text-gray-600 text-lg">
            Whether you're wondering which course is right for you or have specific questions about our approach, we're here to help.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <ContactForm />
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
