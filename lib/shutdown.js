/**
 * Graceful Shutdown Handler
 * Handles SIGTERM/SIGINT for clean process termination
 * Ensures in-flight requests complete and connections close properly
 */

let isShuttingDown = false;
const shutdownCallbacks = [];

export function isShutdown() {
  return isShuttingDown;
}

export function onShutdown(callback) {
  shutdownCallbacks.push(callback);
}

export function initGracefulShutdown() {
  if (typeof process === "undefined") return;

  const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`[shutdown] Received ${signal}. Graceful shutdown starting...`);

    // Give in-flight requests 10 seconds to complete
    const forceTimeout = setTimeout(() => {
      console.error("[shutdown] Forced shutdown after timeout");
      process.exit(1);
    }, 10000);

    try {
      // Run all registered shutdown callbacks
      for (const cb of shutdownCallbacks) {
        try {
          await cb();
        } catch (err) {
          console.error("[shutdown] Callback error:", err.message);
        }
      }

      console.log("[shutdown] Graceful shutdown complete");
      clearTimeout(forceTimeout);
      process.exit(0);
    } catch (err) {
      console.error("[shutdown] Error during shutdown:", err);
      clearTimeout(forceTimeout);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

// Auto-initialize on first import (server-side only)
if (typeof window === "undefined") {
  initGracefulShutdown();
}

export default { initGracefulShutdown, onShutdown, isShutdown };
