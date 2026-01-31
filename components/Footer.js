import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getSettings, addSubscriber } from "../lib/api-client";
import { 
  FiMail, FiTwitter, FiFacebook, FiInstagram, FiYoutube,
  FiArrowRight, FiHeart, FiZap, FiSend, FiCheck, FiAlertCircle,
  FiGlobe, FiBookOpen, FiUsers, FiAward
} from "react-icons/fi";

export default function Footer() {
  const [settings, setSettings] = useState(null);
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState(null); // 'success', 'error', 'already'

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setSubscribeStatus("invalid");
      setTimeout(() => setSubscribeStatus(null), 3000);
      return;
    }

    setSubscribing(true);
    try {
      const result = await addSubscriber(email);
      if (result.success) {
        setSubscribeStatus("success");
        setEmail("");
      } else if (result.error === "already_subscribed") {
        setSubscribeStatus("already");
      } else {
        setSubscribeStatus("error");
      }
    } catch (error) {
      setSubscribeStatus("error");
    } finally {
      setSubscribing(false);
      setTimeout(() => setSubscribeStatus(null), 4000);
    }
  };

  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: FiTwitter, href: "#", label: "Twitter" },
    { icon: FiFacebook, href: "#", label: "Facebook" },
    { icon: FiInstagram, href: "#", label: "Instagram" },
    { icon: FiYoutube, href: "#", label: "YouTube" },
  ];

  const quickLinks = [
    { label: "Home", href: "/" },
    { label: "Categories", href: "/categories" },
    { label: "Manga", href: "/manga" },
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Write Blog", href: "/create-blog" },
  ];

  const legalLinks = [
    { label: "Privacy Policy", href: "/policy/privacy" },
    { label: "Terms of Service", href: "/policy/terms" },
    { label: "Disclaimer", href: "/policy/disclaimer" },
    { label: "DMCA", href: "/policy/dmca" },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-gray-900 via-gray-900 to-black text-gray-300 overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>

      {/* Newsletter Section */}
      <div className="relative border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2 justify-center md:justify-start">
                <FiZap className="text-yellow-400" />
                Stay Updated
              </h3>
              <p className="text-gray-400">Get the latest articles delivered to your inbox</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex flex-col w-full md:w-auto">
              <div className="flex">
                <div className="relative flex-1 md:w-80">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={subscribing}
                    className="w-full px-5 py-3.5 bg-gray-800/50 border border-gray-700 rounded-l-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={subscribing}
                  whileHover={{ scale: subscribing ? 1 : 1.02 }}
                  whileTap={{ scale: subscribing ? 1 : 0.98 }}
                  className="px-6 py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-r-xl flex items-center gap-2 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-70"
                >
                  {subscribing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiSend className="w-4 h-4" />
                  )}
                  {subscribing ? "..." : "Subscribe"}
                </motion.button>
              </div>
              {/* Status Messages */}
              <AnimatePresence>
                {subscribeStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                      subscribeStatus === "success" ? "bg-green-500/20 text-green-400" :
                      subscribeStatus === "already" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {subscribeStatus === "success" ? (
                      <><FiCheck className="w-4 h-4" /> Successfully subscribed! Thank you.</>
                    ) : subscribeStatus === "already" ? (
                      <><FiAlertCircle className="w-4 h-4" /> You're already subscribed!</>
                    ) : subscribeStatus === "invalid" ? (
                      <><FiAlertCircle className="w-4 h-4" /> Please enter a valid email.</>
                    ) : (
                      <><FiAlertCircle className="w-4 h-4" /> Something went wrong. Try again.</>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="relative max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
                <span className="text-white font-bold text-xl">L</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {settings?.siteName || "Luvrix"}
              </span>
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Your ultimate destination for stories, insights, and knowledge. Join our community of passionate writers and readers.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-gray-800 hover:bg-gradient-to-br hover:from-primary hover:to-secondary rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-6 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-primary to-secondary rounded-full"></div>
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href} 
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <FiArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold mb-6 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-primary to-secondary rounded-full"></div>
              Legal
            </h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href} 
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <FiArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-6 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-primary to-secondary rounded-full"></div>
              Get In Touch
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiMail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email us at</p>
                  <a href="mailto:contact@luvrix.com" className="text-white hover:text-primary transition-colors">
                    contact@luvrix.com
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="relative border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              {settings?.footerText || `© ${currentYear} Luvrix.com - All Rights Reserved`}
            </p>
            <p className="text-gray-500 text-sm flex items-center gap-1">
              Made with <FiHeart className="w-4 h-4 text-red-500" /> for creators worldwide
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
