import Layout from "../../components/Layout";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
  return (
    <Layout title="Privacy Policy" description="Privacy Policy for Luvrix.com" canonical="https://luvrix.com/policy/privacy/">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
        >
          <h1 className="text-4xl font-bold text-white mb-6">Privacy Policy</h1>
          <p className="text-gray-400 mb-8">Last updated: January 2026</p>

          <div className="prose prose-lg max-w-none prose-invert">
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Introduction</h2>
            <p>
              Welcome to Luvrix.com. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you about how we look after your personal data when you visit our 
              website and tell you about your privacy rights.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Information We Collect</h2>
            <p>We may collect, use, store and transfer different kinds of personal data about you:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Identity Data:</strong> includes first name, last name, username</li>
              <li><strong>Contact Data:</strong> includes email address</li>
              <li><strong>Technical Data:</strong> includes IP address, browser type and version, time zone setting, 
                  browser plug-in types and versions, operating system and platform</li>
              <li><strong>Usage Data:</strong> includes information about how you use our website and services</li>
              <li><strong>Content Data:</strong> includes blog posts, comments, and other content you submit</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use your personal data for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To register you as a new user</li>
              <li>To manage your account and provide our services</li>
              <li>To process and deliver your blog posts</li>
              <li>To manage payments and billing</li>
              <li>To send you important updates about your account</li>
              <li>To improve our website and services</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being 
              accidentally lost, used, or accessed in an unauthorized way. We use industry-standard encryption 
              and secure data storage practices.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>MongoDB:</strong> For secure database storage</li>
              <li><strong>Google Analytics:</strong> For website analytics (if enabled)</li>
              <li><strong>Google AdSense:</strong> For displaying advertisements (if enabled)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our website. Cookies are 
              files with a small amount of data which may include an anonymous unique identifier.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Request access to your personal data</li>
              <li>Request correction of your personal data</li>
              <li>Request erasure of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request restriction of processing your personal data</li>
              <li>Request transfer of your personal data</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at: 
              <a href="mailto:privacy@luvrix.com" className="text-primary hover:underline ml-1">privacy@luvrix.com</a>
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">9. Changes to This Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}

// SSR required for SEO meta tags to be rendered server-side
