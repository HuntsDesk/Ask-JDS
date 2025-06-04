import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/askjds/PageLayout';

export function PrivacyPolicy() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-lg text-gray-600">Effective Date: May 11, 2025</p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-800">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Introduction</h2>
            <p>This Privacy Policy explains how JD Simplified ("JD Simplified", "we", "us" or "our") collects, uses, and discloses information about you when you use our websites AskJDS.com and JDSimplified.com, and any related services (collectively, the "Service" or "Site"). By using the Service, you agree to the collection and use of your information in accordance with this Privacy Policy. If you do not agree, please do not use our Service.</p>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
              <p className="text-blue-800 font-medium">
                <strong>Note:</strong> The Service is intended for use by individuals 18 years of age or older. We do not knowingly collect personal information from anyone under 18 (see Children's Privacy below).
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Information We Collect</h2>
            <p>We collect information from and about users in a few different ways:</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Information You Provide to Us</h3>
            <p>When you use our Service, you may provide certain personal information, including:</p>
            <ul>
              <li><strong>Account Registration Data:</strong> When you create an account, we collect your email address and a password. (Passwords are stored in encrypted form for security.) You may also choose to provide your name and, optionally, your law school name as part of your profile.</li>
              <li><strong>User Content:</strong> We collect and store any content you submit through the Service. This includes questions you ask our system, the AI-generated responses you receive, and any study materials you create or upload, such as flashcards or outlines.</li>
              <li><strong>Communications:</strong> If you contact us directly (for example, via email or through a contact form on our Site), we will receive the information you provide, such as your name, email address, and the contents of your message or attachment.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Information Collected Automatically</h3>
            <p>When you visit or use our Service, we automatically collect certain information about your device and usage:</p>
            <ul>
              <li><strong>Usage and Device Data:</strong> We collect log data about your interactions with the Service, including your IP address, browser type, operating system, referring URLs, pages viewed, and the dates/times of access.</li>
              <li><strong>Cookies and Similar Technologies:</strong> We use cookies and similar tracking technologies to remember your preferences and session information, and to collect analytics data. For more details, see Cookies and Tracking below.</li>
              <li><strong>Analytics Information:</strong> We utilize third-party analytics services (specifically, Usermaven) to help us understand how users engage with our Service. We have configured our analytics to be privacy-friendly.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul>
              <li><strong>To Provide and Maintain the Service:</strong> We use your information to create and manage your account, authenticate you when you log in, and deliver the features of our Service.</li>
              <li><strong>To Personalize Your Experience:</strong> We may use your data to tailor the content and resources shown to you, such as recommending certain study modules or organizing your submitted content.</li>
              <li><strong>To Communicate with You:</strong> We use your email address and other contact information to send you important notices about the Service, such as account confirmations, password resets, subscription information, updates about new features, or legal/terms updates.</li>
              <li><strong>For Analytics and Service Improvement:</strong> Information is used to understand user behavior and preferences, so we can improve our Service's functionality, performance, and user experience.</li>
              <li><strong>For Content Development and Research:</strong> We might review aggregated user queries or feedback to improve our AI models, create new study materials, or expand our content library.</li>
              <li><strong>To Ensure Legal and Appropriate Use:</strong> We monitor usage to prevent fraud, abuse, or misuse of the Service.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How We Share or Disclose Information</h2>
            <p>We understand the importance of your personal information and we do not sell your data to third parties. We only share your information in the following circumstances:</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">With Service Providers and Partners</h3>
            <p>We use trusted third-party companies to operate and support our Service. Our key service providers include:</p>
            <ul>
              <li><strong>Supabase:</strong> We use Supabase as our primary database and authentication provider. All of the personal information and content you provide is stored in our Supabase database (hosted on servers in the United States).</li>
              <li><strong>Amazon Web Services (AWS):</strong> We host our website and application front-end on AWS infrastructure.</li>
              <li><strong>Flotiq:</strong> We utilize Flotiq for system backups and internal analytics. Periodic backups of our database and system data are stored on Flotiq's secure servers.</li>
              <li><strong>Usermaven:</strong> We use Usermaven for analytics tracking to understand user engagement with our Site.</li>
              <li><strong>Payment Processor (Stripe):</strong> If you purchase a subscription, your payment information is collected and processed by Stripe. We do not store your sensitive payment details on our servers.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Legal Requirements and Safety</h3>
            <p>We may disclose your information if required to do so by law or in a good-faith belief that such action is necessary to comply with legal obligations, protect and defend our rights or property, or detect, prevent, or address fraud, security, or technical issues.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Business Transfers</h3>
            <p>If JD Simplified is involved in a merger, acquisition, sale of assets, or reorganization, your information may be transferred as part of that deal. We will ensure any potential buyer or new combined entity is bound to respect your personal information in a manner consistent with this Privacy Policy.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Cookies and Tracking</h2>
            <p>We use cookies and similar technologies to operate and improve our Service:</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Cookies</h3>
            <p>Cookies are small text files placed on your device that help our Site function and gather information. We use cookies for purposes such as keeping you logged in (session cookies for authentication), remembering your preferences, and collecting analytics data.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Analytics Cookies/Tools</h3>
            <p>Our analytics provider (Usermaven) may use either a cookie-less technology or a first-party cookie to track user interactions. Usermaven is designed to respect privacy and can work without cookies; in our implementation, we aim to minimize the use of cookies for analytics.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">No Third-Party Advertising Cookies</h3>
            <p>We do not use third-party advertising networks or targeted advertising cookies on our websites at this time. This means you should not see advertising cookies or trackers for ad purposes from our Site.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Managing Cookies</h3>
            <p>You have the right to control or block cookies. Most web browsers allow you to delete or refuse cookies through their settings. Please note, if you disable or refuse essential cookies, some parts of our Service (such as maintaining your login session) may not work properly.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Security</h2>
            <p>We take data security seriously and use reasonable measures to protect your personal information. These measures include:</p>
            <ul>
              <li><strong>Encryption:</strong> Our websites are secured via HTTPS, which encrypts data transmitted between your browser and our servers. Sensitive information (like passwords) is stored encrypted.</li>
              <li><strong>Access Controls:</strong> We limit access to personal data to authorized personnel who need it to operate or improve the Service.</li>
              <li><strong>Third-Party Security:</strong> We choose reputable service providers that have strong security practices.</li>
              <li><strong>Monitoring and Testing:</strong> We maintain and monitor our infrastructure to protect against unauthorized access.</li>
            </ul>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-6">
              <p className="text-yellow-800">
                <strong>Important:</strong> No method of transmission over the internet or method of electronic storage is 100% secure. While we strive to protect your personal data, we cannot guarantee absolute security.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Retention</h2>
            <p>We retain personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. In general:</p>
            <ul>
              <li><strong>Account Information:</strong> We keep your account information for as long as your account is active. If you delete your account or request that we delete your data, we will remove or anonymize your personal information from our active databases.</li>
              <li><strong>User Content:</strong> Content you have created is retained while you have an account. If you delete specific content or close your account, that content may be removed from the active system.</li>
              <li><strong>Backup Copies:</strong> Because we perform regular backups to ensure service reliability, your data may remain in backup storage for a period of time after deletion.</li>
              <li><strong>Analytics Data:</strong> Analytics and log data are generally aggregated or anonymized over time.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Your Rights and Choices</h2>
            <p>You have certain rights and choices regarding your personal information:</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Access and Correction</h3>
            <p>You may access and update certain account information by logging into your account and visiting your profile or account settings. If any personal information we have about you is inaccurate or outdated, please update it in your account or notify us to correct it.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Account Deletion</h3>
            <p>If you wish to close your account or delete the personal information we have about you, you can contact us at the email provided below. Upon verification of your identity and request, we will delete your account and personal data, except for information we are required to retain for legitimate business or legal purposes.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Opt-Out of Marketing Communications</h3>
            <p>If we send you promotional emails, you can opt out at any time by clicking the "unsubscribe" link in those emails or by adjusting your email preferences in your account settings.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">GDPR (EEA/UK) Rights</h3>
            <p>If you are located in the European Economic Area, United Kingdom, or another region with similar data protection laws, you have certain rights under the General Data Protection Regulation (GDPR) or equivalent laws. These may include:</p>
            <ul>
              <li>The right to request access to the personal data we hold about you</li>
              <li>The right to request rectification of inaccurate or incomplete data</li>
              <li>The right to request deletion (erasure) of your data</li>
              <li>The right to restrict or object to certain processing of your data</li>
              <li>The right to data portability</li>
              <li>The right to withdraw consent at any time</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">International Transfers</h3>
            <p>If you are using our Service from outside the United States, be aware that your information will be transferred to and stored in the U.S. (where our servers and our third-party service providers are located). The data protection laws in the U.S. may differ from those of your jurisdiction.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Children's Privacy</h2>
            <p>Our Service is intended for adults and individuals who are at least 18 years old. We do not knowingly allow anyone under 18 to register for an account or provide us with personal information. If you are under 18, you should not use this Service or submit any personal information to us.</p>

            <p>If we learn that we have inadvertently collected personal information from someone under 18, we will take steps to delete such information as soon as possible. If you are a parent or guardian and you believe that your child (under 18) has provided us with personal information, please contact us immediately so that we can investigate and delete the information.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Changes to this Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors. When we update the policy, we will change the "Effective Date" at the top of this document. If the changes are significant, we will provide a more prominent notice (such as by posting a notice on our website or emailing users with registered accounts).</p>

            <p>We encourage you to review this Privacy Policy periodically to stay informed about how we are protecting your information. Your continued use of the Service after any changes to this Privacy Policy have been posted constitutes your acceptance of the changes.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Contact Us</h2>
            <p>If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:</p>
            <div className="bg-gray-50 p-6 rounded-lg mt-4">
              <p><strong>Email:</strong> support@jdsimplified.com (Attn: Privacy Officer)</p>
              <p><strong>Mail:</strong><br />
              JD Simplified, LLC<br />
              7901 4TH ST N STE 300<br />
              ST PETERSBURG, FL 33702</p>
            </div>

            <p className="mt-6">You may also reach out to us through the contact form on our website for general inquiries.</p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
} 