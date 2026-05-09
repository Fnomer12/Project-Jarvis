"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
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
  Sparkles,
  BrainCircuit,
  Radar,
} from "lucide-react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("Initializing JARVIS interface...");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [wakeMode, setWakeMode] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [time, setTime] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [shutdownMode, setShutdownMode] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      setUser(data.user);
      setAuthLoading(false);
    }

    getUser();
  }, []);

  useEffect(() => {
    checkBackend();
    fetchHistory();

    const backendInterval = setInterval(checkBackend, 4000);
    const historyInterval = setInterval(fetchHistory, 3000);

    return () => {
      clearInterval(backendInterval);
      clearInterval(historyInterval);
    };
  }, []);

  useEffect(() => {
    const intro = [
      "Initializing neural interface...",
      "Voice systems online...",
      "Mac control enabled...",
      "Welcome back, sir.",
    ];

    let index = 0;

    const timer = setInterval(() => {
      setReply(intro[index]);
      index++;

      if (index >= intro.length) clearInterval(timer);
    }, 850);

    return () => clearInterval(timer);
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

  async function checkBackend() {
    try {
      const res = await fetch("http://localhost:8000/status");
      const data = await res.json();
      setBackendOnline(data.backend === "online");
    } catch {
      setBackendOnline(false);
    }
  }

  async function fetchHistory() {
    try {
      const res = await fetch("http://localhost:8000/history");
      const data = await res.json();
      setHistory([...data.history].reverse());
    } catch {
      setHistory([]);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

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
      fetchHistory();
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
    utterance.pitch = 0.78;
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

    setWakeMode(false);
    setListening(true);
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
        event.results[event.results.length - 1][0].transcript
          .toLowerCase()
          .trim();

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

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-cyan-100">
        Loading JARVIS...
      </main>
    );
  }

  if (shutdownMode) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] text-cyan-100">
        <motion.div
          animate={{ backgroundPosition: ["0px 0px", "42px 42px"] }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.05)_1px,transparent_1px)] bg-[size:42px_42px]"
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-black/65" />

        <div className="relative z-10 flex flex-col items-center gap-8 text-center">
          <motion.div
            animate={{
              scale: [1, 1.04, 1],
              boxShadow: [
                "0 0 40px rgba(34,211,238,0.2)",
                "0 0 100px rgba(34,211,238,0.55)",
                "0 0 40px rgba(34,211,238,0.2)",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-44 w-44 items-center justify-center rounded-full border border-cyan-300/40 bg-black/50 backdrop-blur-xl"
          >
            <div>
              <h1 className="pl-2 text-3xl font-black tracking-[0.35em]">
                JARVIS
              </h1>

              <p className="mt-3 text-xs tracking-[0.35em] text-cyan-300">
                STANDBY
              </p>
            </div>
          </motion.div>

          <div>
            <p className="text-6xl font-light tracking-widest">{time}</p>

            <p className="mt-4 text-sm tracking-[0.5em] text-cyan-300/70">
              DISPLAY MODE
            </p>
          </div>

          <button
            onClick={() => {
              setShutdownMode(false);
              setReply("JARVIS systems restored. Welcome back, sir.");
              speak("JARVIS systems restored. Welcome back, sir.");
            }}
            className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-8 py-3 text-sm tracking-widest text-cyan-100 backdrop-blur-xl transition hover:bg-cyan-400/20"
          >
            WAKE SYSTEM
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-cyan-100">
      <motion.div
        animate={{ backgroundPosition: ["0px 0px", "42px 42px"] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.07)_1px,transparent_1px)] bg-[size:42px_42px]"
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.2),transparent_55%)]" />
      <div className="absolute inset-0 bg-black/45" />

      <TopBadge
        left
        icon={<Sparkles size={14} />}
        text={backendOnline ? "JARVIS ACTIVE" : "LOCAL MODE"}
      />

      <TopBadge icon={<Clock3 size={14} />} text={time} />

      <button
        onClick={signOut}
        className="absolute right-5 top-16 z-20 rounded-full border border-cyan-400/20 bg-cyan-950/20 px-4 py-2 text-xs tracking-widest text-cyan-100 backdrop-blur-xl hover:bg-cyan-400/10"
      >
        SIGN OUT
      </button>

      <section className="relative z-10 grid min-h-screen grid-cols-1 gap-6 px-4 py-14 lg:grid-cols-[270px_1fr_300px]">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <HudPanel title="SYSTEM STATUS">
            <StatusItem icon={<Cpu />} label="AI Core" value={loading ? "Thinking" : "Standby"} />
            <StatusItem icon={<Wifi />} label="Backend" value={backendOnline ? "Online" : "Offline"} />
            <StatusItem icon={<ShieldCheck />} label="Security" value="Protected" />
            <StatusItem icon={<Volume2 />} label="Voice" value={wakeMode ? "Wake" : listening ? "Listening" : "Standby"} />
            <StatusItem icon={<Terminal />} label="Mac Control" value="Enabled" />
          </HudPanel>
        </motion.div>

        <div className="flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{
              opacity: 1,
              scale: listening || wakeMode ? [1, 1.04, 1] : [1, 1.018, 1],
            }}
            transition={{
              opacity: { duration: 0.7 },
              scale: {
                duration: listening || wakeMode ? 1 : 3,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
            className="relative flex h-[300px] w-[300px] items-center justify-center"
          >
            <GlowRing size="h-[300px] w-[300px]" delay={0} />
            <GlowRing size="h-[250px] w-[250px]" delay={0.2} />
            <GlowRing size="h-[205px] w-[205px]" delay={0.4} />

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              className="absolute h-[270px] w-[270px] rounded-full border border-dashed border-cyan-300/20"
            />

            <motion.div
              animate={{
                boxShadow: [
                  "0 0 45px rgba(34,211,238,0.25)",
                  "0 0 110px rgba(34,211,238,0.65)",
                  "0 0 45px rgba(34,211,238,0.25)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative z-10 flex h-40 w-40 flex-col items-center justify-center rounded-full border-2 border-cyan-300 bg-black/70 backdrop-blur-2xl"
            >
              <BrainCircuit className="mb-2 text-cyan-300" size={24} />

              <h1 className="pl-1 text-2xl font-black tracking-[0.28em]">
                JARVIS
              </h1>

              <p className="mt-2 text-[10px] tracking-[0.3em] text-cyan-300">
                {wakeMode
                  ? "WAKE MODE"
                  : listening
                  ? "LISTENING"
                  : loading
                  ? "PROCESSING"
                  : backendOnline
                  ? "ONLINE"
                  : "LOCAL"}
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            key={reply}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-6 max-w-xl rounded-2xl border border-cyan-300/20 bg-cyan-950/20 p-4 text-center text-base shadow-[0_0_35px_rgba(34,211,238,0.12)] backdrop-blur-xl"
          >
            {reply}
          </motion.div>

          <div className="mt-6 grid grid-cols-4 gap-4">
            <ControlButton
              icon={<Mic />}
              label={wakeMode ? "Stop" : "Wake"}
              onClick={wakeMode || listening ? stopVoice : startWakeMode}
              active={wakeMode || listening}
            />

            <ControlButton icon={<Activity />} label="Voice" onClick={startVoice} />

            <ControlButton
              icon={<Settings />}
              label="Config"
              onClick={() => {
                setReply("Configuration panel coming online, sir.");
                speak("Configuration panel coming online, sir.");
              }}
            />

            <ControlButton
              icon={<Power />}
              label="Power"
              onClick={() => {
                stopVoice();
                setShutdownMode(true);
              }}
            />
          </div>

          <div className="mt-6 flex w-full max-w-xl gap-3">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="Ask JARVIS anything..."
              className="flex-1 rounded-2xl border border-cyan-300/20 bg-cyan-950/20 px-5 py-4 text-base text-cyan-100 outline-none backdrop-blur-xl placeholder:text-cyan-300/40"
            />

            <button
              onClick={() => sendMessage()}
              disabled={loading}
              className="rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-6 py-4 transition hover:bg-cyan-400/20 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col gap-5"
        >
          <HudPanel title="NEURAL ACTIVITY">
            <Waveform active={loading || listening || wakeMode} />

            <p className="mt-4 text-xs text-cyan-200/70">
              {wakeMode
                ? "Wake detection active. Say: Hey Jarvis."
                : listening
                ? "Audio input detected. Converting speech to command..."
                : loading
                ? "Reasoning engine active. Awaiting AI response..."
                : "System idle. Awaiting instruction."}
            </p>
          </HudPanel>

          <HudPanel title="COMMAND HISTORY">
            <div className="max-h-[260px] space-y-3 overflow-y-auto pr-2">
              {history.length === 0 && (
                <p className="text-sm text-cyan-200/50">No commands yet.</p>
              )}

              {history.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-cyan-300/10 bg-black/20 p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-cyan-400">{item.time}</p>
                    <div className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,1)]" />
                  </div>

                  <p className="mt-2 text-sm text-cyan-100">{item.message}</p>
                  <p className="mt-1 text-xs text-cyan-300/70">{item.reply}</p>
                </motion.div>
              ))}
            </div>
          </HudPanel>
        </motion.div>
      </section>
    </main>
  );
}

