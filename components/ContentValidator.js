import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { validateContent, getValidationStatusColor, getValidationStatusMessage } from "../utils/contentValidator";
import { FiCheck, FiX, FiAlertTriangle, FiShield, FiChevronDown, FiChevronUp } from "react-icons/fi";

export default function ContentValidator({ blog, onValidationChange }) {
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (blog?.title || blog?.content) {
      const validationResult = validateContent(blog);
      setResult(validationResult);
      onValidationChange?.(validationResult, agreed);
    }
  }, [blog?.title, blog?.content, agreed]);

  useEffect(() => {
    if (result) {
      onValidationChange?.(result, agreed);
    }
  }, [agreed, result]);

  if (!result) return null;

  const statusColor = getValidationStatusColor(result.score);
  const statusMessage = getValidationStatusMessage(result.score);

  return (
    <div className="bg-white dark:bg-white/5 rounded-2xl shadow-lg dark:shadow-none border dark:border-white/10 overflow-hidden">
      {/* Header */}
      <div 
        className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: statusColor }}
            >
              <FiShield className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Content Policy Check</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{statusMessage}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-bold" style={{ color: statusColor }}>
                {result.score}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">/ 100</div>
            </div>
            {expanded ? (
              <FiChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <FiChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              {/* Issues */}
              {result.issues.length > 0 && (
                <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-4">
                  <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                    <FiX className="w-5 h-5" /> Policy Violations ({result.issues.length})
                  </h4>
                  <ul className="space-y-2">
                    {result.issues.map((issue, i) => (
                      <li key={i} className="text-sm text-red-600 dark:text-red-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                        {issue.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-500/10 rounded-xl p-4">
                  <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-3 flex items-center gap-2">
                    <FiAlertTriangle className="w-5 h-5" /> Warnings ({result.warnings.length})
                  </h4>
                  <ul className="space-y-2">
                    {result.warnings.map((warning, i) => (
                      <li key={i} className="text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                        {warning.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Passed Checks */}
              {result.passed.length > 0 && (
                <div className="bg-green-50 dark:bg-green-500/10 rounded-xl p-4">
                  <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                    <FiCheck className="w-5 h-5" /> Passed Checks ({result.passed.length})
                  </h4>
                  <ul className="space-y-2">
                    {result.passed.map((item, i) => (
                      <li key={i} className="text-sm text-green-600 dark:text-green-300 flex items-start gap-2">
                        <FiCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Google Policy Agreement */}
              <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-5 h-5 rounded border-blue-300 dark:border-blue-600 text-blue-600 focus:ring-blue-500 mt-0.5 dark:bg-white/5"
                  />
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-300">
                      I confirm this content complies with Google policies
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      By checking this box, you confirm that your content follows{" "}
                      <a 
                        href="https://support.google.com/adsense/answer/48182" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-800"
                      >
                        Google AdSense policies
                      </a>
                      {" "}and{" "}
                      <a 
                        href="https://developers.google.com/search/docs/essentials" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-800"
                      >
                        Google Search guidelines
                      </a>.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Status Bar */}
      <div 
        className="h-1.5" 
        style={{ 
          background: `linear-gradient(to right, ${statusColor} ${result.score}%, #e5e7eb ${result.score}%)` 
        }} 
      />
    </div>
  );
}
