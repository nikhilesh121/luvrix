import Layout from "../../components/Layout";
import { motion } from "framer-motion";

export default function Disclaimer() {
  return (
    <Layout title="Disclaimer" description="Disclaimer for Luvrix.com" canonical="https://luvrix.com/policy/disclaimer">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
        >
          <h1 className="text-4xl font-bold text-white mb-6">Disclaimer</h1>
          <p className="text-gray-400 mb-8">Last updated: January 2026</p>

          <div className="prose prose-lg max-w-none prose-invert">
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">General Information</h2>
            <p>
              The information provided by Luvrix.com ("we," "us," or "our") on our website is for general 
              informational purposes only. All information on the site is provided in good faith, however 
              we make no representation or warranty of any kind, express or implied, regarding the accuracy, 
              adequacy, validity, reliability, availability, or completeness of any information on the site.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">User-Generated Content</h2>
            <p>
              Luvrix.com allows users to post blog content. The views and opinions expressed in user-generated 
              content are those of the authors and do not necessarily reflect the official policy or position 
              of Luvrix.com. We are not responsible for the accuracy, completeness, or reliability of any 
              user-generated content.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">External Links</h2>
            <p>
              Our website may contain links to external websites that are not provided or maintained by us. 
              We do not guarantee the accuracy, relevance, timeliness, or completeness of any information 
              on these external websites.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Manga Redirect Pages</h2>
            <p>
              Our manga redirect pages link to external manga reading websites. We do not host any manga 
              content on our servers. We are not responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The content available on external manga websites</li>
              <li>The availability or accuracy of manga chapters</li>
              <li>Any issues that may arise from using external websites</li>
              <li>Copyright or licensing issues of external content</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">No Professional Advice</h2>
            <p>
              The site cannot and does not contain professional advice. The information is provided for 
              general informational and entertainment purposes only and is not a substitute for professional 
              advice. Accordingly, before taking any actions based upon such information, we encourage you 
              to consult with appropriate professionals.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Affiliate Links & Advertisements</h2>
            <p>
              Our website may contain advertisements and affiliate links. We may receive commissions when 
              you click on our affiliate links and make purchases. However, this does not impact our reviews 
              and comparisons. We try our best to keep things fair and balanced.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Errors and Omissions</h2>
            <p>
              While we have made every attempt to ensure that the information contained on this site is 
              accurate, we are not responsible for any errors or omissions, or for the results obtained 
              from the use of this information.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Fair Use</h2>
            <p>
              This site may contain copyrighted material the use of which has not always been specifically 
              authorized by the copyright owner. We believe this constitutes a "fair use" of any such 
              copyrighted material for purposes of criticism, comment, news reporting, teaching, scholarship, 
              or research.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Limitation of Liability</h2>
            <p>
              UNDER NO CIRCUMSTANCE SHALL WE HAVE ANY LIABILITY TO YOU FOR ANY LOSS OR DAMAGE OF ANY KIND 
              INCURRED AS A RESULT OF THE USE OF THE SITE OR RELIANCE ON ANY INFORMATION PROVIDED ON THE SITE. 
              YOUR USE OF THE SITE AND YOUR RELIANCE ON ANY INFORMATION ON THE SITE IS SOLELY AT YOUR OWN RISK.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Contact Us</h2>
            <p>
              If you have any questions about this Disclaimer, please contact us at: 
              <a href="mailto:info@luvrix.com" className="text-primary hover:underline ml-1">info@luvrix.com</a>
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
