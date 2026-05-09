"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

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
  LogOut,
  UserCircle,
  X,
  KeyRound,
  Palette,
  Camera,
} from "lucide-react";

type Profile = {
  id: string;
  full_name: string | null;
  preferred_name: string | null;
  email: string | null;
  phone_code: string | null;
  phone_number: string | null;
  gender: string | null;
  citizenship: string | null;
  avatar_url: string | null;
  theme: string | null;
  accent_color: string | null;
  openai_api_key: string | null;
};

const colorPalette = [
  { name: "Cyan", value: "cyan", rgb: "34,211,238", hex: "#22D3EE" },
  { name: "Blue", value: "blue", rgb: "59,130,246", hex: "#3B82F6" },
  { name: "Purple", value: "purple", rgb: "168,85,247", hex: "#A855F7" },
  { name: "Green", value: "green", rgb: "34,197,94", hex: "#22C55E" },
  { name: "Red", value: "red", rgb: "248,113,113", hex: "#F87171" },
  { name: "Amber", value: "amber", rgb: "251,191,36", hex: "#FBBF24" },
];

const accentMap: Record<string, string> = Object.fromEntries(
  colorPalette.map((c) => [c.value, c.rgb])
);

const locationPresets: Record<string, [[number, number], [number, number]]> = {
  africa: [[-20, -35], [55, 38]],
  europe: [[-25, 34], [45, 72]],
  asia: [[25, -10], [180, 80]],
  "north america": [[-170, 5], [-50, 85]],
  "south america": [[-82, -56], [-34, 13]],
  australia: [[112, -44], [154, -10]],
  ghana: [[-3.3, 4.5], [1.3, 11.2]],
  accra: [[-0.35, 5.48], [-0.03, 5.72]],
};

