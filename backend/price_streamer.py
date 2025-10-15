# price_streamer.py
import asyncio
import json
from typing import Dict, Any
import httpx  # pip install httpx

connected_clients = set()

SYMBOLS = ["BTCUSDT", "ETHUSDT", "DOTUSDT", "ENAUSDT"]

# Shared price history: keep last 60 points per coin
price_history: Dict[str, list[float]] = {s.replace("USDT", ""): [] for s in SYMBOLS}

async def fetch_prices() -> Dict[str, Any]:
    """Fetch live prices for BTC, ETH, DOT, and ENA from Binance API."""
    url = "https://api.binance.com/api/v3/ticker/price"
    prices = {}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            for symbol in SYMBOLS:
                resp = await client.get(url, params={"symbol": symbol})
                resp.raise_for_status()
                data = resp.json()
                # Ensure price is converted to float
                price_value = float(data["price"])
                prices[symbol.replace("USDT", "")] = price_value
        return prices
    except Exception as e:
        print(f"⚠️ Binance fetch error: {e}")
        return {s.replace("USDT", ""): None for s in SYMBOLS}

async def broadcast_prices():
    """Broadcast live Binance prices to all connected WebSocket clients."""
    try:
        while True:
            prices = await fetch_prices()
            if prices:
                # update price history - ensure all values are floats
                for coin, price in prices.items():
                    if price is not None:
                        hist = price_history[coin]
                        hist.append(float(price))  # Explicitly convert to float
                        if len(hist) > 60:
                            hist.pop(0)

                message = json.dumps(prices)
                # send to all clients
                for client in list(connected_clients):
                    try:
                        await client.send_text(message)
                    except Exception as e:
                        print("Removing dead client:", e)
                        connected_clients.discard(client)

            await asyncio.sleep(1)  # every second
    except asyncio.CancelledError:
        print("🛑 broadcast_prices task cancelled, exiting cleanly")
        raise
    except Exception as e:
        print("Unexpected error in broadcast_prices:", e)
        raise