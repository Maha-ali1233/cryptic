import { useEffect, useRef, useState } from "react";
import { COINS, predictTrend } from "../lib/trendPredictor";

const SYMBOLS = COINS.map((coin) => `${coin.toLowerCase()}usdt@ticker`);
const BINANCE_STREAM_URL = `wss://stream.binance.com:9443/stream?streams=${SYMBOLS.join("/")}`;
const TIMEFRAMES = ["2s", "1m", "15m", "1h"];

function intervalMs(tf) {
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
}

function createEmptyHistory() {
  return COINS.reduce((acc, coin) => {
    acc[coin] = TIMEFRAMES.reduce((tfAcc, tf) => {
      tfAcc[tf] = [];
      return tfAcc;
    }, {});
    return acc;
  }, {});
}

function createEmptyPrices() {
  return COINS.reduce((acc, coin) => {
    acc[coin] = null;
    return acc;
  }, {});
}

function createEmptyPredictions() {
  return COINS.reduce((acc, coin) => {
    acc[coin] = null;
    return acc;
  }, {});
}

export function useCryptoStream(selectedCoin, selectedTimeframe) {
  const [prices, setPrices] = useState(createEmptyPrices);
  const [chartData, setChartData] = useState([]);
  const [predictions, setPredictions] = useState(createEmptyPredictions);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  const historyRef = useRef(createEmptyHistory());
  const lastUpdateRef = useRef({});
  const reconnectTimerRef = useRef(null);
  const selectionRef = useRef({ selectedCoin, selectedTimeframe });

  useEffect(() => {
    selectionRef.current = { selectedCoin, selectedTimeframe };
    setChartData([...historyRef.current[selectedCoin][selectedTimeframe]]);
  }, [selectedCoin, selectedTimeframe]);

  useEffect(() => {
    let ws;
    let trendInterval;
    let closedByUser = false;

    const connect = () => {
      ws = new WebSocket(BINANCE_STREAM_URL);

      ws.onopen = () => {
        setConnectionStatus("connected");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const ticker = payload?.data;
          if (!ticker?.s || !ticker?.c) return;

          const coin = ticker.s.replace("USDT", "");
          const price = parseFloat(ticker.c);
          if (!COINS.includes(coin) || Number.isNaN(price)) return;

          setPrices((prev) => ({ ...prev, [coin]: price }));

          const now = Date.now();
          TIMEFRAMES.forEach((tf) => {
            const key = `${coin}_${tf}`;
            const last = lastUpdateRef.current[key] || 0;
            if (now - last >= intervalMs(tf)) {
              const arr = historyRef.current[coin][tf];
              arr.push(price);
              if (arr.length > 60) arr.shift();
              lastUpdateRef.current[key] = now;
            }
          });

          const { selectedCoin: activeCoin, selectedTimeframe: activeTf } =
            selectionRef.current;
          setChartData([...historyRef.current[activeCoin][activeTf]]);
        } catch (error) {
          console.error("Stream parse error:", error);
        }
      };

      ws.onerror = () => setConnectionStatus("error");

      ws.onclose = () => {
        if (closedByUser) return;
        setConnectionStatus("reconnecting");
        reconnectTimerRef.current = window.setTimeout(connect, 3000);
      };
    };

    connect();

    trendInterval = window.setInterval(() => {
      setPredictions((prev) => {
        const next = { ...prev };
        COINS.forEach((coin) => {
          const history = historyRef.current[coin]["2s"];
          next[coin] = predictTrend(history, coin);
        });
        return next;
      });
    }, 5000);

    return () => {
      closedByUser = true;
      window.clearInterval(trendInterval);
      window.clearTimeout(reconnectTimerRef.current);
      ws?.close();
    };
  }, []);

  return {
    prices,
    chartData,
    prediction: predictions[selectedCoin],
    connectionStatus,
  };
}
