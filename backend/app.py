import json
import os
import subprocess
import uuid
from queue import Queue
from typing import AsyncGenerator

import openai
from fastapi import FastAPI, BackgroundTasks, Response
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

app = FastAPI()
client = openai.AsyncOpenAI()

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


class ChatRequest(BaseModel):
    assistantId: str | None
    threadId: str
    content: str
    code: str | None


# Function to stream data from OpenAI API
# A helper function that runs the OpenAI stream in a separate thread

@app.post("/openai-assistant")
async def assistant(request: ChatRequest, background_tasks: BackgroundTasks):
    # Parse incoming request data
    assistant_id = request.assistantId
    thread_id = request.threadId
    content = request.content
    code = request.code

    # Add user message to the thread
    await client.beta.threads.messages.create(thread_id,
                                              role="user",
                                              content=content
                                              )

    if code:
        await client.beta.threads.messages.create(thread_id,
                                                  role="user",
                                                  content=f"Here is my most up-to-date code from the inline code-editor.\n{code}"
                                                  )

    # Generator to yield responses from the queue
    async def response_generator() -> AsyncGenerator[str, None]:
        try:
            stream = await client.beta.threads.runs.create(
                thread_id=thread_id,
                assistant_id=assistant_id,
                stream=True,
            )
            # Stream responses and add them to the queue
            async for chunk in stream:
                try:
                    # text = chunk.data.content.get("text","").get('value', '')
                    # print(chunk.data.delta.content[])
                    for line in chunk.data.delta.content:
                        yield line.text.value
                except Exception as e:
                    pass
        except:
            yield "An error occurred. Please try again."
    return StreamingResponse(response_generator(), media_type="application/json", )


@app.post("/openai-assistant/create-thread")
async def create_thread():
    thread = await client.beta.threads.create()
    return Response(json.dumps({
        "threadId": thread.id
    }), media_type="application/json")


@app.post("api/compile")
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
