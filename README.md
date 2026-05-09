# Project Jarvis

A futuristic AI-powered assistant interface inspired by JARVIS from Iron Man, built with Next.js, TypeScript, Framer Motion, Supabase, Speech Recognition, and Mapbox GL.

---

# Features

- AI assistant interface
- Voice recognition and wake mode
- Animated futuristic HUD UI
- Real-time waveform visualization
- Interactive global map system
- Supabase authentication and profile management
- Profile picture uploads
- OpenAI API integration
- Dynamic command history
- Responsive futuristic dashboard
- Animated controls and hover interactions

---

# Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Framer Motion
- Supabase
- Mapbox GL
- OpenAI API
- Web Speech API

---

# Installation

Clone the repository:

```bash
git clone https://github.com/Fnomer12/Project-Jarvis.git
```

Navigate into the project:

```bash
cd Project-Jarvis/jarvis-ui
```

Install dependencies:

```bash
npm install
```

---

# Environment Variables

Create a `.env.local` file:

```bash
touch .env.local
```

Add the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

---

# Running the Project

Start the development server:

```bash
npm run dev
```

The app will run on:

```bash
http://localhost:3000
```

---

# Python Backend

Navigate to backend folder:

```bash
cd server
```

Create virtual environment:

```bash
python -m venv .venv
```

Activate environment:

### Mac/Linux

```bash
source .venv/bin/activate
```

### Windows

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run backend:

```bash
python server.py
```

Backend runs on:

```bash
http://localhost:8000
```

---

# Voice Commands

Examples:

```text
Hey Jarvis
Open map of Ghana
Show me Europe
Close map
```

---

# Folder Structure

```bash
jarvis-ui/
│
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── styles/
│
├── public/
├── .env.local
├── package.json
└── README.md
```

---

# Security

- Never commit `.env.local`
- Rotate exposed API keys immediately
- Use Supabase Row Level Security (RLS)

---

# Git Ignore

Ensure `.gitignore` contains:

```bash
.env.local
node_modules
.next
```

---

# Future Improvements

- Mac system controls
- Smart home integration
- Live AI streaming responses
- Multi-agent AI system
- Real-time weather overlay
- Vision recognition
- Mobile application
- 3D holographic interface

---

# Author

Michael Damoah  
AI Engineer  
Project Jarvis Initiative

---

# License

MIT License
