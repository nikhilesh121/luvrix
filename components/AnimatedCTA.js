import { motion } from "framer-motion";

export default function AnimatedCTA({ children, onClick, disabled, variant = "join", className = "" }) {
  const variants = {
    join: "from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-500/25",
    joined: "from-green-500 to-emerald-600 cursor-default shadow-green-500/20",
    eligible: "from-emerald-500 to-teal-600 cursor-default shadow-emerald-500/20",
    winner: "from-amber-500 to-yellow-500 cursor-default shadow-amber-500/30",
    disabled: "from-gray-400 to-gray-500 cursor-not-allowed opacity-60",
  };

  const bgClass = variants[variant] || variants.join;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || variant === "joined" || variant === "eligible" || variant === "winner"}
      whileHover={variant === "join" && !disabled ? { scale: 1.02 } : {}}
      whileTap={variant === "join" && !disabled ? { scale: 0.98 } : {}}
      className={`relative w-full py-3.5 bg-gradient-to-r ${bgClass} text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg overflow-hidden disabled:pointer-events-none ${className}`}
    >
      {/* Pulse ring for join state */}
      {variant === "join" && !disabled && (
        <motion.span
          className="absolute inset-0 rounded-xl border-2 border-white/30"
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Shimmer for winner state */}
      {variant === "winner" && (
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ width: "200%" }}
        />
      )}

      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}
