import Link from 'next/link';
import Layout from '../components/Layout';

export default function PrivacyPolicy() {
  return (
    <Layout title="Privacy Policy" description="Luvrix Privacy Policy - How we collect, use, and protect your data" canonical="https://luvrix.com/privacy">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
              Privacy Policy
            </h1>
            
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              <strong>Last Updated:</strong> February 3, 2026
            </p>

            <div className="prose dark:prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  1. Introduction
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Welcome to Luvrix. We respect your privacy and are committed to protecting your personal data. 
                  This privacy policy explains how we collect, use, disclose, and safeguard your information when 
                  you visit our website and use our services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  2. Information We Collect
                </h2>
                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">
                  2.1 Personal Information
                </h3>
                <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4">
                  <li>Email address (for account registration)</li>
                  <li>Username and display name</li>
                  <li>Profile picture (optional)</li>
                  <li>Password (encrypted)</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">
                  2.2 Usage Information
                </h3>
                <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4">
                  <li>Reading history and preferences</li>
                  <li>Favorite content and libraries</li>
                  <li>Comments and interactions</li>
                  <li>Device and browser information</li>
                  <li>IP address and location data</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  3. How We Use Your Information
                </h2>
                <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4">
                  <li>Provide and maintain our services</li>
                  <li>Personalize your experience</li>
                  <li>Process transactions and send notifications</li>
                  <li>Improve our platform and develop new features</li>
                  <li>Communicate with you about updates and support</li>
                  <li>Detect and prevent fraud or abuse</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  4. Data Sharing and Disclosure
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We do not sell your personal data. We may share information with:
                </p>
                <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4">
                  <li><strong>Service Providers:</strong> Third parties that help us operate our platform</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business Transfers:</strong> In connection with mergers or acquisitions</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  5. Cookies and Tracking
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4">
                  <li>Keep you signed in</li>
                  <li>Remember your preferences</li>
                  <li>Analyze site usage</li>
                  <li>Provide personalized content</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-300">
                  You can manage cookie preferences through our cookie consent banner or your browser settings.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  6. Your Rights (GDPR)
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  If you are in the European Economic Area, you have the right to:
                </p>
                <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Rectification:</strong> Correct inaccurate data</li>
                  <li><strong>Erasure:</strong> Request deletion of your data</li>
                  <li><strong>Portability:</strong> Receive your data in a portable format</li>
                  <li><strong>Restriction:</strong> Limit how we use your data</li>
                  <li><strong>Objection:</strong> Object to certain processing</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-300">
                  To exercise these rights, contact us at{' '}
                  <a href="mailto:privacy@luvrix.com" className="text-purple-600 hover:underline">
                    privacy@luvrix.com
                  </a>
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  7. Data Security
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We implement appropriate security measures including:
                </p>
                <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4">
                  <li>Encryption of data in transit (HTTPS/TLS)</li>
                  <li>Encryption of sensitive data at rest</li>
                  <li>Regular security audits</li>
                  <li>Access controls and authentication</li>
                  <li>Rate limiting and abuse prevention</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  8. Data Retention
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We retain your data for as long as your account is active or as needed to provide services. 
                  Upon account deletion, we will delete your personal data within 30 days, except where 
                  retention is required by law.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  9. International Transfers
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Your data may be transferred to and processed in countries outside your residence. 
                  We ensure appropriate safeguards are in place for such transfers in compliance with 
                  applicable data protection laws.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  10. Children&apos;s Privacy
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Our services are not intended for children under 13. We do not knowingly collect 
                  personal data from children under 13. If you believe we have collected such data, 
                  please contact us immediately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  11. Changes to This Policy
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We may update this privacy policy from time to time. We will notify you of any 
                  material changes by posting the new policy on this page and updating the 
                  &quot;Last Updated&quot; date.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  12. Contact Us
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  If you have questions about this privacy policy, please contact us:
                </p>
                <ul className="list-none text-gray-600 dark:text-gray-300">
                  <li>Email: <a href="mailto:privacy@luvrix.com" className="text-purple-600 hover:underline">privacy@luvrix.com</a></li>
                  <li>Contact Form: <Link href="/contact" className="text-purple-600 hover:underline">Contact Page</Link></li>
                </ul>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <Link href="/" className="text-purple-600 hover:text-purple-700 dark:text-purple-400">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
