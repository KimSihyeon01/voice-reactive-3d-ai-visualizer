# 🎯 Voice-Reactive 3D AI Visualizer

> **Speak to the AI, and watch it come alive.**
> Real-time 3D AI Interface with Voice Interaction, Emotion Analysis, and Dynamic Particle Effects.

![Project Banner]<img width="1919" height="909" alt="스크린샷 2026-02-16 002726" src="https://github.com/user-attachments/assets/cb1704fe-ca33-485b-b26d-28bc3e1629d8" />)
*(Screenshots coming soon)*

## ✨ Key Features

- **🧠 3D Particle Brain/Face**: Generates a 3D face model (`.gltf`) using 10,000+ interactive particles.
- **🗣️ Full Voice Conversation**:
  - **STT (Speech-to-Text)**: OpenAI Whisper for fast & accurate voice recognition.
  - **LLM (Large Language Model)**: Local Ollama (Llama3) for intelligent, empathetic responses.
  - **TTS (Text-to-Speech)**: Edge-TTS for natural-sounding AI voice output.
- **🎭 Dynamic Visual States**:
  - **Idle**: Subtle breathing animation.
  - **Listening**: Particles vibrate with anticipation.
  - **Thinking**: **Electric Blue** swirls and high-speed orbital rotation.
  - **Speaking**: Particles **expand** and glow rhythmically with voice amplitude.
- **🎨 Real-time Emotion Analysis**: Analysis of conversation context triggers 7 different color themes (Happy, Sad, Angry, Excited, etc.).
- **💎 Cyberpunk Aesthetic**: Matrix-style rain background, Bloom post-processing, and glassmorphism UI.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React + Vite (TypeScript)
- **3D Graphics**: Three.js, React Three Fiber
- **Effects**: Post-processing (Unreal Bloom), GLSL Shaders
- **Styling**: CSS Modules, Cyberpunk Theme

### Backend
- **Server**: Python Flask
- **AI Models**: 
  - **LLM**: Ollama (Llama 3 recommended)
  - **STT**: OpenAI Whisper (Base model)
  - **TTS**: Edge-TTS
- **Analysis**: NLTK (VADER Sentiment Analysis)

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **Ollama** installed and running (`ollama serve`)

### One-Click Run (Windows)
```batch
start.bat
```
*Automatically installs dependencies and launches both frontend and backend.*

### Manual Installation

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🎮 Usage Guide

1. Open `http://localhost:5173` in your browser.
2. Click the **"Start Mental Check"** (Microphone) icon.
3. Allow microphone access.
4. **Speak** to the AI.
   - *Example: "Hello, who are you?", "I feel sad today..."*
5. Watch the 3D model react:
   - **Listening**: Fast, jittery particles.
   - **Thinking**: Purple/Blue swirl.
   - **Speaking**: Bright, expanding face with audio response.

## 📂 Project Structure

```
AGI_human_interface/
├── backend/              # Flask Server & AI Logic
│   ├── app.py            # Main Entry Point
│   ├── emotion_analysis.py
│   └── ...
├── frontend/             # React Client
│   ├── src/
│   │   ├── modules/      # Three.js Visualizer, Particle System
│   │   ├── main.ts       # App Controller
│   │   └── ...
│   └── public/assets/    # 3D Models (.gltf)
├── start.bat             # One-click launcher
└── README.md
```

## 📜 License

MIT License - feel free to use and modify for your own projects.
