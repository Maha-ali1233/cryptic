const COINS = ["BTC", "ETH", "DOT", "ENA"];

function toFloat(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function std(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance =
    values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function calculateRsi(prices, period = 14) {
  if (prices.length < period + 1) return 50;

  const deltas = prices.slice(1).map((price, i) => price - prices[i]);
  const gains = deltas.map((d) => (d > 0 ? d : 0));
  const losses = deltas.map((d) => (d < 0 ? -d : 0));
  const avgGains = mean(gains.slice(-period));
  const avgLosses = mean(losses.slice(-period));

  if (avgLosses === 0) return avgGains > 0 ? 100 : 50;
  const rs = avgGains / avgLosses;
  return 100 - 100 / (1 + rs);
}

function calculateMacd(prices) {
  if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 };

  const ema12 = mean(prices.slice(-12));
  const ema26 = mean(prices.slice(-26));
  const macd = ema12 - ema26;
  const signal = mean(prices.slice(-9));
  return { macd, signal, histogram: macd - signal };
}

function calculateBollingerBands(prices, period = 20) {
  if (prices.length < period) {
    const last = prices.at(-1) ?? 0;
    return { upper: last, middle: last, lower: last, width: 0 };
  }

  const window = prices.slice(-period);
  const middle = mean(window);
  const deviation = std(window);
  const upper = middle + deviation * 2;
  const lower = middle - deviation * 2;
  const width = middle !== 0 ? ((upper - lower) / middle) * 100 : 0;
  return { upper, middle, lower, width };
}

function marketRegimeDetection(prices) {
  if (prices.length < 20) return "unknown";

  const window = prices.slice(-20);
  const returns = window.slice(1).map((price, i) => Math.log(price / window[i]));
  const volatility = std(returns) * Math.sqrt(365);
  const upMoves = returns.filter((r) => r > 0);
  const downMoves = returns.filter((r) => r < 0).map((r) => -r);
  const trendStrength = Math.abs(mean(upMoves) - mean(downMoves));

  if (volatility > 0.8) return "high_volatility";
  if (trendStrength > 0.02) return "trending";
  return "ranging";
}

function applyCryptoAdjustments(confidence, prices) {
  if (prices.length < 20) return confidence * 0.3;

  const window = prices.slice(-50);
  const returns = window.slice(1).map((price, i) => Math.log(price / window[i]));
  const volatility = std(returns) * Math.sqrt(365);

  if (volatility > 1.2) confidence *= 0.5;
  else if (volatility > 0.8) confidence *= 0.7;
  else if (volatility > 0.4) confidence *= 0.85;

  if (prices.length >= 10) {
    const recent = prices.slice(-10);
    const recentReturns = recent.slice(1).map((price, i) => Math.log(price / recent[i]));
    const maxGain = Math.max(...recentReturns, 0);
    const maxLoss = Math.min(...recentReturns, 0);
    if (maxGain > 0.15 || maxLoss < -0.15) confidence *= 0.4;
  }

  return Math.max(0.05, Math.min(confidence, 0.85));
}

function ensemblePrediction(prices) {
  if (prices.length < 30) {
    return { trend: "neutral", explanation: "Insufficient crypto data", confidence: 0.15 };
  }

  const currentPrice = prices.at(-1);
  const rsi = calculateRsi(prices);
  const { macd, signal, histogram } = calculateMacd(prices);
  const { upper, lower, width } = calculateBollingerBands(prices);
  const regime = marketRegimeDetection(prices);

  let score = 0;
  const explanations = [];

  if (rsi > 75) {
    score -= 0.25;
    explanations.push(`RSI overbought (${rsi.toFixed(1)})`);
  } else if (rsi < 25) {
    score += 0.25;
    explanations.push(`RSI oversold (${rsi.toFixed(1)})`);
  } else {
    score += (50 - rsi) / 200;
  }

  if (macd > signal && histogram > 0) {
    score += 0.3;
    explanations.push("MACD bullish momentum");
  } else if (macd < signal && histogram < 0) {
    score -= 0.3;
    explanations.push("MACD bearish momentum");
  }

  const bandRange = upper - lower;
  const bbPosition = bandRange > 0 ? (currentPrice - lower) / bandRange : 0.5;
  if (bbPosition < 0.2) {
    score += 0.2;
    explanations.push("Near lower Bollinger Band");
  } else if (bbPosition > 0.8) {
    score -= 0.2;
    explanations.push("Near upper Bollinger Band");
  }

  if (regime === "trending") {
    score += 0.1;
    explanations.push("Strong trending market");
  } else if (regime === "high_volatility") {
    score -= 0.1;
    explanations.push("High volatility - cautious");
  }

  let confidence =
    Math.min(Math.abs(rsi - 50) / 50 * 0.25, 0.25) +
    Math.min((Math.abs(histogram) / currentPrice) * 80 * 0.3, 0.3) +
    Math.min(width / 15 * 0.2, 0.2);

  if (regime === "trending") confidence += 0.1;
  else if (regime === "high_volatility") confidence -= 0.05;

  confidence = applyCryptoAdjustments(confidence, prices);

  let trend = "neutral";
  if (confidence < 0.25) {
    trend = "neutral";
    explanations.push("Low confidence in volatile crypto market");
  } else if (score > 0.2) trend = "bullish";
  else if (score < -0.2) trend = "bearish";

  const confidenceLevel =
    confidence > 0.6 ? "High" : confidence > 0.3 ? "Medium" : "Low";
  explanations.push(`${confidenceLevel} confidence (${(confidence * 100).toFixed(1)}%)`);

  if (prices.length > 24) {
    const lookback = prices.at(-24);
    const change24h = ((currentPrice - lookback) / lookback) * 100;
    explanations.push(`24h change: ${change24h >= 0 ? "+" : ""}${change24h.toFixed(2)}%`);
  }

  return {
    trend,
    explanation: explanations.join("; "),
    confidence,
  };
}

export function predictTrend(priceHistory, coin = "BTC") {
  const cleanPrices = priceHistory.map(toFloat).filter((p) => p !== null);

  if (cleanPrices.length < 15) {
    return {
      coin,
      trend: "neutral",
      explanation: "Collecting market data for analysis...",
      confidence: 0.15,
      timestamp: new Date().toISOString(),
    };
  }

  const result = ensemblePrediction(cleanPrices);
  return {
    coin,
    ...result,
    timestamp: new Date().toISOString(),
  };
}

export { COINS };
