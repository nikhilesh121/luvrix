import Layout from "../../components/Layout";
import { motion } from "framer-motion";

export default function DMCA() {
  return (
    <Layout title="DMCA Policy" description="DMCA Policy for Luvrix.com">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
        >
          <h1 className="text-4xl font-bold text-white mb-6">DMCA Policy</h1>
          <p className="text-gray-400 mb-8">Last updated: January 2026</p>

          <div className="prose prose-lg max-w-none prose-invert">
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Digital Millennium Copyright Act Notice</h2>
            <p>
              Luvrix.com respects the intellectual property rights of others and expects its users to do 
              the same. In accordance with the Digital Millennium Copyright Act of 1998 ("DMCA"), we will 
              respond expeditiously to claims of copyright infringement committed using our website.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Our Policy</h2>
            <p>
              It is our policy to respond to any infringement notices and take appropriate actions under 
              the DMCA and other applicable intellectual property laws. If your copyrighted material has 
              been posted on our site or if links to your copyrighted material are returned through our 
              website and you want this material removed, you must provide a written communication that 
              details the information listed below.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">DMCA Notice Requirements</h2>
            <p>
              Please be advised that under Section 512(f) of the DMCA, any person who knowingly materially 
              misrepresents that material or activity is infringing may be subject to liability. Your DMCA 
              notice must include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Identification of the copyrighted work:</strong> A physical or electronic signature 
                of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.
              </li>
              <li>
                <strong>Identification of the infringing material:</strong> Identification of the material 
                that is claimed to be infringing and information reasonably sufficient to permit us to locate the material.
              </li>
              <li>
                <strong>Contact information:</strong> Your address, telephone number, and email address.
              </li>
              <li>
                <strong>Good faith statement:</strong> A statement that you have a good faith belief that 
                use of the material in the manner complained of is not authorized by the copyright owner, 
                its agent, or the law.
              </li>
              <li>
                <strong>Accuracy statement:</strong> A statement that the information in the notification 
                is accurate, and under penalty of perjury, that you are authorized to act on behalf of the 
                owner of an exclusive right that is allegedly infringed.
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">How to Submit a DMCA Notice</h2>
            <p>Send your DMCA notice to our designated Copyright Agent:</p>
            <div className="bg-white/5 p-4 rounded-lg mt-4 border border-white/10">
              <p><strong>Email:</strong> dmca@luvrix.com</p>
              <p><strong>Subject Line:</strong> DMCA Takedown Request</p>
            </div>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Counter-Notification</h2>
            <p>
              If you believe that your content that was removed (or to which access was disabled) is not 
              infringing, or that you have the authorization from the copyright owner, the copyright owner's 
              agent, or pursuant to the law, to post and use the material, you may send a counter-notification 
              containing the following information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your physical or electronic signature</li>
              <li>Identification of the content that has been removed</li>
              <li>A statement under penalty of perjury that you have a good faith belief that the content 
                  was removed as a result of mistake or misidentification</li>
              <li>Your name, address, telephone number, and email address</li>
              <li>A statement that you consent to the jurisdiction of the federal court</li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Repeat Infringers</h2>
            <p>
              In accordance with the DMCA and other applicable law, we have adopted a policy of terminating, 
              in appropriate circumstances, users who are deemed to be repeat infringers. We may also, at 
              our sole discretion, limit access to the website and/or terminate the accounts of any users 
              who infringe any intellectual property rights of others.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">External Links Disclaimer</h2>
            <p>
              Our manga redirect pages contain links to external websites. We do not host any copyrighted 
              manga content on our servers. We are merely a directory service that redirects users to 
              content hosted elsewhere. If you have copyright concerns about content on external websites, 
              please contact those websites directly.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Response Time</h2>
            <p>
              We aim to respond to all valid DMCA notices within 24-48 hours during business days. Upon 
              receipt of a valid DMCA notice, we will remove or disable access to the allegedly infringing 
              material promptly.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Contact Us</h2>
            <p>
              For any questions regarding this DMCA Policy, please contact us at: 
              <a href="mailto:dmca@luvrix.com" className="text-primary hover:underline ml-1">dmca@luvrix.com</a>
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
