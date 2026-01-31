import Layout from "../../components/Layout";
import { motion } from "framer-motion";

export default function TermsOfService() {
  return (
    <Layout title="Terms of Service" description="Terms of Service for Luvrix.com">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
        >
          <h1 className="text-4xl font-bold text-white mb-6">Terms of Service</h1>
          <p className="text-gray-400 mb-8">Last updated: January 2026</p>

          <div className="prose prose-lg max-w-none prose-invert">
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Luvrix.com, you accept and agree to be bound by the terms and 
              provision of this agreement. If you do not agree to abide by these terms, please do not 
              use this service.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. User Accounts</h2>
            <p>To use certain features of our service, you must register for an account. You agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. User Content</h2>
            <p>When you submit content to our platform, you agree that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You own or have the right to use the content</li>
              <li>Your content does not violate any laws or third-party rights</li>
              <li>Your content is not spam, harmful, or misleading</li>
              <li>We may review, edit, or remove content at our discretion</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Blog Posting Rules</h2>
            <p>Users must follow these guidelines when creating blog posts:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Content must meet minimum SEO score requirements</li>
              <li>No plagiarized or copied content</li>
              <li>No spam, advertising, or promotional content without approval</li>
              <li>No illegal, harmful, or offensive content</li>
              <li>No content that infringes on intellectual property rights</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Payment Terms</h2>
            <p>For paid services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Each user receives 1 free blog post</li>
              <li>Additional posts require payment at current pricing</li>
              <li>All payments are processed securely</li>
              <li>Refunds are handled on a case-by-case basis</li>
              <li>Prices may change with notice</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Prohibited Activities</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the service</li>
              <li>Upload malware or harmful code</li>
              <li>Impersonate others or provide false information</li>
              <li>Scrape or harvest data from our website</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time, with or without 
              notice, for conduct that we believe violates these Terms of Service or is harmful to other 
              users, us, or third parties, or for any other reason.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. 
              WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">9. Limitation of Liability</h2>
            <p>
              IN NO EVENT SHALL LUVRIX.COM BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, 
              OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of any material 
              changes by posting the new Terms of Service on this page.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">11. Contact</h2>
            <p>
              For any questions regarding these Terms of Service, please contact us at: 
              <a href="mailto:legal@luvrix.com" className="text-primary hover:underline ml-1">legal@luvrix.com</a>
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
