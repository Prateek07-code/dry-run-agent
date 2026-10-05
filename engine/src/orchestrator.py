import asyncio
import re

from .errors import EngineError, VALID_STAGES
from .events import sse, error_event

GAP_MS = 1200


def _gap():
    return asyncio.sleep(GAP_MS / 1000)


def parse_simulated_stage(task: str) -> str | None:
    m = re.search(r"simulate:error:(\w+)", task)
    if m and m.group(1) in VALID_STAGES:
        return m.group(1)
    return None


async def run_naive(task: str):
    yield sse("executing", {"message": "Running DROP TABLE directly on production..."})
    await _gap()
    yield sse("error", {
        "message": "nightly_report_job crashed: dependency missing",
        "rows_lost": 1200,
    })


async def run_dry(task: str, simulated: str | None):
    def check(stage: str):
        if simulated == stage:
            raise EngineError(stage)

    # Hardcoded for now; Chunks 3-6 replace these pieces one by one.
    check("fork")
    yield sse("fork_started", {"message": "Forking a copy of the database..."})
    await _gap()

    check("connection")
    check("plan_generation")
    check("timeout")
    plans = [
        {"plan_id": "A", "label": "Hard delete"},
        {"plan_id": "B", "label": "Archive, then delete in 30 days"},
    ]
    yield sse("plans_generated", {"plans": plans})
    await _gap()

    yield sse("plan_testing", {"plan_id": "A"})
    await _gap()
    check("scoring")
    yield sse("plan_result", {"plan_id": "A", "status": "failed",
                              "reason": "Deleting all rows breaks nightly_report_job."})
    await _gap()

    yield sse("plan_testing", {"plan_id": "B"})
    await _gap()
    yield sse("plan_result", {"plan_id": "B", "status": "passed",
                              "reason": "No dependencies broken and no data lost."})
    await _gap()

    yield sse("committing", {"plan_id": "B", "message": "Applying the winning plan..."})
    await _gap()
    check("commit")
    yield sse("committed", {"plan_id": "B", "message": "Done. old_sessions archived safely."})


async def run_stream(task: str, mode: str):
    simulated = parse_simulated_stage(task)
    try:
        if mode == "naive":
            async for chunk in run_naive(task):
                yield chunk
        else:
            async for chunk in run_dry(task, simulated):
                yield chunk
    except EngineError as e:
        yield error_event(e)
    except Exception as e:
        print("UNEXPECTED ERROR:", repr(e))  # log the real error server-side only
        yield error_event(EngineError("fork", "Something went wrong on our side.", recoverable=False))