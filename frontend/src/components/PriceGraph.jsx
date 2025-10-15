import React, { useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler
);

export default function PriceGraph({ priceHistory, coin }) {
  const chartRef = useRef();

  const colors = {
    BTC: "#F7931A",
    ETH: "#627EEA",
    DOT: "#E6007A",
    ENA: "#00FFAB",
  };
  const lineColor = colors[coin] || "#00FFFF";

  const gridColor = `${lineColor}30`;
  const labels = priceHistory.map((_, idx) => idx + 1);

  const data = {
    labels,
    datasets: [
      {
        label: coin,
        data: priceHistory,
        fill: true,
        borderColor: lineColor,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 8,
        pointBackgroundColor: lineColor,
        pointHoverBackgroundColor: "#FFFFFF",
        borderWidth: 3,

        backgroundColor: function (context) {
          const chart = context.chart;
          const ctx = chart?.ctx;
          if (!ctx) return lineColor;
          const gradient = ctx.createLinearGradient(0, 0, 0, chart.height);
          gradient.addColorStop(0, `${lineColor}80`);
          gradient.addColorStop(0.5, `${lineColor}30`);
          gradient.addColorStop(1, `${lineColor}00`);
          return gradient;
        },
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "#1c1c1c99",
        titleColor: lineColor,
        bodyColor: "#E0E0E0",
        xPadding: 15,
        yPadding: 10,
        cornerRadius: 6,
        borderWidth: 1,
        borderColor: lineColor,
        displayColors: false,
        callbacks: {
          title: (tooltipItems) => {
            return `${coin} Data Point ${tooltipItems[0].label}`;
          },
          label: (context) => {
            return `Price: $${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    interaction: { intersect: false, mode: "nearest" },
    scales: {
      x: {
        ticks: { color: "#888", font: { family: "monospace" } },
        grid: { color: gridColor, drawBorder: false, lineWidth: 1 },
      },
      y: {
        ticks: { color: "#AAA", font: { family: "monospace" } },
        grid: { color: gridColor, drawBorder: false, lineWidth: 1 },
      },
    },

    // 🛑 THE CRITICAL FIX: Use specific animation modes 🛑
    animation: {
      // 1. Initial Load Animation (First render only)
      // This is the cool, dramatic entry animation you might want to keep.
      // It makes the data appear from the bottom (zero).
      onProgress: (animation) => {
        // Optional: Can use this to remove the animation object after the first render
        // to prevent it from running again, but setting the update duration to 0
        // below is more robust.
      },

      // 2. Update Animation (What runs on every WebSocket update)
      // We set the duration of the 'update' phase to 0 to make it instantaneous.
      // 'x' property is still animated (duration > 0) to allow the smooth left-shift.
      // 'y' property is set to 0 duration to prevent the zero-to-price jump.

      // Define the update animation duration for different properties
      // Note: This relies on using Chart.js v3.x or later where these options are available.

      // Default duration for properties that aren't explicitly listed below
      duration: 0,

      // Explicitly define a duration for the 'x' shift if you want a smooth sliding effect
      // If you want it instantaneous, change this to 0 as well.
      // Here, we keep a fast slide effect (200ms) only on the position (x)
      x: { duration: 200, easing: "linear" },

      // Setting 'y' duration to 0 ensures no vertical animation on update
      y: { duration: 0 },
    },
  };

  // Neon glow and pulse effect for the last point (Current Price)
  // (This logic remains fine)
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // Custom Plugin to draw the glowing point
    chart.options.plugins.customGlow = {
      id: "customGlow",
      afterDatasetsDraw(chart, args, options) {
        const { ctx } = chart;
        const meta = chart.getDatasetMeta(0);
        const lastIndex = meta.data.length - 1;

        if (lastIndex < 0) return;

        const point = meta.data[lastIndex];
        if (!point) return;

        const currentRadius = point.options.radius;

        // 1. Draw the primary glow
        ctx.save();
        ctx.shadowColor = lineColor;
        ctx.shadowBlur = 30;
        ctx.fillStyle = lineColor;
        ctx.beginPath();
        ctx.arc(point.x, point.y, currentRadius + 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();

        // 2. Draw the core white/bright point for a pulse effect
        ctx.save();
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(point.x, point.y, currentRadius / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      },
    };

    chart.update();
  }, [priceHistory, coin, lineColor]);

  return (
    <div className="w-full h-full min-h-[300px] transition-opacity duration-700 opacity-100">
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
}