function TopBadge({
  icon,
  text,
  left,
}: {
  icon: React.ReactNode;
  text: string;
  left?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`absolute top-5 z-20 flex items-center gap-3 rounded-full border border-cyan-400/20 bg-cyan-950/20 px-5 py-2 text-xs tracking-widest backdrop-blur-xl ${
        left ? "left-5" : "right-5"
      }`}
    >
      {icon}
      {text}
    </motion.div>
  );
}

function GlowRing({ size, delay }: { size: string; delay: number }) {
  return (
    <motion.div
      animate={{
        opacity: [0.14, 0.6, 0.14],
        scale: [1, 1.035, 1],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      className={`absolute rounded-full border border-cyan-400/20 ${size}`}
    />
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
    <div className="rounded-3xl border border-cyan-400/20 bg-cyan-950/10 p-5 shadow-[0_0_50px_rgba(34,211,238,0.08)] backdrop-blur-2xl">
      <h2 className="mb-5 text-xs font-bold tracking-[0.38em] text-cyan-300">
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
    <motion.div
      whileHover={{ scale: 1.02, x: 2 }}
      className="mb-3 flex items-center justify-between rounded-xl border border-cyan-300/10 bg-black/20 p-4"
    >
      <div className="flex items-center gap-3">
        <div className="text-cyan-300">{icon}</div>
        <span className="text-sm">{label}</span>
      </div>

      <span className="text-xs text-cyan-200/70">{value}</span>
    </motion.div>
  );
}

function ControlButton({
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
    <motion.button
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`rounded-2xl border px-5 py-4 transition backdrop-blur-xl ${
        active
          ? "border-cyan-300 bg-cyan-400/20 shadow-[0_0_35px_rgba(34,211,238,0.4)]"
          : "border-cyan-300/20 bg-cyan-950/20 hover:bg-cyan-400/10"
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="text-cyan-300">{icon}</div>
        <span className="text-xs tracking-wider text-cyan-100">{label}</span>
      </div>
    </motion.button>
  );
}

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="relative flex h-32 items-center justify-center gap-2 overflow-hidden rounded-2xl border border-cyan-300/10 bg-black/20 p-4">
      <motion.div
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-cyan-300/10 to-transparent"
      />

      {Array.from({ length: 22 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            height: active
              ? [
                  `${18 + (i % 5) * 6}px`,
                  `${55 + (i % 7) * 6}px`,
                  `${22 + (i % 4) * 6}px`,
                ]
              : `${18 + (i % 4) * 3}px`,
          }}
          transition={{
            duration: active ? 0.75 : 1.5,
            repeat: Infinity,
            delay: i * 0.035,
            ease: "easeInOut",
          }}
          className="w-1.5 rounded-full bg-cyan-300/70 shadow-[0_0_12px_rgba(34,211,238,0.7)]"
        />
      ))}

      <Radar className="absolute right-4 top-4 text-cyan-300/30" size={18} />
    </div>
  );
}