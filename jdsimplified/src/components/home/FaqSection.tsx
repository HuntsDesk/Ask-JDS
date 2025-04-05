import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "How are your courses different?",
    answer: "Our courses focus on strategic frameworks rather than rote memorization, making complex legal concepts easier to understand and apply. We break down difficult subjects into manageable pieces that help you grasp the underlying principles."
  },
  {
    question: "How long do I have access to course materials?",
    answer: "Standard access is for 30 days from the date of purchase. This gives you focused time to complete the course. If you need more time, you can repurchase the course at any point to regain access."
  },
  {
    question: "Do you offer refunds?",
    answer: "Yes, we offer a 7-day satisfaction guarantee. If you're not completely satisfied with the course within the first week, we'll issue a full refund."
  },
  {
    question: "Can I download the course materials?",
    answer: "Yes, most course materials like PDF guides and frameworks can be downloaded for personal use during your access period."
  },
  {
    question: "Are these courses suitable for bar exam preparation?",
    answer: "Absolutely! Our courses are designed to help you understand and apply legal concepts in exactly the way you'll need to on exams, including the bar exam."
  },
  {
    question: "Do I need any prior knowledge before taking these courses?",
    answer: "Our courses are designed for different levels. Some are perfect for beginners while others build on foundational knowledge. Each course page specifies the recommended background knowledge."
  }
];

const FaqSection = () => {
  return (
    <section className="py-20 bg-white relative overflow-hidden box-border">
      <div className="max-w-6xl mx-auto px-4 relative box-border">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h5 className="inline-block bg-gray-100 text-jdblue px-4 py-1 rounded-full text-sm font-medium mb-4">
            FREQUENTLY ASKED QUESTIONS
          </h5>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Common Questions
          </h2>
          <p className="text-gray-600 text-lg">
            Find answers to the most frequently asked questions about our courses and learning approach.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-gray-200 rounded-lg overflow-hidden">
                <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 text-left">
                  <span className="text-xl font-bold text-gray-900">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 pt-2 text-base text-gray-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
