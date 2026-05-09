import os
import subprocess
import urllib.parse
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class ChatRequest(BaseModel):
    message: str


@app.get("/")
def home():
    return {"status": "online", "message": "JARVIS backend online"}


def run_applescript(script: str):
    subprocess.run(["osascript", "-e", script])


def control_mac(command: str):
    command = command.lower().strip()
    print("COMMAND RECEIVED:", command)

    apps = {
        "safari": "Safari",
        "chrome": "Google Chrome",
        "google chrome": "Google Chrome",
        "vs code": "Visual Studio Code",
        "vscode": "Visual Studio Code",
        "visual studio code": "Visual Studio Code",
        "terminal": "Terminal",
        "finder": "Finder",
        "notes": "Notes",
        "calendar": "Calendar",
        "music": "Music",
        "settings": "System Settings",
    }

    websites = {
        "youtube": "https://youtube.com",
        "google": "https://google.com",
        "github": "https://github.com",
        "chatgpt": "https://chatgpt.com",
        "gmail": "https://mail.google.com",
    }

    # Open apps
    for key, app_name in apps.items():
        if key in command and any(word in command for word in ["open", "launch", "start"]):
            subprocess.run(["open", "-a", app_name])
            return f"Opening {app_name}, sir."

    # Close apps
    for key, app_name in apps.items():
        if key in command and any(word in command for word in ["close", "quit", "exit"]):
            run_applescript(f'tell application "{app_name}" to quit')
            return f"Closing {app_name}, sir."

    # Open websites
    for key, url in websites.items():
        if key in command and any(word in command for word in ["open", "launch", "start"]):
            subprocess.run(["open", url])
            return f"Opening {key.title()}, sir."

    # Google search
    if command.startswith("search google for ") or command.startswith("google "):
        query = command.replace("search google for ", "").replace("google ", "")
        url = "https://www.google.com/search?q=" + urllib.parse.quote(query)
        subprocess.run(["open", url])
        return f"Searching Google for {query}, sir."

    # YouTube search
    if command.startswith("search youtube for ") or command.startswith("youtube "):
        query = command.replace("search youtube for ", "").replace("youtube ", "")
        url = "https://www.youtube.com/results?search_query=" + urllib.parse.quote(query)
        subprocess.run(["open", url])
        return f"Searching YouTube for {query}, sir."

    # Time
    if "what time" in command or "current time" in command or command == "time":
        now = datetime.now().strftime("%I:%M %p")
        return f"The time is {now}, sir."

    # Date
    if "what date" in command or "today's date" in command or command == "date":
        today = datetime.now().strftime("%A, %B %d, %Y")
        return f"Today is {today}, sir."

    # Volume
    if "mute" in command:
        run_applescript("set volume output muted true")
        return "Volume muted, sir."

    if "unmute" in command:
        run_applescript("set volume output muted false")
        return "Volume unmuted, sir."

    if "volume up" in command or "increase volume" in command:
        run_applescript("set volume output volume ((output volume of (get volume settings)) + 10)")
        return "Increasing volume, sir."

    if "volume down" in command or "decrease volume" in command:
        run_applescript("set volume output volume ((output volume of (get volume settings)) - 10)")
        return "Decreasing volume, sir."

    # Sleep display
    if "sleep display" in command or "turn off screen" in command:
        subprocess.run(["pmset", "displaysleepnow"])
        return "Turning off the display, sir."

    return None


@app.post("/chat")
def chat(request: ChatRequest):
    command_reply = control_mac(request.message)

    if command_reply:
        return {"reply": command_reply}

    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {
                    "role": "system",
                    "content": """
                    You are JARVIS, a futuristic AI assistant.
                    Reply briefly, intelligently, confidently, and call the user sir when natural.
                    """,
                },
                {"role": "user", "content": request.message},
            ],
        )

        return {"reply": response.choices[0].message.content}

    except Exception as e:
        print("OPENAI ERROR:", e)
        return {
            "reply": "My AI core is currently offline, but local system controls are still operational."
        }