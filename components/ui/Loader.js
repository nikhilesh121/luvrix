import { motion } from "framer-motion";

export default function Loader({ fullScreen = false, size = "md", text = "" }) {
  const sizes = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-3",
    lg: "w-14 h-14 border-4",
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className={`${sizes[size]} border-primary/20 rounded-full`}></div>
        <div className={`absolute top-0 left-0 ${sizes[size]} border-primary border-t-transparent rounded-full animate-spin`}></div>
      </div>
      {text && <p className="text-gray-500 text-sm font-medium">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex items-center justify-center"
      >
        {spinner}
      </motion.div>
    );
  }

  return spinner;
}

export function ButtonLoader({ className = "" }) {
  return (
    <div className={`w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin ${className}`}></div>
  );
}
