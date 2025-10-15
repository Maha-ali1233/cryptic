import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion"; // Ensure motion is imported
import PriceGraph from "../components/PriceGraph";
import TrendPrediction from "../components/TrendPrediction";

// --- ANIMATION VARIANTS ---
// This variant will be used for items appearing as they scroll into view
const itemInViewVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

// This is the specific variant for the main heading (instant fade-in on mount)
const headingVariants = {
  dark: { opacity: 0, y: -20 },
  appear: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.5, ease: "easeInOut" },
  },
};

export default function Dashboard() {
  const coins = ["BTC", "ETH", "DOT", "ENA"];
  const timeframes = ["2s", "1m", "15m", "1h"];

  const [prices, setPrices] = useState({
    BTC: null,
    ETH: null,
    DOT: null,
    ENA: null,
  });
  const [selectedCoin, setSelectedCoin] = useState("DOT");
  const [selectedTimeframe, setSelectedTimeframe] = useState("2s");
  const [chartData, setChartData] = useState([]);

  // ... (Refs and intervalMs functions remain unchanged)
  const historyRef = useRef({
    BTC: { "2s": [], "1m": [], "15m": [], "1h": [] },
    ETH: { "2s": [], "1m": [], "15m": [], "1h": [] },
    DOT: { "2s": [], "1m": [], "15m": [], "1h": [] },
    ENA: { "2s": [], "1m": [], "15m": [], "1h": [] },
  });

  const lastUpdateRef = useRef({});

  const intervalMs = (tf) => {
    switch (tf) {
      case "2s":
        return 1000;
      case "1m":
        return 60_000;
      case "15m":
        return 15 * 60_000;
      case "1h":
        return 60 * 60_000;
      default:
        return 2000;
    }
  };

  // --- WebSocket Logic (Remains unchanged) ---
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");
    ws.onopen = () => console.log("✅ WebSocket connected");
    ws.onclose = () => console.log("🔌 WebSocket closed");
    ws.onerror = (err) => console.error("⚠️ WebSocket error:", err);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.BTC || data.ETH || data.DOT || data.ENA) {
        setPrices((prev) => ({ ...prev, ...data }));
      }

      const now = Date.now();
      coins.forEach((coin) => {
        if (data[coin] === null) return;
        timeframes.forEach((tf) => {
          const last = lastUpdateRef.current[`${coin}_${tf}`] || 0;
          if (now - last >= intervalMs(tf)) {
            const arr = historyRef.current[coin][tf];
            arr.push(data[coin]);
            if (arr.length > 60) arr.shift();
            lastUpdateRef.current[`${coin}_${tf}`] = now;
          }
        });
      });
      setChartData([...historyRef.current[selectedCoin][selectedTimeframe]]);
    };
    return () => ws.close();
  }, [selectedCoin, selectedTimeframe]);

  useEffect(() => {
    setChartData([...historyRef.current[selectedCoin][selectedTimeframe]]);
  }, [selectedCoin, selectedTimeframe]);
  // ---------------------------------------------

  return (
    // 1. Main container: Removed initial/animate to allow scrolling
    <motion.div className="min-h-screen bg-black pt-[200px] text-gray-100 flex flex-col items-center p-6 relative overflow-hidden font-mono">
      {/* 🔮 Background Grid Overlay */}
      <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]"></div>

      {/* 🖼️ Main Header: Fades in immediately on mount */}
      <motion.h1
        className="text-6xl text-cyan-400 pb-[40px] font-extrabold mb-8 tracking-widest relative z-10 neon-glow animate-pulse pt-20" // Added padding top for space
        variants={headingVariants}
        initial="dark"
        animate="appear"
      >
        CYPHER-TRACER 7
      </motion.h1>

      {/* ⚙️ Coin Selector: Appears when it scrolls into view */}
      <motion.div
        className="flex  gap-4 mb-8 z-10 p-2 bg-gray-900/40 rounded-xl border border-cyan-700/50 shadow-2xl shadow-cyan-900/50"
        variants={itemInViewVariants}
        initial="hidden"
        whileInView="visible" // <-- Triggers animation when section enters viewport
        viewport={{ once: true, amount: 0.5 }} // Animates once when 50% visible
      >
        {coins.map((coin) => (
          <motion.button
            key={coin}
            onClick={() => setSelectedCoin(coin)}
            className={`px-6 py-3 rounded-full font-bold transition-all duration-300 transform text-lg uppercase tracking-wider
            ${
              selectedCoin === coin
                ? "bg-cyan-500 text-gray-950 border-4 border-cyan-200 shadow-[0_0_20px_rgba(52,211,255,1)] scale-110"
                : "bg-gray-800 text-cyan-400 border-2 border-cyan-700"
            }`}
            // Framer Motion Hover/Tap Effects
            whileHover={{ scale: 1.15, rotate: 1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {coin}
          </motion.button>
        ))}
      </motion.div>

      {/* 📊 Main Layout: Two Columns - Appears when it scrolls into view */}
      <motion.div
        className="flex flex-col lg:flex-row w-full max-w-7xl gap-6 z-10"
        variants={itemInViewVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {/* --- LEFT COLUMN: Graph & Price --- */}
        <div className="flex-1 lg:w-2/3 space-y-6">
          {/* 📈 Price Graph Container */}
          <div className="p-2 border-4 border-cyan-500/50 rounded-2xl shadow-[0_0_40px_rgba(52,211,255,0.7)] bg-gray-900/70 backdrop-blur-sm transition-all duration-500 relative min-h-[400px]">
            {/* Holographic Header */}
            <h2 className="text-2xl text-cyan-400 font-bold mb-3 p-2 border-b border-cyan-500/50 tracking-wide">
              PRICE FEED - [{selectedTimeframe}]
            </h2>
            {/* Image Placeholder */}
            <img
              src={`/images/${selectedCoin.toLowerCase()}.png`}
              alt={`${selectedCoin} logo`}
              className="absolute top-3 right-4 w-10 h-10 opacity-70"
            />
            <div className="p-4" style={{ height: "350px" }}>
              {" "}
              {/* <-- Set a specific inner height */}
              <PriceGraph priceHistory={chartData} coin={selectedCoin} />
            </div>
          </div>

          {/* 💰 Current Price Display */}
          <motion.div
            className="flex flex-col items-center justify-center p-4 bg-gray-900/60 rounded-xl border border-cyan-600/50 shadow-[0_0_15px_rgba(52,211,255,0.4)]"
            animate={{ scale: [1.0, 1.01, 1.0], opacity: [1, 0.95, 1] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 5 }}
          >
            <span className="text-gray-400 text-xl uppercase">
              Live Valuation
            </span>
            <p
              className={`text-5xl font-extrabold tracking-wider ${
                prices[selectedCoin] > chartData[chartData.length - 2]
                  ? "text-green-400"
                  : "text-red-400"
              } price-flash`}
            >
              {selectedCoin}: ${prices[selectedCoin]?.toFixed(2) ?? "—"}
            </p>
          </motion.div>
        </div>

        {/* --- RIGHT COLUMN: Controls & Predictions --- */}
        <div className="lg:w-1/3 space-y-6">
          {/* ⏱️ Timeframe Control Panel */}
          <motion.div
            className="p-4 bg-gray-900/70 rounded-xl border-2 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.5)]"
            variants={itemInViewVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
          >
            <span className="text-lg text-purple-400 font-bold mb-2 block border-b border-purple-500/50 pb-1">
              TIMEFRAME SELECTION
            </span>
            <div className="flex flex-wrap gap-2">
              {timeframes.map((tf) => (
                <motion.button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-3 py-1 text-sm rounded transition-all duration-200 uppercase font-semibold
                        ${
                          selectedTimeframe === tf
                            ? "bg-purple-500 text-white shadow-lg shadow-purple-500/50"
                            : "bg-gray-800 text-purple-300 hover:bg-purple-800"
                        }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {tf}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* 🔮 Trend Prediction Panel */}
          <motion.div
            className="p-4 bg-gray-900/70 rounded-xl border-2 border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.5)] min-h-[150px]"
            variants={itemInViewVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
          >
            <span className="text-lg text-pink-400 font-bold mb-3 block border-b border-pink-500/50 pb-1">
              AI TREND ANALYSIS
            </span>
            <TrendPrediction coin={selectedCoin} />
          </motion.div>

          {/* 🌌 Three.js/3D Placeholder Panel */}
          <motion.div
            className="p-4 bg-gray-900/70 rounded-xl border-2 border-lime-500/50 shadow-[0_0_20px_rgba(132,204,22,0.5)] min-h-[200px] flex flex-col items-center justify-center relative overflow-hidden"
            variants={itemInViewVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
          >
            <span className="text-lg text-lime-400 font-bold mb-2 block border-b border-lime-500/50 pb-1 w-full text-center">
              HOLOGRAPHIC PROJECTION
            </span>
            <div className="w-full h-full absolute top-0 left-0 flex items-center justify-center text-gray-600 text-sm italic">
              <div className="w-24 h-24 bg-lime-900/50 rounded-full border-4 border-lime-400/80 animate-spin-slow flex items-center justify-center text-lime-400 text-xl font-bold">
                3D
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
