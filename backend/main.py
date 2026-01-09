from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from analyzer import identify_pitch
from chords import identify_chord, get_chord_notes, NOTES, CHORD_DEFINITIONS
from llm import ask_llm, Message

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for dev convenience/docker networking
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NotesRequest(BaseModel):
    notes: List[str]  # Expects notes ordered by pitch (lowest first) ideally

class ChordResponse(BaseModel):
    found: bool
    primary: Optional[dict] = None
    alternatives: Optional[List[dict]] = None
    message: Optional[str] = None

class NamedChordRequest(BaseModel):
    chord_name: str

class Ask(BaseModel):
    messages: list[Message]

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/identify", response_model=ChordResponse)
async def identify(request: NotesRequest):
    result = identify_chord(request.notes)
    return result

@app.get("/api/chords")
async def get_available_chords():
    """Returns list of all possible chord names for the picker."""
    chord_names = []
    for root in NOTES:
        for type_name in CHORD_DEFINITIONS.keys():
            chord_names.append(f"{root} {type_name}")
    return {"chords": chord_names}

@app.get("/api/chord/{chord_name}")
async def get_chord_composition(chord_name: str):
    notes = get_chord_notes(chord_name)
    if not notes:
        raise HTTPException(status_code=404, detail="Chord not found")
    return {"notes": notes}

@app.get("/api/tuner/analyze")
async def analyze_pitch(hz: float):
    result = identify_pitch(hz)
    if not result:
         return {"note": None}
    return result

@app.post("/api/llm/ask")
async def ask(request: Ask) -> Ask:
    results = ask_llm(request.messages)
    return Ask(messages=results)

# Serve static files (Frontend)
use_static = os.path.isdir("backend/static") or os.path.isdir("static")
static_dir = "backend/static" if os.path.isdir("backend/static") else "static"

if use_static:
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
