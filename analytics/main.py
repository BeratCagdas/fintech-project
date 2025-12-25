# analytics/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import snapshot, anomaly, forecast

app = FastAPI(title="Fintech Analytics API")

# CORS - Production ve Development URL'leri
allowed_origins = [
    "http://localhost:5173",  # Local frontend
    "http://localhost:5000",   # Local backend
    "https://fintech-frontend-8nux.onrender.com",  # Production frontend
    "https://fintech-dashboard-xm3z.onrender.com",  # Production backend
]

# Ek origin'ler environment variable'dan eklenebilir
extra_origins = os.getenv("EXTRA_ORIGINS", "")
if extra_origins:
    allowed_origins.extend(extra_origins.split(","))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(snapshot.router)
app.include_router(anomaly.router)
app.include_router(forecast.router)

@app.get("/")
async def root():
    return {
        "service": "Fintech Analytics API",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "snapshots": "/api/snapshots/*",
            "anomalies": "/api/anomalies/*",
            "forecast": "/api/forecast/*"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)