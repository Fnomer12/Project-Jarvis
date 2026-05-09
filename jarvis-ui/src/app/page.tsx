"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Mic,
  Power,
  Settings,
  Activity,
  Send,
  Cpu,
  Wifi,
  ShieldCheck,
  Volume2,
  Clock3,
  Terminal,
} from "lucide-react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("Initializing JARVIS interface...");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [wakeMode, setWakeMode] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [time, setTime] = useState("");
  const [introDone, setIntroDone] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const intro = [
      "Initializing neural interface...",
      "Connecting voice systems...",
      "Checking backend core...",
      "JARVIS is online. Welcome back, sir.",
    ];

    let i = 0;
    const timer = setInterval(() => {
      setReply(intro[i]);
      i++;

      if (i >= intro.length) {
        clearInterval(timer);
        setIntroDone(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function checkBackend() {
      try {
        const res = await fetch("http://localhost:8000");
        const data = await res.json();
        setBackendOnline(data.status === "online");
      } catch {
        setBackendOnline(false);
      }
    }

    checkBackend();
    const interval = setInterval(checkBackend, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function updateTime() {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  async function sendMessage(customMessage?: string) {
    const finalMessage = customMessage || message;
    if (!finalMessage.trim()) return;

    setLoading(true);
    setReply("Processing request...");

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: finalMessage }),
      });

      const data = await res.json();
      setReply(data.reply);
      speak(data.reply);
      setMessage("");
    } catch {
      setReply("JARVIS backend is offline. Start the Python server on port 8000.");
    } finally {
      setLoading(false);
    }
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.75;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  }

  function getSpeechRecognition() {
    return (
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  function startVoice() {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      setReply("Voice recognition is not supported in this browser. Use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    setListening(true);
    setWakeMode(false);
    setReply("Listening...");

    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
      setListening(false);
      sendMessage(transcript);
    };

    recognition.onerror = () => {
      setListening(false);
      setReply("I could not hear clearly. Please try again.");
    };

    recognition.onend = () => {
      setListening(false);
    };
  }

  function startWakeMode() {
  const SpeechRecognition = getSpeechRecognition();

  if (!SpeechRecognition) {
    setReply("Wake mode is not supported in this browser. Use Chrome.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognitionRef.current = recognition;

  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = false;

  let waitingForCommand = false;

  setWakeMode(true);
  setListening(true);
  setReply("Wake mode active. Say: Hey Jarvis.");

  recognition.start();

  recognition.onresult = (event: any) => {
    const transcript =
      event.results[event.results.length - 1][0].transcript.toLowerCase().trim();

    console.log("Wake transcript:", transcript);

    if (transcript.includes("hey jarvis")) {
      const command = transcript.replace("hey jarvis", "").trim();

      if (command) {
        setMessage(command);
        setReply(`Command received: ${command}`);
        sendMessage(command);
      } else {
        waitingForCommand = true;
        setReply("Yes sir, I am listening. What should I do?");
        speak("Yes sir, I am listening. What should I do?");
      }

      return;
    }

    if (waitingForCommand && transcript) {
      waitingForCommand = false;
      setMessage(transcript);
      setReply(`Command received: ${transcript}`);
      sendMessage(transcript);
    }
  };

  recognition.onerror = () => {
    setWakeMode(false);
    setListening(false);
    setReply("Wake mode encountered an audio error. Please restart wake mode.");
  };

  recognition.onend = () => {
    if (recognitionRef.current === recognition) {
      try {
        recognition.start();
      } catch {
        setWakeMode(false);
        setListening(false);
      }
    }
  };
}

  function stopVoice() {
    const currentRecognition = recognitionRef.current;
    recognitionRef.current = null;

    currentRecognition?.stop();

    setWakeMode(false);
    setListening(false);
    setReply("Voice systems standing by.");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020817] text-cyan-100">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.08)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.2),transparent_55%)]" />
      <div className="absolute inset-0 bg-black/40" />

      <div className="absolute left-8 top-8 z-20 rounded-full border border-cyan-300/20 bg-cyan-950/30 px-5 py-3 text-sm backdrop-blur-xl">
        {introDone ? "JARVIS ACTIVE" : "BOOTING SYSTEM"}
      </div>

      <div className="absolute right-8 top-8 z-20 flex items-center gap-3 rounded-full border border-cyan-300/20 bg-cyan-950/30 px-5 py-3 text-sm backdrop-blur-xl">
        <Clock3 size={16} />
        {time}
      </div>

      <section className="relative z-10 grid min-h-screen grid-cols-1 items-center gap-8 px-6 py-24 lg:grid-cols-[1fr_440px_1fr]">
        <HudPanel title="SYSTEM STATUS">
          <StatusItem icon={<Cpu />} label="AI Core" value={loading ? "Processing" : "Standby"} />
          <StatusItem icon={<Wifi />} label="Backend" value={backendOnline ? "Online" : "Offline"} />
          <StatusItem icon={<ShieldCheck />} label="Security" value="Protected" />
          <StatusItem icon={<Volume2 />} label="Voice" value={wakeMode ? "Wake Mode" : listening ? "Listening" : "Standby"} />
          <StatusItem icon={<Terminal />} label="Mac Control" value="Enabled" />
        </HudPanel>

        <div className="flex flex-col items-center justify-center">
          <motion.div
            animate={{
              scale: listening ? [1, 1.1, 1] : [1, 1.04, 1],
              boxShadow: [
                "0 0 70px rgba(34,211,238,0.35)",
                "0 0 160px rgba(34,211,238,0.85)",
                "0 0 70px rgba(34,211,238,0.35)",
              ],
            }}
            transition={{
              duration: listening ? 1 : 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative flex h-84 w-84 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-950/10"
          >
            <OrbitRing size="h-[24rem] w-[24rem]" />
            <OrbitRing size="h-[20rem] w-[20rem]" />
            <OrbitRing size="h-[16rem] w-[16rem]" />

            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 flex h-48 w-48 items-center justify-center rounded-full border-2 border-cyan-300 bg-black/60 backdrop-blur-xl"
            >
              <div className="text-center">
                <h1 className="text-3xl font-bold tracking-[0.45em]">JARVIS</h1>
                <p className="mt-2 text-xs text-cyan-300">
                  {wakeMode
                    ? "WAKE MODE"
                    : listening
                    ? "LISTENING"
                    : loading
                    ? "THINKING"
                    : backendOnline
                    ? "ONLINE"
                    : "LOCAL MODE"}
                </p>
              </div>
            </motion.div>
          </motion.div>

          <p className="mt-10 max-w-xl rounded-2xl border border-cyan-300/20 bg-cyan-950/20 p-5 text-center text-cyan-100/90 shadow-[0_0_40px_rgba(34,211,238,0.12)] backdrop-blur-xl">
            {reply}
          </p>

          <div className="mt-8 grid grid-cols-4 gap-4">
            <IconButton
              icon={<Mic />}
              label={wakeMode ? "Stop" : "Wake"}
              onClick={wakeMode || listening ? stopVoice : startWakeMode}
              active={wakeMode || listening}
            />
            <IconButton icon={<Activity />} label="Voice" onClick={startVoice} />
            <IconButton icon={<Settings />} label="Config" />
            <IconButton icon={<Power />} label="Power" />
          </div>

          <div className="mt-8 flex w-full max-w-xl gap-3">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="Ask JARVIS anything... e.g. open Safari"
              className="flex-1 rounded-2xl border border-cyan-300/30 bg-cyan-950/30 px-5 py-4 text-cyan-100 outline-none backdrop-blur placeholder:text-cyan-300/50"
            />

            <button
              onClick={() => sendMessage()}
              disabled={loading}
              className="flex items-center gap-2 rounded-2xl border border-cyan-300/40 bg-cyan-400/10 px-6 py-4 text-cyan-100 transition hover:bg-cyan-400/20 disabled:opacity-50"
            >
              <Send size={18} />
              {loading ? "Thinking" : "Send"}
            </button>
          </div>
        </div>

        <HudPanel title="NEURAL ACTIVITY">
          <Waveform active={loading || listening || wakeMode} />
          <p className="mt-5 text-sm text-cyan-200/70">
            {wakeMode
              ? "Wake detection active. Say: Hey Jarvis."
              : listening
              ? "Audio input detected. Converting speech to command..."
              : loading
              ? "Reasoning engine active. Awaiting AI response..."
              : "System idle. Awaiting instruction."}
          </p>
        </HudPanel>
      </section>
    </main>
  );
}

function OrbitRing({ size }: { size: string }) {
  return (
    <motion.div
      animate={{ opacity: [0.25, 0.7, 0.25], scale: [1, 1.03, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className={`absolute rounded-full border border-cyan-300/20 ${size}`}
    />
  );
}

function IconButton({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-5 backdrop-blur transition ${
        active
          ? "border-cyan-300 bg-cyan-400/20 shadow-[0_0_35px_rgba(34,211,238,0.45)]"
          : "border-cyan-300/30 bg-cyan-950/30 hover:bg-cyan-400/10"
      }`}
    >
      <div className="mx-auto flex h-8 w-8 items-center justify-center text-cyan-300">
        {icon}
      </div>
      <p className="mt-2 text-xs text-cyan-200">{label}</p>
    </button>
  );
}

function HudPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-cyan-300/20 bg-cyan-950/20 p-6 shadow-[0_0_45px_rgba(34,211,238,0.12)] backdrop-blur-xl">
      <h2 className="mb-6 text-sm font-semibold tracking-[0.35em] text-cyan-300">
        {title}
      </h2>
      {children}
    </div>
  );
}

function StatusItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-2xl border border-cyan-300/10 bg-black/20 p-4">
      <div className="flex items-center gap-3 text-cyan-200">
        <span className="text-cyan-300">{icon}</span>
        <span>{label}</span>
      </div>
      <span className="text-sm text-cyan-100/70">{value}</span>
    </div>
  );
}

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-40 items-center justify-center gap-2 rounded-2xl border border-cyan-300/10 bg-black/20 p-4">
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            height: active
              ? [
                  `${22 + (i % 5) * 8}px`,
                  `${80 + (i % 7) * 8}px`,
                  `${26 + (i % 4) * 8}px`,
                ]
              : "24px",
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.04,
            ease: "easeInOut",
          }}
          className="w-2 rounded-full bg-cyan-300/70 shadow-[0_0_15px_rgba(34,211,238,0.7)]"
        />
      ))}
    </div>
  );
}