function cleanMapLocation(command: string) {
  return command
    .toLowerCase()
    .replace(/hey jarvis/g, "")
    .replace(/open\s+(a\s+)?maps?/g, "")
    .replace(/show\s+me/g, "")
    .replace(/the\s+map\s+of/g, "")
    .replace(/map\s+of/g, "")
    .replace(/^of\s+/g, "")
    .replace(/for\s+me/g, "")
    .replace(/please/g, "")
    .replace(/entire/g, "")
    .replace(/whole/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

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
  const [settingsOpen, setSettingsOpen] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapLocation, setMapLocation] = useState("Accra");

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [theme, setTheme] = useState("dark");
  const [accentColor, setAccentColor] = useState("cyan");
  const [openaiKey, setOpenaiKey] = useState("");
  const [settingsFullName, setSettingsFullName] = useState("");
  const [settingsPreferredName, setSettingsPreferredName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [voiceLevel, setVoiceLevel] = useState(0);

  const accentRgb = accentMap[accentColor] || accentMap.cyan;

  const preferredName =
    profile?.preferred_name ||
    settingsPreferredName ||
    user?.user_metadata?.preferred_name ||
    user?.user_metadata?.full_name ||
    "sir";

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      setUser(data.user);
      await loadProfile(data.user);
      setAuthLoading(false);
    }

    getUser();
  }, []);

  async function loadProfile(currentUser: User) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (data) {
      setProfile(data);
      setTheme(data.theme || "dark");
      setAccentColor(data.accent_color || "cyan");
      setOpenaiKey(data.openai_api_key || "");
      setSettingsFullName(data.full_name || "");
      setSettingsPreferredName(data.preferred_name || "");
      setAvatarPreview(data.avatar_url || "");

      const name = data.preferred_name || data.full_name || "sir";
      setReply(`Welcome back, ${name}.`);
      speak(`Welcome back, ${name}.`);
    }
  }

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

 useEffect(() => {
  if (!mapOpen || !mapContainerRef.current) return;

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    setReply("Mapbox token is missing. Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local.");
    return;
  }

  mapboxgl.accessToken = token;

  async function openMapLocation() {
    const cleanLocation = cleanMapLocation(mapLocation);

    mapRef.current?.remove();

    const map = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [0, 20],
      zoom: 1.4,
      pitch: 0,
      bearing: 0,
      antialias: true,
    });

    mapRef.current = map;

    map.on("load", async () => {
      map.resize();

 const presetBounds = locationPresets[cleanLocation];

if (presetBounds) {
  const bounds = new mapboxgl.LngLatBounds(
    presetBounds[0],
    presetBounds[1]
  );

  map.fitBounds(bounds, {
    padding: 80,
    maxZoom: 4,
    duration: 1500,
    essential: true,
  });

  return;
}

      const geoRes = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          mapLocation
        )}.json?access_token=${token}&limit=5&types=country,region,district,place,locality,neighborhood,address`
      );

      const geoData = await geoRes.json();

      const feature =
        geoData.features?.find((f: any) =>
          f.place_name.toLowerCase().includes(cleanLocation)
        ) || geoData.features?.[0];

      if (!feature) {
        setReply(`I could not find ${mapLocation}. Try another location.`);
        speak(`I could not find ${mapLocation}. Try another location.`);
        return;
      }

      const coordinates = feature.center as [number, number];
      const bbox = feature.bbox as [number, number, number, number] | undefined;
      const type = feature.place_type?.[0];

      if (bbox) {
        map.fitBounds(
          [
            [bbox[0], bbox[1]],
            [bbox[2], bbox[3]],
          ],
          {
            padding: type === "country" ? 90 : 120,
            duration: 1500,
            essential: true,
          }
        );
      } else {
        map.flyTo({
          center: coordinates,
          zoom:
            type === "country"
              ? 4
              : type === "region"
              ? 6
              : type === "place"
              ? 10
              : 13,
          duration: 1400,
          essential: true,
        });
      }
    });
  }

  openMapLocation();

  return () => {
    mapRef.current?.remove();
    mapRef.current = null;
  };
}, [mapOpen, mapLocation]);

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

  async function saveSettings() {
    if (!user) return;

    setSavingSettings(true);
    setSettingsMessage("");

    let avatarUrl = avatarPreview || profile?.avatar_url || null;

    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const filePath = `${user.id}/profile-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        setSavingSettings(false);
        setSettingsMessage(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      avatarUrl = data.publicUrl;
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        full_name: settingsFullName,
        preferred_name: settingsPreferredName,
        avatar_url: avatarUrl,
        theme,
        accent_color: accentColor,
        openai_api_key: openaiKey,
      },
      { onConflict: "id" }
    );

    setSavingSettings(false);

    if (error) {
      setSettingsMessage(error.message);
      return;
    }

    setProfile({
      id: user.id,
      full_name: settingsFullName,
      preferred_name: settingsPreferredName,
      email: user.email || "",
      phone_code: profile?.phone_code || null,
      phone_number: profile?.phone_number || null,
      gender: profile?.gender || null,
      citizenship: profile?.citizenship || null,
      avatar_url: avatarUrl,
      theme,
      accent_color: accentColor,
      openai_api_key: openaiKey,
    });

    setAvatarPreview(avatarUrl || "");
    setAvatarFile(null);
    setSettingsMessage("Profile and settings saved successfully.");
    setReply(`Settings updated, ${settingsPreferredName || settingsFullName || "sir"}.`);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

