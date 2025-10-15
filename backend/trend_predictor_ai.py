import numpy as np
from collections import deque
import warnings
warnings.filterwarnings('ignore')

class AdvancedTrendPredictor:
    def __init__(self):
        self.price_memory = {coin: deque(maxlen=100) for coin in ["BTC", "ETH", "DOT", "ENA"]}
        self.trend_memory = {coin: deque(maxlen=20) for coin in ["BTC", "ETH", "DOT", "ENA"]}
        self.confidence_history = {coin: deque(maxlen=20) for coin in ["BTC", "ETH", "DOT", "ENA"]}
        
    def calculate_rsi(self, prices, period=14):
        if len(prices) < period + 1:
            return 50  # Neutral RSI
        
        # Ensure all prices are floats
        price_array = np.array([float(p) for p in prices])
        deltas = np.diff(price_array)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        avg_gains = np.mean(gains[-period:])
        avg_losses = np.mean(losses[-period:])
        if avg_losses == 0:
            return 100 if avg_gains > 0 else 50
        rs = avg_gains / avg_losses
        rsi = 100 - (100 / (1 + rs))
        return rsi

    def calculate_macd(self, prices):
        if len(prices) < 26:
            return 0, 0, 0
        
        # Ensure all prices are floats
        price_array = np.array([float(p) for p in prices])
        ema_12 = np.mean(price_array[-12:])
        ema_26 = np.mean(price_array[-26:])
        macd_line = ema_12 - ema_26
        signal_line = np.mean(price_array[-9:])
        histogram = macd_line - signal_line
        return float(macd_line), float(signal_line), float(histogram)

    def calculate_bollinger_bands(self, prices, period=20):
        if len(prices) < period:
            last_price = float(prices[-1]) if len(prices) > 0 else 0.0
            return last_price, last_price, last_price, 0.0
        
        # Ensure all prices are floats
        price_array = np.array([float(p) for p in prices[-period:]])
        sma = float(np.mean(price_array))
        std = float(np.std(price_array))
        upper_band = sma + (std * 2)
        lower_band = sma - (std * 2)
        bandwidth = ((upper_band - lower_band) / sma * 100) if sma != 0 else 0.0
        return float(upper_band), float(sma), float(lower_band), float(bandwidth)

    def calculate_support_resistance(self, prices, window=10):
        if len(prices) < window * 2:
            current_price = float(prices[-1]) if len(prices) > 0 else 0.0
            return current_price, current_price
        
        # Ensure all prices are floats
        price_window = [float(p) for p in prices[-window:]]
        support = min(price_window)
        resistance = max(price_window)
        return float(support), float(resistance)

    def calculate_volume_profile(self, prices, window=20):
        if len(prices) < window:
            return 0.5
        
        # Ensure all prices are floats
        price_array = np.array([float(p) for p in prices[-window:]])
        volatility = np.std(price_array) / np.mean(price_array) * 100
        volume_score = min(volatility / 5.0, 1.0)
        return float(volume_score)

    def market_regime_detection(self, prices):
        if len(prices) < 20:
            return "unknown"
        
        # Ensure all prices are floats
        price_array = np.array([float(p) for p in prices[-20:]])
        returns = np.diff(np.log(price_array))
        volatility = np.std(returns) * np.sqrt(365)
        up_moves = np.where(returns > 0, returns, 0)
        down_moves = np.where(returns < 0, -returns, 0)
        trend_strength = abs(np.mean(up_moves) - np.mean(down_moves))
        
        if volatility > 0.8:
            return "high_volatility"
        elif trend_strength > 0.02:
            return "trending"
        else:
            return "ranging"

    def machine_learning_features(self, prices):
        if len(prices) < 30:
            return np.zeros(10)
        
        # Ensure all prices are floats
        price_array = np.array([float(p) for p in prices])
        
        features = []
        features.append(float((price_array[-1] - price_array[-5]) / price_array[-5]))
        features.append(float((price_array[-1] - price_array[-10]) / price_array[-10]))
        features.append(float(np.std(price_array[-10:]) / np.mean(price_array[-10:])))
        features.append(float(np.std(price_array[-20:]) / np.mean(price_array[-20:])))
        mean_10 = np.mean(price_array[-10:])
        features.append(float((price_array[-1] - mean_10) / mean_10))
        
        rsi = self.calculate_rsi(price_array)
        features.append(float((rsi - 50) / 50))
        
        macd, signal, hist = self.calculate_macd(price_array)
        features.append(float(macd / price_array[-1] if price_array[-1] != 0 else 0))
        features.append(float(hist / price_array[-1] if price_array[-1] != 0 else 0))
        
        short_trend = (price_array[-1] - price_array[-5]) / 5
        long_trend = (price_array[-1] - price_array[-15]) / 15
        features.append(float(short_trend / price_array[-1] if price_array[-1] != 0 else 0))
        features.append(float(long_trend / price_array[-1] if price_array[-1] != 0 else 0))
        
        return np.array(features)

    def detect_crypto_pump_dump(self, confidence, prices):
        """Detect pump/dump patterns and reduce confidence"""
        if len(prices) < 10:
            return confidence
        
        price_array = np.array([float(p) for p in prices[-10:]])
        
        # Sudden price spikes/drops (common in crypto manipulation)
        recent_returns = np.diff(np.log(price_array))
        max_gain = np.max(recent_returns)
        max_loss = np.min(recent_returns)
        
        # If extreme moves detected, reduce confidence significantly
        if max_gain > 0.15 or max_loss < -0.15:  # 15%+ moves in short period
            confidence *= 0.4
            print(f"⚠️ Pump/dump pattern detected - confidence reduced")
        
        return confidence

    def adapt_to_crypto_regime(self, confidence, prices, coin):
        """Adapt confidence based on crypto market regime"""
        if len(prices) < 30:
            return confidence
        
        price_array = np.array([float(p) for p in prices[-30:]])
        
        # Crypto market regimes
        total_return = (price_array[-1] - price_array[0]) / price_array[0]
        volatility = np.std(np.diff(np.log(price_array))) * np.sqrt(365)
        
        # Bull market - slightly higher confidence but capped
        if total_return > 0.2 and volatility < 0.8:  # Strong uptrend, moderate vol
            confidence = min(confidence * 1.1, 0.8)
        
        # Bear market - reduce confidence
        elif total_return < -0.2:
            confidence *= 0.7
        
        # Sideways with high volatility (common in crypto) - significantly reduce confidence
        elif abs(total_return) < 0.1 and volatility > 0.9:
            confidence *= 0.6
        
        return confidence

    def apply_crypto_specific_uncertainty(self, confidence, prices, coin):
        """Crypto-specific confidence adjustments"""
        if len(prices) < 20:
            return confidence * 0.3  # Much lower confidence for insufficient data
        
        price_array = np.array([float(p) for p in prices[-50:]])  # Use more data for crypto
        
        # Crypto-specific volatility calculation (crypto is naturally more volatile)
        returns = np.diff(np.log(price_array))
        volatility = np.std(returns) * np.sqrt(365)  # Annualized volatility
        
        # Crypto volatility thresholds (higher than traditional markets)
        if volatility > 1.2:  # Extreme volatility (common in crypto)
            confidence *= 0.5
        elif volatility > 0.8:  # High volatility
            confidence *= 0.7
        elif volatility > 0.4:  # Moderate volatility
            confidence *= 0.85
        
        # Detect crypto-specific patterns
        confidence = self.detect_crypto_pump_dump(confidence, prices)
        confidence = self.adapt_to_crypto_regime(confidence, prices, coin)
        
        return max(0.05, min(confidence, 0.85))  # Crypto cap at 85%

    def crypto_confidence_safeguards(self, confidence, prices, coin):
        """Final safeguards for crypto confidence"""
        # Never exceed 85% for crypto
        confidence = min(confidence, 0.85)
        
        # Minimum confidence floor
        confidence = max(confidence, 0.05)
        
        # Recent large moves reduce confidence further
        if len(prices) >= 3:
            recent_move = abs((prices[-1] - prices[-3]) / prices[-3])
            if recent_move > 0.1:  # 10%+ move in 3 periods
                confidence *= 0.8
        
        # Track confidence history for Bayesian smoothing
        self.confidence_history[coin].append(confidence)
        
        # If we've been overconfident recently, reduce current confidence
        recent_confidences = list(self.confidence_history[coin])[-5:]
        if len(recent_confidences) >= 3:
            avg_confidence = np.mean(recent_confidences)
            if avg_confidence > 0.7:
                # We've been too confident, apply penalty
                confidence *= 0.9
        
        return confidence

    def crypto_ensemble_prediction(self, prices, coin):
        """Crypto-optimized prediction with realistic confidence"""
        if len(prices) < 30:
            return 0, 0.1, ["Insufficient data for crypto analysis"]
        
        try:
            # Convert all prices to float
            price_array = np.array([float(p) for p in prices])
            current_price = float(price_array[-1])
        except (ValueError, TypeError) as e:
            print(f"Price conversion error: {e}")
            return 0, 0.1, ["Invalid price data"]

        # Calculate indicators
        rsi = self.calculate_rsi(price_array)
        macd, signal, histogram = self.calculate_macd(price_array)
        upper_bb, middle_bb, lower_bb, bb_width = self.calculate_bollinger_bands(price_array)
        
        score = 0.0
        explanations = []
        
        # Crypto-optimized scoring (more sensitive to momentum)
        
        # RSI with crypto thresholds (crypto can be more overbought/sold)
        if rsi > 75:  # Higher threshold for crypto
            score -= 0.25
            explanations.append(f"RSI overbought ({rsi:.1f})")
        elif rsi < 25:  # Lower threshold for crypto
            score += 0.25
            explanations.append(f"RSI oversold ({rsi:.1f})")
        else:
            # Neutral RSI still contributes slightly
            score += (50 - rsi) / 200
        
        # MACD with momentum weighting
        if macd > signal and histogram > 0:
            score += 0.3  # Higher weight for momentum in crypto
            explanations.append("MACD bullish momentum")
        elif macd < signal and histogram < 0:
            score -= 0.3
            explanations.append("MACD bearish momentum")
        
        # Bollinger Bands for crypto volatility
        bb_position = (current_price - lower_bb) / (upper_bb - lower_bb) if (upper_bb - lower_bb) > 0 else 0.5
        if bb_position < 0.2:
            score += 0.2
            explanations.append("Near lower Bollinger Band")
        elif bb_position > 0.8:
            score -= 0.2
            explanations.append("Near upper Bollinger Band")
        
        # Support/Resistance Analysis
        support, resistance = self.calculate_support_resistance(price_array)
        price_to_support = (current_price - support) / current_price
        price_to_resistance = (resistance - current_price) / current_price
        
        if price_to_support < 0.02:
            score += 0.15
            explanations.append("Near strong support level")
        elif price_to_resistance < 0.02:
            score -= 0.15
            explanations.append("Near strong resistance level")
        
        # Market Regime
        market_regime = self.market_regime_detection(price_array)
        if market_regime == "trending":
            score += 0.1
            explanations.append("Strong trending market")
        elif market_regime == "high_volatility":
            score -= 0.1
            explanations.append("High volatility - cautious")
    
        # Calculate BASE confidence (before crypto adjustments)
        base_confidence = 0.0
        base_confidence += min(abs(rsi - 50) / 50 * 0.25, 0.25)  # Lower RSI weight
        base_confidence += min(abs(histogram) / current_price * 80 * 0.3, 0.3) if current_price != 0 else 0  # Higher MACD weight
        base_confidence += min(bb_width / 15 * 0.2, 0.2)  # Adjusted for crypto volatility
        
        # Market regime confidence
        if market_regime == "trending":
            base_confidence += 0.1
        elif market_regime == "high_volatility":
            base_confidence -= 0.05
        
        # ML Features Contribution (reduced weight for crypto)
        ml_features = self.machine_learning_features(price_array)
        if len(ml_features) >= 8:
            ml_trend = np.mean(ml_features[:4])
            score += ml_trend * 0.3  # Reduced weight for crypto
            base_confidence += min(abs(ml_trend) * 0.15, 0.15)
        
        # Apply crypto-specific uncertainty
        final_confidence = self.apply_crypto_specific_uncertainty(base_confidence, prices, coin)
        
        # Final safeguards
        final_confidence = self.crypto_confidence_safeguards(final_confidence, prices, coin)
        
        return score, final_confidence, explanations

    def predict_trend(self, price_history, coin="BTC"):
        # Filter and convert all prices to float
        clean_prices = []
        for p in price_history:
            try:
                clean_prices.append(float(p))
            except (ValueError, TypeError):
                continue

        if len(clean_prices) < 15:  # Higher minimum for crypto
            return "neutral", "Insufficient crypto data", 0.15

        # Store in memory
        self.price_memory[coin].extend(clean_prices)

        # Use crypto-optimized prediction
        score, confidence, explanations = self.crypto_ensemble_prediction(clean_prices, coin)

        # Apply trend memory bias (reduced weight for crypto)
        if len(self.trend_memory[coin]) > 0:
            recent_trends = list(self.trend_memory[coin])[-5:]
            trend_bias = np.mean(recent_trends)
            score += trend_bias * 0.1  # Reduced influence for crypto

        # Determine trend with crypto-appropriate thresholds
        if confidence < 0.25:  # Lower threshold for crypto
            trend = "neutral"
            explanations.append("Low confidence in volatile crypto market")
        elif score > 0.2:  # Higher threshold for crypto trends
            trend = "bullish"
            self.trend_memory[coin].append(0.1)
        elif score < -0.2:
            trend = "bearish"
            self.trend_memory[coin].append(-0.1)
        else:
            trend = "neutral"
            self.trend_memory[coin].append(0.0)

        # Format confidence for display
        confidence_level = "High" if confidence > 0.6 else "Medium" if confidence > 0.3 else "Low"
        explanations.append(f"{confidence_level} confidence ({confidence:.1%})")

        # Add 24h price change
        if len(clean_prices) > 24:
            price_change_24h = (clean_prices[-1] - clean_prices[-min(24, len(clean_prices))]) / clean_prices[-min(24, len(clean_prices))] * 100
            explanations.append(f"24h change: {price_change_24h:+.2f}%")
            
            # Crypto volatility context
            if abs(price_change_24h) > 15:
                explanations.append("High volatility - typical crypto movement")

        explanation = "; ".join(explanations)
        return trend, explanation, confidence

# Global instance
predictor = AdvancedTrendPredictor()

def predict_trend(price_history, coin="BTC"):
    """Wrapper with cleaning to avoid str vs float errors"""
    clean_prices = []
    for p in price_history:
        try:
            clean_prices.append(float(p))
        except (ValueError, TypeError):
            continue
    if len(clean_prices) < 10:
        return "neutral", "Insufficient valid data for prediction", 0.1
    return predictor.predict_trend(clean_prices, coin)