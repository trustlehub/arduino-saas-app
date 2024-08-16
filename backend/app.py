from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.responses import FileResponse
import subprocess
import os
import uuid
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

class ArduinoCode(BaseModel):
    code: str
    board: str

@app.post("/compile")
async def compile_code(arduino_code: ArduinoCode):
    # Create a temporary directory to save the code
    # temp_dir = f"/tmp/arduino_{uuid.uuid4()}"
    filename = f"arduino_{uuid.uuid4()}"
    temp_dir = f"/tmp/{filename}"
    os.makedirs(temp_dir, exist_ok=True)

    # Create the .ino file
    ino_path = os.path.join(temp_dir, f"{filename}.ino")
    with open(ino_path, "w") as f:
        f.write(arduino_code.code)

    # Compile the code using Arduino CLI
    try:
        result = subprocess.run(
            ["arduino-cli", "compile", "--fqbn", arduino_code.board, "--output-dir", temp_dir, temp_dir],
            capture_output=True,
            text=True,
            check=True
        )
    except subprocess.CalledProcessError as e:
        # If compilation fails, return the error message
        raise HTTPException(status_code=400, detail=e.stderr)

    # Find the .hex file in the output directory
    hex_file = None
    for file in os.listdir(temp_dir):
        if file.endswith(".hex"):
            hex_file = os.path.join(temp_dir, file)
            break

    if not hex_file:
        raise HTTPException(status_code=500, detail="HEX file not found after compilation")

    # Return the .hex file as a downloadable file
    return FileResponse(hex_file, filename="compiled.ino.hex")
