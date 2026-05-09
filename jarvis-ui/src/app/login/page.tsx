"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000",
      },
    });
  }

  async function loginUser() {
    setMessage("");

    if (!email || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = "/";
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 text-cyan-100">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.06)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-black/50" />

      <div className="absolute top-8 z-20 rounded-full border border-cyan-300/20 bg-cyan-950/30 px-6 py-2 text-xs font-semibold tracking-[0.35em] text-cyan-300 backdrop-blur-xl">
        LOGIN
      </div>

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-cyan-400/20 bg-cyan-950/20 p-8 text-center shadow-[0_0_70px_rgba(34,211,238,0.12)] backdrop-blur-2xl">
        <h1 className="text-4xl font-black tracking-[0.35em]">JARVIS</h1>

        <p className="mt-4 text-sm text-cyan-200/70">
          Sign in to access your AI command center.
        </p>

        <button
          onClick={signInWithGoogle}
          className="mt-8 w-full rounded-2xl border border-cyan-300/30 bg-white px-6 py-4 font-semibold text-slate-900 transition hover:bg-cyan-100"
        >
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-cyan-300/20" />
          <span className="text-xs text-cyan-300/60">OR</span>
          <div className="h-px flex-1 bg-cyan-300/20" />
        </div>

        <input
          type="email"
          placeholder="Email address"
          className="w-full rounded-2xl border border-cyan-300/20 bg-black/30 px-5 py-4 text-cyan-100 outline-none placeholder:text-cyan-300/40"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="mt-4 w-full rounded-2xl border border-cyan-300/20 bg-black/30 px-5 py-4 text-cyan-100 outline-none placeholder:text-cyan-300/40"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {message && (
          <p className="mt-4 rounded-xl border border-cyan-300/20 bg-black/30 p-3 text-sm text-cyan-200">
            {message}
          </p>
        )}

        <button
          onClick={loginUser}
          className="mt-6 w-full rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-6 py-4 font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
        >
          Login
        </button>

        <a
          href="/signup"
          className="mt-5 block text-sm text-cyan-300/80 hover:text-cyan-100"
        >
          No account? Create one
        </a>
      </div>
    </main>
  );
}