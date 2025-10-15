# main.py
from fastapi import FastAPI, WebSocket
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from price_streamer import connected_clients, broadcast_prices, price_history
from trend_predictor_ai import predict_trend
from datetime import datetime
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def start_background_tasks():
    app.state.price_task = asyncio.create_task(broadcast_prices())
    app.state.trend_task = asyncio.create_task(broadcast_trends())

@app.on_event("shutdown")
async def shutdown_background_tasks():
    for task_name in ["price_task", "trend_task"]:
        task = getattr(app.state, task_name, None)
        if task:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🔌 Client connected")
    connected_clients.add(websocket)
    try:
        while True:
            await asyncio.sleep(1)
    except Exception as e:
        print("Websocket handler error:", e)
    finally:
        try:
            connected_clients.remove(websocket)
        except KeyError:
            pass
        print("❌ Client disconnected")


# Broadcast trends based on shared price_history
# main.py (updated broadcast_trends function)
async def broadcast_trends():
    while True:
        await asyncio.sleep(5)  # every 5s
        try:
            for coin, history in price_history.items():
                if len(history) < 15:  # Increased minimum data requirement
                    continue
                
                trend, explanation, confidence = predict_trend(history, coin)
                
                # Ensure confidence is a float between 0-1
                confidence_float = float(confidence) if confidence is not None else 0.0
                confidence_float = max(0.0, min(confidence_float, 1.0))
                
                message = json.dumps({
                    "coin": coin,
                    "trend": trend,
                    "explanation": explanation,
                    "confidence": confidence_float,  # Send as float, not percentage
                    "timestamp": datetime.now().isoformat()
                })
                
                # Send trend to all clients
                for client in list(connected_clients):
                    try:
                        await client.send_text(message)
                    except Exception as e:
                        print("Removing dead client:", e)
                        connected_clients.discard(client)
        except Exception as e:
            print("Trend broadcast error:", e)
