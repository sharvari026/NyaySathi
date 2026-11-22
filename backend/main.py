"""
Nyay Saathi — FastAPI Backend
Entry point. Run with: uvicorn main:app --reload --port 8000
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.extract import router as extract_router
from routes.check import router as check_router
from routes.draft import router as draft_router
from routes.export import router as export_router
from routes.cases import router as cases_router

app = FastAPI(
    title="Nyay Saathi API",
    description="AI-powered legal assistant backend for Indian advocates.",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS — allow all origins for hackathon demo
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
API_PREFIX = "/api"

app.include_router(extract_router, prefix=API_PREFIX, tags=["Extract"])
app.include_router(check_router, prefix=API_PREFIX, tags=["Check"])
app.include_router(draft_router, prefix=API_PREFIX, tags=["Draft"])
app.include_router(export_router, prefix=API_PREFIX, tags=["Export"])
app.include_router(cases_router, prefix=API_PREFIX, tags=["Cases"])


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"])
async def health() -> dict:
    return {"status": "ok", "service": "Nyay Saathi API"}


# ---------------------------------------------------------------------------
# Dev entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
