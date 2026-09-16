"""
Varanasi Yatra AI Gateway & Service Entrypoint
Prompt 5 — Secure AI Foundation

IMPORTANT SECURITY INVARIANTS:
1. No direct MongoDB connection or database drivers exist in this service.
2. CRM data is accessed solely through authenticated Node CRM internal endpoints.
3. Service-to-service authentication is enforced on all mutation and execution endpoints.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes.ai_routes import router as ai_router

app = FastAPI(
    title="Varanasi Yatra AI Gateway",
    description="Secure, isolated AI Gateway & Tool Layer for Varanasi Yatra CRM",
    version="1.0.0"
)

# CORS restricted to internal loopback / trusted origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5001", "http://127.0.0.1:5001"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(ai_router)

@app.get("/")
async def root():
    return {
        "service": "Varanasi Yatra AI Gateway",
        "status": "ONLINE",
        "phase": "Prompt 5 — AI Foundation & CEO Control Center",
        "safe_mode": True,
        "hunter_modules": "INACTIVE"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)