function handleMapCommand(command: string) {
  const lower = command.toLowerCase();

  if (lower.includes("close map") || lower.includes("close maps")) {
    setMapOpen(false);
    setReply(`Map closed, ${preferredName}.`);
    speak(`Map closed, ${preferredName}.`);
    return true;
  }

  if (
    lower.includes("open map") ||
    lower.includes("open maps") ||
    lower.includes("map of") ||
    lower.includes("show me")
  ) {
    const location = cleanMapLocation(command) || "Accra";

    setMapLocation(location);
    setMapOpen(true);

    const response = `Opening map of ${location}, ${preferredName}.`;
    setReply(response);
    speak(response);

    return true;
  }

  return false;
}

  async function sendMessage(customMessage?: string) {
    const finalMessage = customMessage || message;
    if (!finalMessage.trim()) return;

    if (handleMapCommand(finalMessage)) {
      setMessage("");
      return;
    }

    setLoading(true);
    setReply("Processing request...");

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-openai-key": openaiKey,
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
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  }

  async function startAudioWave() {
    try {
      stopAudioWave();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.72;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      function animate() {
        analyser.getByteFrequencyData(dataArray);

        const average =
          dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;

        setVoiceLevel(Math.min(average / 90, 1));
        animationRef.current = requestAnimationFrame(animate);
      }

      animate();
    } catch {
      setReply("Microphone permission is needed for live soundwave.");
    }
  }

  function stopAudioWave() {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    streamRef.current?.getTracks().forEach((track) => track.stop());
    audioContextRef.current?.close();

    streamRef.current = null;
    animationRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;

    setVoiceLevel(0);
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
    startAudioWave();

    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
      setListening(false);
      stopAudioWave();
      sendMessage(transcript);
    };

    recognition.onerror = () => {
      setListening(false);
      stopAudioWave();
      setReply("I could not hear clearly. Please try again.");
    };

    recognition.onend = () => {
      setListening(false);
      stopAudioWave();
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
    setReply(`Wake mode active, ${preferredName}. Say: Hey Jarvis.`);
    startAudioWave();

    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript =
        event.results[event.results.length - 1][0].transcript.toLowerCase().trim();

      if (transcript.includes("hey jarvis")) {
        const command = transcript.replace("hey jarvis", "").trim();

        if (command) {
          setMessage(command);
          setReply(`Command received: ${command}`);
          sendMessage(command);
        } else {
          waitingForCommand = true;
          setReply(`Yes ${preferredName}, I am listening. What should I do?`);
          speak(`Yes ${preferredName}, I am listening. What should I do?`);
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
      stopAudioWave();
      setWakeMode(false);
      setListening(false);
      setReply("Wake mode encountered an audio error. Please restart wake mode.");
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        try {
          recognition.start();
        } catch {
          stopAudioWave();
          setWakeMode(false);
          setListening(false);
        }
      }
    };
  }

  function stopVoice() {
    stopAudioWave();

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
        <BackgroundGrid accentRgb={accentRgb} />

        <div className="relative z-10 flex flex-col items-center gap-8 text-center">
          <div className="relative flex h-[260px] w-[260px] items-center justify-center rounded-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-dashed border-cyan-300/20"
            />

            <div className="relative z-10 flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 border-black bg-white shadow-2xl">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="User profile" className="h-full w-full object-cover" />
              ) : (
                <UserCircle size={82} className="text-slate-500" />
              )}
            </div>
          </div>

          <div>
            <p className="text-6xl font-light tracking-widest">{time}</p>
            <p className="mt-4 text-sm tracking-[0.5em] opacity-70">JARVIS SYSTEMS SHUTDOWN</p>
          </div>

          <button
            onClick={() => {
              setShutdownMode(false);
              setReply(`JARVIS systems restored. Welcome back, ${preferredName}.`);
              speak(`JARVIS systems restored. Welcome back, ${preferredName}.`);
            }}
            className="rounded-full border px-8 py-3 text-sm tracking-widest backdrop-blur-xl transition"
            style={{
              borderColor: `rgba(${accentRgb},0.35)`,
              backgroundColor: `rgba(${accentRgb},0.1)`,
            }}
          >
            WAKE SYSTEM
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-cyan-100">
      <BackgroundGrid accentRgb={accentRgb} />

      <TopBadge left icon={<Sparkles size={14} />} text={backendOnline ? "JARVIS ACTIVE" : "LOCAL MODE"} />
      <TopBadge icon={<Clock3 size={14} />} text={time} />

      <div className="absolute right-5 top-20 z-30 flex gap-2">
        <button
          onClick={signOut}
          className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-950/30 px-3 py-2 text-[10px] tracking-widest text-cyan-100 backdrop-blur-xl hover:bg-cyan-400/10"
        >
          <LogOut size={14} />
          LOGOUT
        </button>
      </div>

      <section className="relative z-10 grid min-h-screen grid-cols-1 gap-6 px-4 py-14 lg:grid-cols-[270px_1fr_300px]">
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}>
          <HudPanel title="SYSTEM STATUS">
            <StatusItem icon={<UserCircle />} label="User" value={preferredName} />
            <StatusItem icon={<Cpu />} label="AI Core" value={loading ? "Thinking" : "Standby"} />
            <StatusItem icon={<Wifi />} label="Backend" value={backendOnline ? "Online" : "Offline"} />
            <StatusItem icon={<ShieldCheck />} label="Security" value="Protected" />
            <StatusItem icon={<Volume2 />} label="Voice" value={wakeMode ? "Wake" : listening ? "Listening" : "Standby"} />
            <StatusItem icon={<Terminal />} label="Mac Control" value="Enabled" />
          </HudPanel>
        </motion.div>

        <div className="flex flex-col items-center justify-center">
          <JarvisCore
            loading={loading}
            listening={listening}
            backendOnline={backendOnline}
            voiceLevel={voiceLevel}
            accentRgb={accentRgb}
          />

          <motion.div
            key={reply}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 max-w-xl rounded-3xl border border-cyan-300/20 bg-black/30 px-6 py-4 text-center text-base shadow-[0_0_40px_rgba(34,211,238,0.14)] backdrop-blur-xl"
          >
            {reply}
          </motion.div>

          <div className="mt-6 grid grid-cols-4 gap-4">
            <ControlButton icon={<Mic />} label={wakeMode ? "Stop" : "Wake"} onClick={wakeMode || listening ? stopVoice : startWakeMode} active={wakeMode || listening} />
            <ControlButton icon={<Activity />} label="Voice" onClick={startVoice} />
            <ControlButton icon={<Settings />} label="Config" onClick={() => setSettingsOpen(true)} />
            <ControlButton icon={<Power />} label="Power" onClick={() => { stopVoice(); setShutdownMode(true); }} />
          </div>

          <CommandInput
            message={message}
            setMessage={setMessage}
            sendMessage={sendMessage}
            listening={listening}
            voiceLevel={voiceLevel}
          />
        </div>

        <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="mt-20 flex flex-col gap-5">
          <HudPanel title="NEURAL ACTIVITY">
            <Waveform active={loading || listening || wakeMode} voiceLevel={voiceLevel} />

            <p className="mt-4 text-xs text-cyan-200/70">
              {wakeMode
                ? `Wake detection active. Say: Hey Jarvis, ${preferredName}.`
                : listening
                ? "Audio input detected. Converting speech to command..."
                : loading
                ? "Reasoning engine active. Awaiting AI response..."
                : "System idle. Awaiting instruction."}
            </p>
          </HudPanel>

          <HudPanel title="COMMAND HISTORY">
            <div className="max-h-[260px] space-y-3 overflow-y-auto pr-2">
              {history.length === 0 && <p className="text-sm text-cyan-200/50">No commands yet.</p>}

              {history.map((item, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-cyan-300/10 bg-black/20 p-3">
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

      <AnimatePresence>
        {mapOpen && (
          <motion.div
            key="jarvis-map-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 overflow-hidden bg-[#020617]"
          >
            <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0 bg-[#020617]/25" />

            <motion.div
              animate={{ backgroundPosition: ["0px 0px", "42px 42px"] }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.08)_1px,transparent_1px)] bg-[size:42px_42px]"
            />

            <button
              onClick={() => setMapOpen(false)}
              className="absolute left-8 top-8 rounded-full border border-cyan-300/30 bg-black/50 px-5 py-3 text-xs tracking-[0.25em] text-cyan-100 backdrop-blur-xl"
            >
              CLOSE
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {settingsOpen && (
        <SettingsPanel
          preferredName={preferredName}
          profile={profile}
          theme={theme}
          setTheme={setTheme}
          accentColor={accentColor}
          setAccentColor={setAccentColor}
          openaiKey={openaiKey}
          setOpenaiKey={setOpenaiKey}
          settingsFullName={settingsFullName}
          setSettingsFullName={setSettingsFullName}
          settingsPreferredName={settingsPreferredName}
          setSettingsPreferredName={setSettingsPreferredName}
          avatarPreview={avatarPreview}
          setAvatarPreview={setAvatarPreview}
          setAvatarFile={setAvatarFile}
          savingSettings={savingSettings}
          settingsMessage={settingsMessage}
          saveSettings={saveSettings}
          close={() => setSettingsOpen(false)}
          signOut={signOut}
        />
      )}
    </main>
  );
}

function BackgroundGrid({ accentRgb }: { accentRgb: string }) {
  return (
    <>
      <motion.div
        animate={{ backgroundPosition: ["0px 0px", "42px 42px"] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.07)_1px,transparent_1px)] bg-[size:42px_42px]"
      />

      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, rgba(${accentRgb},0.2), transparent 55%)`,
        }}
      />

      <div className="absolute inset-0 bg-black/50" />
    </>
  );
}
function JarvisCore({ loading, listening, backendOnline, voiceLevel, accentRgb }: any) {
  const status = listening ? "LISTENING" : loading ? "PROCESSING" : backendOnline ? "ONLINE" : "LOCAL";

  return (
    <motion.div className="relative flex h-[320px] w-[320px] items-center justify-center">
      <motion.div
        animate={{ scale: listening ? 1 + voiceLevel * 0.25 : [1, 1.05, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="absolute h-[300px] w-[300px] rounded-full"
        style={{ boxShadow: `0 0 ${70 + voiceLevel * 160}px rgba(${accentRgb},0.45)` }}
      />

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute h-[285px] w-[285px] rounded-full border border-dashed border-cyan-300/25"
      />

      <motion.div
        className="relative z-10 flex h-44 w-44 flex-col items-center justify-center rounded-full border-2 bg-black/75 backdrop-blur-2xl"
        style={{ borderColor: listening ? "#fb7185" : `rgba(${accentRgb},1)` }}
      >
        <BrainCircuit className="mb-3" size={26} />
        <h1 className="pl-2 text-3xl font-black tracking-[0.35em]">JARVIS</h1>
        <p className="mt-3 text-[11px] tracking-[0.45em]">{status}</p>
      </motion.div>
    </motion.div>
  );
}

function CommandInput({ message, setMessage, sendMessage, listening }: any) {
  return (
    <div className="mt-7 flex w-full max-w-xl gap-3">
      <div className="relative flex-1 rounded-2xl border border-cyan-300/25 bg-cyan-950/20 px-5 py-4 backdrop-blur-xl">
        {listening ? (
          <div className="flex items-center gap-3 text-cyan-200/80">
            <div className="flex items-center gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [8, 18, 8] }}
                  transition={{
                    duration: 0.7,
                    repeat: Infinity,
                    delay: i * 0.08,
                    ease: "easeInOut",
                  }}
                  className="w-1 rounded-full bg-cyan-300/70"
                />
              ))}
            </div>

            <span className="text-lg font-semibold">Listening</span>
          </div>
        ) : (
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            placeholder="Ask JARVIS anything..."
            className="w-full bg-transparent text-base text-cyan-100 outline-none placeholder:text-cyan-300/40"
          />
        )}
      </div>

      <button
        onClick={() => sendMessage()}
        className="rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-6 py-4 transition hover:bg-cyan-400/20"
      >
        <Send size={20} />
      </button>
    </div>
  );
}

function SettingsPanel(props: any) {
  const {
    preferredName, profile, theme, setTheme, accentColor, setAccentColor,
    openaiKey, setOpenaiKey, settingsFullName, setSettingsFullName,
    settingsPreferredName, setSettingsPreferredName, avatarPreview,
    setAvatarPreview, setAvatarFile, savingSettings, settingsMessage,
    saveSettings, close, signOut
  } = props;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ x: 420 }} animate={{ x: 0 }} className="h-full w-full max-w-md overflow-y-auto border-l border-cyan-400/20 bg-[#020617]/95 p-6 text-cyan-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-[0.25em] text-cyan-300">SETTINGS</h2>
          <button onClick={close}><X /></button>
        </div>

        <div className="mt-8 flex items-center gap-4 rounded-2xl border border-cyan-300/20 bg-cyan-950/20 p-4">
          {avatarPreview ? <img src={avatarPreview} className="h-16 w-16 rounded-full object-cover" /> : <UserCircle />}
          <div>
            <p className="font-semibold">{preferredName}</p>
            <p className="text-xs text-cyan-300/70">{profile?.email}</p>
          </div>
        </div>

        <SettingLabel icon={<UserCircle size={16} />} label="Full Name" />
        <input value={settingsFullName} onChange={(e) => setSettingsFullName(e.target.value)} className={settingsInputClass} />

        <SettingLabel icon={<UserCircle size={16} />} label="Name JARVIS Should Call You" />
        <input value={settingsPreferredName} onChange={(e) => setSettingsPreferredName(e.target.value)} className={settingsInputClass} />

        <SettingLabel icon={<Camera size={16} />} label="Profile Picture" />
        <input type="file" accept="image/*" onChange={(e) => {
          const file = e.target.files?.[0] || null;
          setAvatarFile(file);
          if (file) setAvatarPreview(URL.createObjectURL(file));
        }} className={settingsInputClass} />

        <SettingLabel icon={<Palette size={16} />} label="Theme" />
        <select value={theme} onChange={(e) => setTheme(e.target.value)} className={settingsInputClass}>
          <option value="dark">Dark Mode</option>
          <option value="light">Light Mode</option>
        </select>

        <SettingLabel icon={<Palette size={16} />} label="Accent Color" />
        <div className="mt-3 grid grid-cols-3 gap-3">
          {colorPalette.map((color) => (
            <button key={color.value} onClick={() => setAccentColor(color.value)} className={`rounded-2xl border p-3 text-xs ${accentColor === color.value ? "border-white bg-white/10" : "border-cyan-300/20 bg-black/30"}`}>
              <div className="mx-auto mb-2 h-8 w-8 rounded-full" style={{ backgroundColor: color.hex }} />
              {color.name}
            </button>
          ))}
        </div>

        <SettingLabel icon={<KeyRound size={16} />} label="OpenAI API Key" />
        <input type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} className={settingsInputClass} />

        {settingsMessage && <p className="mt-5 rounded-xl border border-cyan-300/20 bg-cyan-950/20 p-3 text-sm">{settingsMessage}</p>}

        <button onClick={saveSettings} disabled={savingSettings} className="mt-6 w-full rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-5 py-4 font-semibold">
          {savingSettings ? "Saving..." : "Save Profile & Settings"}
        </button>

        <button onClick={signOut} className="mt-4 w-full rounded-2xl border border-red-300/30 bg-red-400/10 px-5 py-4 font-semibold text-red-100">
          Logout
        </button>
      </motion.div>
    </div>
  );
}

const settingsInputClass =
  "mt-3 w-full rounded-2xl border border-cyan-300/20 bg-black/30 px-5 py-4 text-cyan-100 outline-none placeholder:text-cyan-300/40";

function SettingLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <label className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
      {icon}
      {label}
    </label>
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

function HudPanel({ title, children }: { title: string; children: React.ReactNode }) {
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
      whileHover={{
        scale: 1.03,
        x: 6,
        boxShadow: "0 0 35px rgba(34,211,238,0.25)",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className="group mb-3 flex cursor-pointer items-center justify-between rounded-xl border border-cyan-300/10 bg-black/20 p-4"
    >
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{
            rotate: [0, -12, 12, -8, 8, 0],
            scale: [1, 1.25, 1.1, 1],
          }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
          className="text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]"
        >
          {icon}
        </motion.div>

        <span className="text-sm transition group-hover:text-cyan-100">
          {label}
        </span>
      </div>

      <motion.span
        whileHover={{ scale: 1.08 }}
        className="text-xs text-cyan-200/70 transition group-hover:text-cyan-200"
      >
        {value}
      </motion.span>
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

function Waveform({ active, voiceLevel }: { active: boolean; voiceLevel: number }) {
  return (
    <div className="relative flex h-32 items-center justify-center gap-2 overflow-hidden rounded-2xl border border-cyan-300/10 bg-black/20 p-4">
      {Array.from({ length: 26 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            height: active
              ? `${24 + voiceLevel * 80 + (i % 6) * 5}px`
              : `${18 + (i % 4) * 4}px`,
          }}
          transition={{
            duration: 0.25,
            repeat: Infinity,
            repeatType: "mirror",
            delay: i * 0.02,
          }}
          className="w-1.5 rounded-full bg-cyan-300/80 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
        />
      ))}
      <Radar className="absolute right-4 top-4 text-cyan-300/30" size={18} />
    </div>
  );
}