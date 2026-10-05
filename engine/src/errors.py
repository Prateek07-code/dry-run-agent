VALID_STAGES = ["fork", "plan_generation", "scoring", "commit", "connection", "timeout"]

SAFE_MESSAGES = {
    "fork": "Couldn't create the database fork.",
    "plan_generation": "Couldn't generate plans for this task.",
    "scoring": "Couldn't evaluate the plans.",
    "commit": "Couldn't apply the chosen plan.",
    "connection": "Lost connection to the database.",
    "timeout": "The AI took too long to respond.",
}


class EngineError(Exception):
    def __init__(self, stage: str, message: str | None = None, recoverable: bool = True):
        self.stage = stage
        self.message = message or SAFE_MESSAGES.get(stage, "Something went wrong.")
        self.recoverable = recoverable
        super().__init__(self.message)