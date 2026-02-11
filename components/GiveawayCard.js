import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiGift, FiClock, FiUsers, FiArrowRight, FiAward } from "react-icons/fi";

function useCountdown(endDate) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: false });

  useEffect(() => {
    if (!endDate) return;
    const target = new Date(endDate).getTime();

    const update = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        ended: false,
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  return timeLeft;
}

export { useCountdown };

export default function GiveawayCard({ giveaway, compact = false }) {
  const { days, hours, minutes, seconds, ended } = useCountdown(giveaway.endDate);
  const hasWinner = giveaway.status === "winner_selected";

  return (
    <Link href={`/giveaway/${giveaway.slug}`} className="group block">
      <motion.div
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:shadow-purple-500/5 transition-shadow overflow-hidden"
      >
        {/* Image */}
        <div className="relative overflow-hidden">
          <img
            src={giveaway.imageUrl}
            alt={giveaway.title}
            className={`w-full object-cover group-hover:scale-105 transition-transform duration-700 ${compact ? "h-36" : "h-48"}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className={`font-bold text-white line-clamp-2 drop-shadow-sm ${compact ? "text-sm" : "text-lg"}`}>
              {giveaway.title}
            </h3>
          </div>

          {/* Status badges */}
          <div className="absolute top-3 right-3 flex gap-1.5">
            {hasWinner && (
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg">
                <FiAward className="w-3 h-3" /> Winner
              </span>
            )}
            {giveaway.status === "active" && !ended && !hasWinner && (
              <span className="relative bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                <span className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-40" />
                <span className="relative">Live</span>
              </span>
            )}
            {ended && !hasWinner && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Ended
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Winner Banner */}
          {hasWinner && giveaway.winnerName && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-2 mb-3 border border-purple-100 dark:border-purple-800/30">
              <FiAward className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 truncate">
                Won by {giveaway.winnerName}
              </span>
            </div>
          )}

          {/* Prize */}
          {giveaway.prizeDetails && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-3 flex items-center gap-1.5">
              <FiGift className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
              {giveaway.prizeDetails}
            </p>
          )}

          {/* Countdown */}
          {!ended && !hasWinner ? (
            <div className="flex items-center gap-2 mb-3">
              <FiClock className="w-3.5 h-3.5 text-amber-500" />
              <div className="flex gap-1.5 text-xs">
                {days > 0 && (
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded font-mono font-bold">{days}d</span>
                )}
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded font-mono font-bold">{String(hours).padStart(2, "0")}h</span>
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded font-mono font-bold">{String(minutes).padStart(2, "0")}m</span>
                {!compact && (
                  <motion.span
                    key={seconds}
                    initial={{ opacity: 0.5, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded font-mono font-bold"
                  >
                    {String(seconds).padStart(2, "0")}s
                  </motion.span>
                )}
              </div>
            </div>
          ) : !hasWinner ? (
            <p className="text-xs text-red-500 font-medium mb-3">Giveaway has ended</p>
          ) : null}

          {/* CTA */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <FiUsers className="w-3 h-3" /> {giveaway.mode === "task_gated" ? "Task-based" : "Free entry"}
            </span>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 group-hover:text-purple-700 transition flex items-center gap-1">
              View <FiArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
