import { useState } from "react";
import Layout from "../components/Layout";
import { getApiUrl } from "../lib/api-config";
import { motion } from "framer-motion";
import { FiMail, FiMapPin, FiSend, FiCheck, FiMessageCircle, FiUser, FiZap, FiHeart } from "react-icons/fi";
import Head from "next/head";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://luvrix.com";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(getApiUrl("/api/send-email"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contact",
          to: "support@luvrix.com",
          data: {
            name: formData.name,
            email: formData.email,
            message: `Subject: ${formData.subject}\n\n${formData.message}`
          }
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setError("Failed to send message. Please try again.");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: FiMail,
      title: "Email Us",
      value: "contact@luvrix.com",
      href: "mailto:contact@luvrix.com",
      color: "from-purple-500 to-pink-500",
      bg: "bg-purple-100"
    },
    {
      icon: FiMapPin,
      title: "Location",
      value: "Worldwide",
      href: null,
      color: "from-blue-500 to-cyan-500",
      bg: "bg-blue-100"
    },
    {
      icon: FiMessageCircle,
      title: "Response Time",
      value: "Within 24 hours",
      href: null,
      color: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-100"
    }
  ];

  return (
    <Layout title="Contact Us" description="Get in touch with Luvrix. We'd love to hear from you!" canonical={`${SITE_URL}/contact/`}>
      <Head>
        <meta name="keywords" content="contact luvrix, support, feedback, get in touch" />
      </Head>

      {/* Hero Section */}
      <div className="relative bg-[#0a0a0f] overflow-hidden">
        <div className="absolute inset-0">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-0 left-0 w-[400px] h-[400px] bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-full blur-[100px]"
          />
          <motion.div 
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-gradient-to-r from-blue-600/30 to-cyan-600/30 rounded-full blur-[100px]"
          />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }} />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30">
              <FiMessageCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              Get in <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Touch</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Have a question, feedback, or just want to say hello? We'd love to hear from you!
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-24 relative z-20 mb-12">
          {contactInfo.map((info, index) => (
            <motion.div
              key={info.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100 hover:shadow-2xl transition-shadow"
            >
              <div className={`w-14 h-14 bg-gradient-to-r ${info.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                <info.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">{info.title}</h3>
              {info.href ? (
                <a href={info.href} className="text-slate-500 hover:text-purple-600 transition">
                  {info.value}
                </a>
              ) : (
                <p className="text-slate-500">{info.value}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100"
        >
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* Left Side - Info */}
            <div className="lg:col-span-2 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 p-8 lg:p-12 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 right-10 w-32 h-32 border border-white rounded-full"></div>
                <div className="absolute bottom-20 left-10 w-20 h-20 border border-white rounded-full"></div>
              </div>
              
              <div className="relative z-10">
                <h2 className="text-3xl font-black mb-4">Let's Start a Conversation</h2>
                <p className="text-white/80 mb-8">
                  Fill out the form and our team will get back to you within 24 hours.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <FiZap className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Fast Response</h4>
                      <p className="text-white/70 text-sm">We reply within 24 hours</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <FiHeart className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Friendly Support</h4>
                      <p className="text-white/70 text-sm">We're here to help you</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side - Form */}
            <div className="lg:col-span-3 p-8 lg:p-12">
              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                    <FiCheck className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-800 mb-3">Thank You!</h3>
                  <p className="text-slate-500 mb-8">We've received your message and will get back to you soon.</p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                  >
                    Send Another Message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                        <FiMail className="w-4 h-4" />
                      </div>
                      {error}
                    </motion.div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Your Name</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <FiUser className="w-5 h-5 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <FiMail className="w-5 h-5 text-slate-400" />
                        </div>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                      placeholder="How can we help?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Your Message</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none resize-none"
                      placeholder="Tell us more about your question or feedback..."
                    />
                  </div>
                  
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <FiSend className="w-5 h-5" /> Send Message
                      </>
                    )}
                  </motion.button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}

// SSR required for SEO meta tags to be rendered server-side
export async function getServerSideProps() {
  return { props: {} };
}
