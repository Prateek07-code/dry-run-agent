import uuid

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .orchestrator import run_stream

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

RUNS: dict[str, dict] = {}


class RunRequest(BaseModel):
    task: str
    mode: str = "dry-run"


@app.post("/run")
def create_run(req: RunRequest):
    run_id = uuid.uuid4().hex[:8]
    RUNS[run_id] = {"task": req.task, "mode": req.mode}
    return {"run_id": run_id}


@app.get("/run/{run_id}/stream")
async def stream(run_id: str):
    run = RUNS.get(run_id)
    if not run:
        raise HTTPException(404, "unknown run_id")
    return StreamingResponse(
        run_stream(run["task"], run["mode"]),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )