import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const TrendPrediction = ({ coin, prediction, connectionStatus = "connecting" }) => {
  const getTrendColor = (trend) => {
    switch (trend) {
      case "bullish":
        return {
          primary: "text-cyan-400",
          bg: "bg-cyan-500/10",
          border: "border-cyan-400/40",
          glow: "shadow-[0_0_20px_rgba(34,211,238,0.3)]",
          bar: "bg-gradient-to-r from-cyan-400 to-blue-500",
          pulse: "bg-cyan-500/20",
        };
      case "bearish":
        return {
          primary: "text-purple-400",
          bg: "bg-purple-500/10",
          border: "border-purple-400/40",
          glow: "shadow-[0_0_20px_rgba(192,132,252,0.3)]",
          bar: "bg-gradient-to-r from-purple-400 to-fuchsia-500",
          pulse: "bg-purple-500/20",
        };
      default:
        return {
          primary: "text-blue-400",
          bg: "bg-blue-500/10",
          border: "border-blue-400/40",
          glow: "shadow-[0_0_20px_rgba(96,165,250,0.3)]",
          bar: "bg-gradient-to-r from-blue-400 to-indigo-500",
          pulse: "bg-blue-500/20",
        };
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "bullish":
        return "🚀";
      case "bearish":
        return "⚡";
      default:
        return "🔄";
    }
  };

  const getConnectionDisplay = () => {
    switch (connectionStatus) {
      case "connecting":
        return {
          text: "CONNECTING...",
          color: "text-yellow-400",
          pulse: "bg-yellow-500/20",
        };
      case "connected":
        return {
          text: "LIVE",
          color: "text-green-400",
          pulse: "bg-green-500/20",
        };
      case "reconnecting":
        return {
          text: "RECONNECTING...",
          color: "text-yellow-400",
          pulse: "bg-yellow-500/20",
        };
      case "error":
        return {
          text: "CONNECTION ERROR",
          color: "text-red-400",
          pulse: "bg-red-500/20",
        };
      default:
        return {
          text: "DISCONNECTED",
          color: "text-gray-400",
          pulse: "bg-gray-500/20",
        };
    }
  };

  const connection = getConnectionDisplay();

  if (!prediction || prediction.confidence <= 0.15) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900/80 rounded-xl p-6 border-2 border-gray-700 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="text-2xl"
            >
              ⏳
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-gray-300 font-orbitron">
                ANALYZING TREND
              </h3>
              <p className="text-sm text-gray-400 font-rajdhani">
                {coin} • COLLECTING MARKET DATA...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-2 h-2 rounded-full ${connection.pulse}`}
            />
            <span className={`text-xs font-rajdhani ${connection.color}`}>
              {connection.text}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <div className="w-full bg-gray-800 rounded-full h-2">
            <motion.div
              animate={{ width: ["0%", "100%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
            />
          </div>
        </div>
      </motion.div>
    );
  }

  const colors = getTrendColor(prediction.trend);
  const confidencePercentage = prediction.confidence
    ? Math.round(prediction.confidence * 100)
    : 0;

  const formatExplanation = (explanation) => {
    if (!explanation) return ["No analysis available"];
    if (Array.isArray(explanation)) return explanation;
    if (typeof explanation === "string") {
      return explanation.split("; ").filter((line) => line.trim());
    }
    return [String(explanation)];
  };

  const explanationLines = formatExplanation(prediction.explanation);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={`rounded-xl p-6 border-2 backdrop-blur-sm transition-all duration-500 ${colors.bg} ${colors.border} ${colors.glow}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-3xl"
            >
              {getTrendIcon(prediction.trend)}
            </motion.span>
            <div>
              <motion.h3
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                className={`text-xl font-bold uppercase tracking-wider font-orbitron ${colors.primary}`}
              >
                {prediction.trend} TREND
              </motion.h3>
              <p className="text-sm text-gray-300 font-rajdhani mt-1">
                {coin} •{" "}
                <span className={colors.primary}>{confidencePercentage}%</span>{" "}
                CONFIDENCE
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-right"
          >
            <div className="flex items-center gap-2 justify-end mb-1">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-green-500"
              />
              <div className="text-sm text-green-400 font-rajdhani">LIVE</div>
            </div>
            <div className="text-xs text-gray-400 font-rajdhani">
              {prediction.timestamp
                ? new Date(prediction.timestamp).toLocaleTimeString()
                : "Just now"}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-black/40 rounded-lg p-4 border border-gray-700/50 mb-4"
        >
          <div className="text-sm text-gray-200 leading-relaxed font-rajdhani">
            {explanationLines.map((line, index) => (
              <motion.div
                key={index}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-start gap-3 mb-2 last:mb-0"
              >
                <span className={`text-xs mt-1 ${colors.primary}`}>▶</span>
                <span>{line}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-4"
        >
          <div className="flex justify-between text-sm mb-2 font-rajdhani">
            <span className="text-gray-300">AI CONFIDENCE LEVEL</span>
            <span className={colors.primary}>{confidencePercentage}%</span>
          </div>

          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-600">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidencePercentage}%` }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.7 }}
              className={`h-3 rounded-full relative ${colors.bar}`}
            >
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
            </motion.div>
          </div>

          <div className="flex justify-between text-xs text-gray-400 mt-1 font-rajdhani">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>

          <div className="text-xs text-gray-500 text-center mt-2 font-rajdhani">
            {confidencePercentage >= 80 && "Very High Confidence"}
            {confidencePercentage >= 60 &&
              confidencePercentage < 80 &&
              "High Confidence"}
            {confidencePercentage >= 40 &&
              confidencePercentage < 60 &&
              "Medium Confidence"}
            {confidencePercentage >= 20 &&
              confidencePercentage < 40 &&
              "Low Confidence"}
            {confidencePercentage < 20 && "Very Low Confidence"}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex justify-between items-center mt-4 pt-3 border-t border-gray-700/50"
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connection.pulse}`} />
            <span className={`text-xs ${connection.color} font-rajdhani`}>
              {connection.text}
            </span>
          </div>
          <span className="text-xs text-gray-500 font-rajdhani">
            Powered by Advanced AI
          </span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TrendPrediction;
