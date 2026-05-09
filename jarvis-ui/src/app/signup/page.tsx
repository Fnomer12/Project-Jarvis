"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const phoneCodes = [
  { flag: "🇬🇭", country: "Ghana", code: "+233" },
  { flag: "🇳🇬", country: "Nigeria", code: "+234" },
  { flag: "🇺🇸", country: "United States", code: "+1" },
  { flag: "🇬🇧", country: "United Kingdom", code: "+44" },
  { flag: "🇨🇦", country: "Canada", code: "+1" },
  { flag: "🇿🇦", country: "South Africa", code: "+27" },
];

const countries = [
  { flag: "🇬🇭", name: "Ghana" },
  { flag: "🇳🇬", name: "Nigeria" },
  { flag: "🇺🇸", name: "United States" },
  { flag: "🇬🇧", name: "United Kingdom" },
  { flag: "🇨🇦", name: "Canada" },
  { flag: "🇿🇦", name: "South Africa" },
];

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCode, setPhoneCode] = useState("+233");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [citizenship, setCitizenship] = useState("Ghana");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  async function createAccount() {
    setMessage("");

    if (
      !fullName ||
      !preferredName ||
      !email ||
      !phone ||
      !gender ||
      !citizenship ||
      !password ||
      !confirmPassword
    ) {
      setMessage("Please complete all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setCreating(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          preferred_name: preferredName,
          phone_number: `${phoneCode}${phone}`,
          gender,
          citizenship,
        },
      },
    });

    setCreating(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Account created successfully. Check your email to confirm your account.");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 py-10 text-cyan-100">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.06)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-black/50" />

      <div className="absolute top-8 z-20 rounded-full border border-cyan-300/20 bg-cyan-950/30 px-6 py-2 text-xs font-semibold tracking-[0.35em] text-cyan-300 backdrop-blur-xl">
        SIGN UP
      </div>

      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-cyan-400/20 bg-cyan-950/20 p-8 text-left shadow-[0_0_70px_rgba(34,211,238,0.12)] backdrop-blur-2xl">
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-[0.35em]">JARVIS</h1>

          <p className="mt-4 text-sm text-cyan-200/70">
            Create your personal AI command account.
          </p>
        </div>

        <FieldLabel label="Full Name" />
        <input
          placeholder="Enter your full name"
          className={inputClass}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <FieldLabel label="What Should JARVIS Call You?" />
        <input
          placeholder="Example: Michael, Boss, Sir"
          className={inputClass}
          value={preferredName}
          onChange={(e) => setPreferredName(e.target.value)}
        />

        <FieldLabel label="Email Address" />
        <input
          type="email"
          placeholder="Enter your email address"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <FieldLabel label="Phone Number" />
        <div className="flex gap-3">
          <select
            value={phoneCode}
            onChange={(e) => setPhoneCode(e.target.value)}
            className="w-36 rounded-2xl border border-cyan-300/20 bg-black/30 px-3 py-4 text-cyan-100 outline-none"
          >
            {phoneCodes.map((item) => (
              <option key={`${item.country}-${item.code}`} value={item.code}>
                {item.flag} {item.code}
              </option>
            ))}
          </select>

          <input
            type="tel"
            placeholder="Enter phone number"
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <FieldLabel label="Gender" />
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className={inputClass}
        >
          <option value="">Select your gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>

        <FieldLabel label="Citizenship" />
        <select
          value={citizenship}
          onChange={(e) => setCitizenship(e.target.value)}
          className={inputClass}
        >
          {countries.map((country) => (
            <option key={country.name} value={country.name}>
              {country.flag} {country.name}
            </option>
          ))}
        </select>

        <FieldLabel label="Password" />
        <input
          type="password"
          placeholder="Create a secure password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <FieldLabel label="Confirm Password" />
        <input
          type="password"
          placeholder="Confirm your password"
          className={inputClass}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {message && (
          <p className="mt-4 rounded-xl border border-cyan-300/20 bg-black/30 p-3 text-center text-sm text-cyan-200">
            {message}
          </p>
        )}

        <button
          onClick={createAccount}
          disabled={creating}
          className="mt-6 w-full rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-6 py-4 text-center font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating ? "Creating Account..." : "Create Account"}
        </button>

        <a
          href="/login"
          className="mt-5 block text-center text-sm text-cyan-300/80 hover:text-cyan-100"
        >
          Already have an account? Login
        </a>
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-2xl border border-cyan-300/20 bg-black/30 px-5 py-4 text-cyan-100 outline-none placeholder:text-cyan-300/40";

function FieldLabel({ label }: { label: string }) {
  return (
    <label className="mb-2 mt-5 block text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
      {label}
    </label>
  );
}