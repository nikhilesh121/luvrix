import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiAward } from "react-icons/fi";

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

const COLORS = ["#9333ea", "#ec4899", "#f59e0b", "#22c55e", "#3b82f6", "#ef4444"];

function Particle({ index, onDone }) {
  const color = COLORS[index % COLORS.length];
  const size = randomBetween(6, 14);
  const startX = randomBetween(-150, 150);
  const endX = startX + randomBetween(-100, 100);
  const startY = 0;
  const endY = randomBetween(200, 500);
  const rotation = randomBetween(-360, 360);
  const duration = randomBetween(1.5, 3);
  const delay = randomBetween(0, 0.8);
  const shape = index % 3; // 0 = square, 1 = circle, 2 = triangle

  return (
    <motion.div
      initial={{ x: startX, y: startY, opacity: 1, rotate: 0, scale: 1 }}
      animate={{ x: endX, y: endY, opacity: 0, rotate: rotation, scale: 0.3 }}
      transition={{ duration, delay, ease: "easeOut" }}
      onAnimationComplete={onDone}
      style={{
        position: "absolute",
        width: size,
        height: size,
        backgroundColor: shape !== 2 ? color : "transparent",
        borderRadius: shape === 1 ? "50%" : shape === 0 ? "2px" : "0",
        borderLeft: shape === 2 ? `${size / 2}px solid transparent` : undefined,
        borderRight: shape === 2 ? `${size / 2}px solid transparent` : undefined,
        borderBottom: shape === 2 ? `${size}px solid ${color}` : undefined,
        top: "50%",
        left: "50%",
        pointerEvents: "none",
      }}
    />
  );
}

export default function ConfettiWinner({ winnerName, winnerPhoto, show = true }) {
  const [particles, setParticles] = useState([]);
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setParticles(Array.from({ length: 50 }, (_, i) => i));
    }
  }, [show]);

  const handleParticleDone = useCallback(() => {}, []);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative text-center py-8 overflow-hidden"
      >
        {/* Confetti particles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          {particles.map((i) => (
            <Particle key={i} index={i} onDone={handleParticleDone} />
          ))}
        </div>

        {/* Winner display */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
          className="relative z-10"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            {winnerPhoto ? (
              <img src={winnerPhoto} alt={winnerName} className="w-full h-full rounded-full object-cover border-4 border-white" />
            ) : (
              <FiAward className="w-10 h-10 text-white" />
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">🎉 Winner</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{winnerName || "Winner Announced!"}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Congratulations!</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
