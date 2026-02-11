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
  const startCountdown = useCountdown(giveaway.startDate);
  const hasWinner = giveaway.status === "winner_selected";
  const isUpcoming = giveaway.status === "upcoming" && !startCountdown.ended;

  return (
    <Link href={`/giveaway/${giveaway.slug}`} className="group block">
      <motion.div
        whileHover={{ y: -6, transition: { duration: 0.25 } }}
        className={`relative bg-[#0e0e18] rounded-2xl border shadow-lg transition-all duration-300 overflow-hidden ${
          isUpcoming
            ? "border-amber-500/10 hover:border-amber-500/20 shadow-black/20 hover:shadow-amber-500/10"
            : "border-white/[0.06] hover:border-purple-500/20 shadow-black/20 hover:shadow-purple-500/10"
        }`}
      >
        {/* Image */}
        <div className="relative overflow-hidden">
          <img
            src={giveaway.imageUrl}
            alt={giveaway.title}
            className={`w-full object-cover group-hover:scale-105 transition-transform duration-700 ${compact ? "h-36" : "h-48"}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e18] via-black/40 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className={`font-black text-white line-clamp-2 drop-shadow-lg ${compact ? "text-sm" : "text-lg"}`}>
              {giveaway.title}
            </h3>
          </div>

          {/* Status badges */}
          <div className="absolute top-3 right-3 flex gap-1.5">
            {hasWinner && (
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-purple-500/30">
                <FiAward className="w-3 h-3" /> Winner
              </span>
            )}
            {isUpcoming && (
              <span className="relative bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-amber-500/30">
                <span className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-40" />
                <span className="relative">Upcoming</span>
              </span>
            )}
            {giveaway.status === "active" && !ended && !hasWinner && (
              <span className="relative bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-green-500/30">
                <span className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-40" />
                <span className="relative">Live</span>
              </span>
            )}
            {ended && !hasWinner && !isUpcoming && (
              <span className="bg-red-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-red-500/20">
                Ended
              </span>
            )}
          </div>

          {/* Hover overlay */}
          {(!ended || isUpcoming) && !hasWinner && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30 backdrop-blur-[2px]">
              <motion.span
                initial={false}
                className={`px-5 py-2.5 text-white text-sm font-bold rounded-full shadow-xl ${
                  isUpcoming
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-500/30"
                }`}
              >
                {isUpcoming ? "Get Notified" : "Join Now"}
              </motion.span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Winner Banner */}
          {hasWinner && giveaway.winnerName && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-2.5 border border-purple-500/15">
              <FiAward className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-purple-300 truncate">
                Won by {giveaway.winnerName}
              </span>
            </div>
          )}

          {/* Prize */}
          {giveaway.prizeDetails && (
            <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
              <FiGift className="w-3.5 h-3.5 text-purple-400 inline mr-1.5 -mt-0.5" />
              {giveaway.prizeDetails}
            </p>
          )}

          {/* Countdown */}
          {isUpcoming ? (
            <div className="flex items-center gap-2">
              <FiClock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="text-[10px] text-amber-400 font-semibold mr-0.5">Starts in</span>
              <div className="flex gap-1.5">
                {[
                  { val: startCountdown.days, unit: "d", show: startCountdown.days > 0 },
                  { val: startCountdown.hours, unit: "h", show: true },
                  { val: startCountdown.minutes, unit: "m", show: true },
                  { val: startCountdown.seconds, unit: "s", show: !compact },
                ].filter(t => t.show).map((t) => (
                  <motion.span
                    key={t.unit}
                    initial={t.unit === "s" ? { opacity: 0.5, scale: 0.9 } : false}
                    animate={t.unit === "s" ? { opacity: 1, scale: 1 } : undefined}
                    className="bg-gradient-to-b from-amber-500/15 to-amber-900/10 text-white px-2 py-1 rounded-lg font-mono font-black text-xs border border-amber-500/15 shadow-sm shadow-amber-500/5"
                  >
                    {String(t.val).padStart(2, "0")}{t.unit}
                  </motion.span>
                ))}
              </div>
            </div>
          ) : !ended && !hasWinner ? (
            <div className="flex items-center gap-2">
              <FiClock className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              <div className="flex gap-1.5">
                {[
                  { val: days, unit: "d", show: days > 0 },
                  { val: hours, unit: "h", show: true },
                  { val: minutes, unit: "m", show: true },
                  { val: seconds, unit: "s", show: !compact },
                ].filter(t => t.show).map((t) => (
                  <motion.span
                    key={t.unit}
                    initial={t.unit === "s" ? { opacity: 0.5, scale: 0.9 } : false}
                    animate={t.unit === "s" ? { opacity: 1, scale: 1 } : undefined}
                    className="bg-gradient-to-b from-purple-500/15 to-purple-900/10 text-white px-2 py-1 rounded-lg font-mono font-black text-xs border border-purple-500/15 shadow-sm shadow-purple-500/5"
                  >
                    {String(t.val).padStart(2, "0")}{t.unit}
                  </motion.span>
                ))}
              </div>
            </div>
          ) : !hasWinner ? (
            <p className="text-xs text-red-400 font-semibold">Giveaway has ended</p>
          ) : null}

          {/* CTA */}
          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <FiUsers className="w-3 h-3" /> {isUpcoming ? "Coming soon" : giveaway.mode === "task_gated" ? "Task-based" : "Free entry"}
            </span>
            <span className={`text-xs font-bold group-hover:text-purple-300 transition flex items-center gap-1 ${isUpcoming ? "text-amber-400" : "text-purple-400"}`}>
              {isUpcoming ? "Notify Me" : "View"} <FiArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
