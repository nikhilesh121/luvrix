import Link from "next/link";
import Layout from "../components/Layout";

export default function TermsOfService() {
  return (
    <Layout title="Terms of Service" description="Luvrix Terms of Service - Rules and guidelines for using our platform" canonical="https://luvrix.com/terms">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
              Terms of Service
            </h1>
            
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              <strong>Last Updated:</strong> February 3, 2026
            </p>

            <div className="prose dark:prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  1. Acceptance of Terms
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  By accessing or using Luvrix, you agree to be bound by these Terms of Service and 
                  our Privacy Policy. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  2. Description of Service
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Luvrix is a platform that provides access to manga, blogs, and community features. 
                  We reserve the right to modify, suspend, or discontinue any aspect of our services 
                  at any time.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  3. User Accounts
                </h2>
                <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4">
                  <li>You must be at least 13 years old to create an account</li>
                  <li>You are responsible for maintaining account security</li>
                  <li>You must provide accurate information</li>
                  <li>One account per person is allowed</li>
                  <li>You are responsible for all activity under your account</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  4. User Conduct
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  You agree NOT to:
                </p>
                <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4">
                  <li>Violate any laws or regulations</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Upload malicious content or malware</li>
                  <li>Harass, abuse, or threaten other users</li>
                  <li>Spam or engage in unauthorized advertising</li>
                  <li>Attempt to hack or disrupt our services</li>
                  <li>Scrape or collect user data without permission</li>
                  <li>Impersonate others or create fake accounts</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  5. Content Guidelines
                </h2>
                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">
                  5.1 User-Generated Content
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  You retain ownership of content you create but grant us a license to display, 
                  distribute, and modify it for operating our services.
                </p>
                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">
                  5.2 Prohibited Content
                </h3>
                <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4">
                  <li>Illegal content</li>
                  <li>Hate speech or discrimination</li>
                  <li>Explicit content involving minors</li>
                  <li>Doxxing or private information</li>
                  <li>Misinformation or harmful content</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  6. Intellectual Property
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  All content, trademarks, and intellectual property on Luvrix are owned by us or 
                  our licensors. You may not copy, modify, or distribute our content without permission.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  7. DMCA and Copyright
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We respect intellectual property rights. If you believe content infringes your 
                  copyright, please submit a DMCA notice to{" "}
                  <a href="mailto:dmca@luvrix.com" className="text-purple-600 hover:underline">
                    dmca@luvrix.com
                  </a>
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  8. Termination
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We may suspend or terminate your account at any time for violations of these terms. 
                  You may also delete your account at any time through your account settings.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  9. Disclaimers
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Our services are provided &quot;as is&quot; without warranties of any kind. We do not 
                  guarantee uninterrupted or error-free service. We are not responsible for 
                  third-party content or links.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  10. Limitation of Liability
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  To the maximum extent permitted by law, Luvrix shall not be liable for any 
                  indirect, incidental, special, consequential, or punitive damages arising from 
                  your use of our services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  11. Indemnification
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  You agree to indemnify and hold Luvrix harmless from any claims, losses, or 
                  damages arising from your use of our services or violation of these terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  12. Governing Law
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  These terms shall be governed by the laws of the jurisdiction in which Luvrix 
                  operates, without regard to conflict of law principles.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  13. Changes to Terms
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We may modify these terms at any time. Continued use of our services after 
                  changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  14. Contact
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  For questions about these terms, contact us at{" "}
                  <a href="mailto:legal@luvrix.com" className="text-purple-600 hover:underline">
                    legal@luvrix.com
                  </a>
                </p>
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
