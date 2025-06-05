import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/askjds/PageLayout';

export function TermsOfService() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-lg text-gray-600">Effective Date: May 11, 2025</p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-800">
            <div className="bg-orange-50 border-l-4 border-orange-500 p-6 mb-8">
              <p className="text-orange-800 font-medium">
                <strong>PLEASE READ THESE TERMS OF SERVICE CAREFULLY BEFORE USING OUR SERVICE.</strong> By accessing or using AskJDS.com, JDSimplified.com, or any services provided by JD Simplified (collectively, the "Service"), you agree to be bound by the following terms and conditions ("Terms"). If you do not agree with these Terms, you must not use the Service.
              </p>
            </div>

            <p>These Terms constitute a binding legal agreement between you ("User," "you" or "your") and JD Simplified ("Company," "we," "us," or "our"). These Terms incorporate by reference our <Link to="/privacy" className="text-orange-600 hover:underline">Privacy Policy</Link> (which describes how we collect and use your data).</p>

            <p>The Service is offered and available only to users who are 18 years of age or older. By using the Service, you represent and warrant that you are at least 18 years old and legally capable of entering into this agreement.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Purpose of the Service</h2>
            <p>JD Simplified provides an educational platform (through AskJDS.com and JDSimplified.com) aimed at helping law students and bar exam candidates learn and prepare for exams. The content available through the Service includes AI-generated answers to legal questions, flashcards, outlines, explanatory videos, and other study materials. The Service is intended for study and informational purposes only. It is not intended for use in real legal proceedings, for giving legal advice to clients, or for any other professional application of law.</p>

            <p>By using the Service, you acknowledge and agree that:</p>
            <ul>
              <li>You will use the Service solely for the purpose of learning, studying, or preparing for academic evaluations (such as law school exams or bar exams).</li>
              <li>You will not use the information or tools provided by the Service as a substitute for professional legal advice or representation, or in any situation that could have legal consequences in real life (such as drafting actual court documents, advising clients, or making legal decisions in an active case).</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Account Registration and Security</h2>
            <p>To access certain features of our Service (such as asking unlimited questions or accessing premium content), you may need to create an account.</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Registration</h3>
            <p>When creating an account, you must provide a valid email address and create a secure password. You may also be prompted (now or in the future) to provide additional information such as your name or law school affiliation (optional). You agree to provide accurate, current, and complete information during registration and at all other times when you use the Service. You are responsible for maintaining the accuracy of your account information.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Account Credentials</h3>
            <p>You are responsible for maintaining the confidentiality of your account login credentials. You must not share your password or account access with any third party. Account sharing is strictly prohibited. Each account is meant to be used by a single individual.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Unauthorized Access</h3>
            <p>You agree to notify us immediately at support@jdsimplified.com if you suspect or become aware of any unauthorized use of your account or any breach of security. We are not liable for any loss or damage arising from your failure to keep your credentials confidential.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Subscription Plans and Payments</h2>
            <p>Some features of the Service are provided free of charge, while full access (including unlimited AI queries and certain premium materials like video lessons) requires a paid subscription.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Subscription Access</h3>
            <p>By purchasing a subscription, you gain access to premium features of the Service for the duration of the subscription term (e.g., monthly). Subscription features include, but are not limited to, unlimited AI-generated answers (subject to fair use as described below) and exclusive content such as in-depth training videos and specialized outlines.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Fees</h3>
            <p>Subscription fees, pricing, and payment schedules (for example, $10 per month) are as listed on our websites at the time of purchase. All fees are in U.S. Dollars, unless otherwise indicated. You agree to pay the stated charges for the subscription plan you select, and you authorize us (or our payment processor) to charge your chosen payment method for those fees.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Payment Processing</h3>
            <p>Payments for subscriptions are handled by our third-party payment processor (Stripe). By providing payment information, you agree to the third party's terms and any applicable fees (such as credit card fees). We do not store your full credit card details on our servers; that information is securely handled by the payment processor.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Fair Use Policy for AI Services</h2>
            <p>Our platform provides AI-generated content (answers to questions, flashcard generation, etc.) as a core feature. While paid subscribers have the benefit of "unlimited" AI queries, this is subject to a Fair Use Policy to ensure quality service for all:</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Unlimited Use</h3>
            <p>"Unlimited AI messages" means we do not set a fixed cap on the number of questions you can ask or the length of content the AI can generate for you under normal usage. We want users to be able to thoroughly engage with the study material.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Fair Use Definition</h3>
            <p>Fair use is usage that is reasonable in volume and frequency for an individual engaged in personal study or bar exam preparation. Examples of unfair use may include:</p>
            <ul>
              <li>Using scripts, bots, or automated tools to send a high volume of queries to the AI.</li>
              <li>Sharing your account or API access (if provided) with others to let them use the AI service under your account.</li>
              <li>Continuously querying the AI in a manner that suggests non-human usage or an attempt to harvest large datasets of answers.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Educational Use Only; No Legal Advice</h2>
            <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6">
              <p className="text-red-800 font-medium">
                <strong>Important Disclaimers:</strong> The Service and all content (including AI-generated responses, flashcards, outlines, videos, and any other material) is provided for general informational and educational purposes related to law school studies and bar exam preparation. It is not legal advice.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">No Attorney-Client Relationship</h3>
            <p>Your use of the Service does not create an attorney-client relationship between you (or anyone) and JD Simplified or any of its owners, operators, or contributors. We are not a law firm or a provider of professional legal services.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Not a Substitute for Professional Judgment</h3>
            <p>You must not rely on the Service as a substitute for your own study of the law, your own analysis, or for professional advice. Always verify any critical information against official sources.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. AI-Generated Content and Accuracy Disclaimer</h2>
            <p>One of the features of our Service is the AI-powered Q&A and content generation. While this can be a powerful learning tool, it is important to understand its limitations:</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Nature of AI Output</h3>
            <p>The responses and content generated by our AI should be considered informational drafts or starting points for understanding. The AI attempts to provide useful and relevant information, but it does not guarantee correctness.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">No Guarantee of Accuracy</h3>
            <p>We do not warrant or guarantee that any AI-generated answer or content is accurate, complete, reliable, or up-to-date. The AI might occasionally produce incorrect statements, incorrect citations, or fail to fully address your question.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Mobile Applications</h2>
            <p>Our Service may be available through mobile applications downloaded from app stores (such as Apple's App Store or Google Play Store). Your use of our mobile applications is subject to these Terms as well as the applicable app store's terms and conditions.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">App Store Terms</h3>
            <p>When you download our mobile application from an app store, you also agree to that app store's terms of service. In case of conflict between our Terms and the app store's terms, our Terms shall govern your use of the Service itself, while the app store's terms govern the download and use of the application.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Updates and Changes</h3>
            <p>We may update our mobile applications from time to time to add features, fix bugs, or improve performance. You agree to accept such updates, which may be delivered automatically depending on your device settings.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Intellectual Property Rights</h2>
            <p>Unless otherwise indicated, all content available on or through the Service is owned by or licensed to JD Simplified. This includes text, study materials, flashcards, outlines, video lectures, graphics, images, logos, design, and the overall look-and-feel of the websites.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Trademarks</h3>
            <p>"JD Simplified", "Ask JDS", our logos, and any other product or service names or slogans displayed on the Service are trademarks of JD Simplified or its partners, unless otherwise noted.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Prohibited Conduct</h2>
            <p>We expect users to use the Service responsibly. You agree that you will NOT:</p>
            <ul>
              <li>Violate any laws or regulations</li>
              <li>Copy, scrape, reproduce, or distribute any part of the Service without permission</li>
              <li>Attempt to interfere with the operation, integrity, or security of the Service</li>
              <li>Attempt to gain unauthorized access to any portion of the Service</li>
              <li>Impersonate any person or entity</li>
              <li>Use the Service in a manner that is harmful, fraudulent, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable</li>
              <li>Share your account with others or resell the Service</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Termination of Service</h2>
            <p>Both you and JD Simplified have the right to terminate this agreement and your use of the Service under certain circumstances. We may suspend or terminate your access to the Service at any time, with or without notice, and with or without cause.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Refund Policy</h2>
            <p>All fees and charges paid by you in relation to the Service are, by default, non-refundable. We may consider granting refunds on a case-by-case basis, at our sole discretion, for exceptional circumstances such as technical issues on our side that severely affected your ability to use the Service.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. Disclaimer of Warranties</h2>
            <p>Use of the Service is at your own risk. The Service and all content, information, and materials available on or through the Service are provided on an "AS IS" and "AS AVAILABLE" basis, without any warranties of any kind, either express or implied.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">13. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, in no event will JD Simplified or its founders, owners, employees, affiliates, licensors, or agents be liable to you or any third party for any indirect, incidental, special, consequential, or punitive damages whatsoever, arising out of or related to your use of (or inability to use) the Service or any content on the Service.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">14. Governing Law and Jurisdiction</h2>
            <p>These Terms and any dispute or claim arising out of or in connection with them shall be governed by and construed in accordance with the laws of the State of Florida, United States. You and JD Simplified agree that any judicial proceeding to resolve claims relating to these Terms or the Service will be brought in the state or federal courts located in the State of Florida.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">15. International Use</h2>
            <p>The Service is primarily designed for students attending law schools in the United States and Puerto Rico. Our content focuses on U.S. legal principles and bar exam preparation. If you access the Service from outside the United States, you do so at your own risk and are responsible for compliance with local laws. Please note that the legal information provided may not be applicable to your jurisdiction.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">16. Changes to These Terms</h2>
            <p>JD Simplified may revise or update these Terms from time to time. We will give you notice of material changes in advance by posting a notice on our website or sending an email to the address associated with your account. Your continued use of the Service after any changes to these Terms have been posted constitutes your acceptance of the changes.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">17. Contact Information</h2>
            <p>If you have any questions about these Terms, or if you need to reach us for any reason, you may contact us at:</p>
            <div className="bg-gray-50 p-6 rounded-lg mt-4">
              <p><strong>Email:</strong> support@jdsimplified.com</p>
              <p><strong>Mail:</strong><br />
              JD Simplified, LLC<br />
              7901 4TH ST N STE 300<br />
              ST PETERSBURG, FL 33702</p>
            </div>

            <p className="mt-8 text-gray-600">We appreciate you taking the time to read these Terms. We are excited to have you as a user and hope our Service proves valuable in your legal education journey. Happy studying and good luck with your law school and bar exam preparation!</p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
} 