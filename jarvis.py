import os
import speech_recognition as sr
import pyttsx3
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

engine = pyttsx3.init()
engine.setProperty("rate", 170)

def speak(text):
    print(f"JARVIS: {text}")
    engine.say(text)
    engine.runAndWait()

def listen():
    recognizer = sr.Recognizer()

    with sr.Microphone() as source:
        print("Listening...")
        recognizer.adjust_for_ambient_noise(source)
        audio = recognizer.listen(source)

    try:
        command = recognizer.recognize_google(audio)
        print(f"You: {command}")
        return command
    except sr.UnknownValueError:
        speak("Sorry, I did not catch that.")
        return ""
    except sr.RequestError:
        speak("Speech recognition service is unavailable.")
        return ""

def ask_jarvis(prompt):
    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You are JARVIS, a calm, intelligent AI assistant. Respond briefly and helpfully."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response.choices[0].message.content

def main():
    speak("JARVIS is online. How may I assist you?")

    while True:
        command = listen()

        if command.lower() in ["exit", "quit", "shutdown", "stop"]:
            speak("Shutting down. Goodbye.")
            break

        if command:
            reply = ask_jarvis(command)
            speak(reply)

if __name__ == "__main__":
    main()