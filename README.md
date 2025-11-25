# CoachLangAI 🌍

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Powered by Vercel AI SDK](https://img.shields.io/badge/Vercel%20AI%20SDK-5.0-blue)](https://sdk.vercel.ai/)
[![CI](https://github.com/Julianbourdes/ai-language-coach/actions/workflows/ci.yml/badge.svg)](https://github.com/Julianbourdes/ai-language-coach/actions/workflows/ci.yml)
[![Release](https://github.com/Julianbourdes/ai-language-coach/actions/workflows/release.yml/badge.svg)](https://github.com/Julianbourdes/ai-language-coach/actions/workflows/release.yml)

An AI-powered language learning application that helps you practice conversation in multiple languages with real-time feedback and role-play scenarios.

> **Note**: This project is built on top of [Vercel's AI Chatbot template](https://github.com/vercel/ai-chatbot) and extends it with language learning features.

![CoachLang_AI.png](https://backend.julianbourdes.com/uploads/Coach_Lang_AI_demo_5b92ee2a27.png)

## ✨ Features

- 🎤 **Voice Recording**: Practice speaking with automatic speech-to-text transcription (Whisper)
- 💬 **AI Conversation**: Chat with a supportive AI language coach powered by Ollama
- 🌍 **Multi-Language Support**: Practice English, French, or Spanish
- 🔊 **Text-to-Speech**: Listen to AI responses with natural voice synthesis
- ✨ **Real-time Feedback**: Get instant corrections on grammar, vocabulary, and style with highlighted text
- 🎭 **Role-Play Scenarios**: Practice specific situations like job interviews, business presentations, and casual conversations
- 📊 **Progress Tracking**: Monitor your improvement with scores and statistics
- 🔒 **Privacy First**: Everything runs locally - no data sent to external servers

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js 18+** and **pnpm**
2. **Docker** (for PostgreSQL database)
3. **Ollama** (for local AI)
4. **Whisper** (for speech-to-text)

### Installation

```bash
# Clone the repository
git clone https://github.com/Julianbourdes/ai-language-coach.git
cd ai-language-coach

# Install dependencies
pnpm install

# Set up database
docker compose up -d
pnpm db:migrate

# Configure environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start Ollama and pull model
ollama pull llama3.1:8b
ollama serve

# Run the application
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

For detailed setup instructions, see the full documentation below.

## 📚 Documentation

- [Setup Guide](#prerequisites) - Detailed installation instructions
- [Usage Guide](#usage) - How to use CoachLangAI
- [Contributing](CONTRIBUTING.md) - How to contribute to the project
- [Database Setup](SETUP-DB.md) - PostgreSQL and Redis configuration
- [TTS Upgrade](docs/TTS-UPGRADE.md) - Installing better voices

## 🛠️ Prerequisites

### 1. Node.js and pnpm

```bash
# Install pnpm if you don't have it
npm install -g pnpm
```

### 2. Docker (for PostgreSQL)

Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)

### 3. Ollama (for AI)

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows: Download from https://ollama.com/download
```

### 4. Whisper (for speech-to-text)

```bash
# macOS (recommended: whisper.cpp)
brew install whisper-cpp

# Download a model
mkdir -p models
curl -L -o models/ggml-base.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin
```

Find your whisper executable path:
```bash
which whisper-cli  # Usually /opt/homebrew/bin/whisper-cli
```

## ⚙️ Configuration

Create `.env.local` file:

```bash
# Database & Cache
POSTGRES_URL=postgresql://languagecoach:local_dev_password@localhost:5432/languagecoach
REDIS_URL=redis://localhost:6379

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# Whisper - Update these paths!
WHISPER_MODEL=/path/to/your/models/ggml-base.bin
WHISPER_EXECUTABLE_PATH=/opt/homebrew/bin/whisper-cli

# Auth Secret
AUTH_SECRET="your-secret-key-here"
```

**⚠️ Important:** Update the Whisper paths to match your system.

## 📖 Usage

### Starting a Conversation

1. Open [http://localhost:3000](http://localhost:3000)
2. Select your target language (🇬🇧 English, 🇫🇷 French, 🇪🇸 Spanish)
3. Choose a scenario or start a free conversation
4. Use voice input 🎤 or text input to practice

### Voice Input

1. Click the microphone button
2. Allow microphone access
3. Speak in your target language
4. Review transcription and send

### Text-to-Speech

Click the speaker icon next to AI responses to hear them read aloud with natural pronunciation.

### Understanding Feedback

- 🔴 **Red (Error)**: Grammar mistakes
- 🟡 **Yellow (Warning)**: Not idiomatic
- 🔵 **Blue (Suggestion)**: Style improvements

Click highlighted text for detailed explanations.

## 🎭 Available Scenarios

- Engineering Manager Interview
- Business Presentation
- Casual Coffee Chat
- Client Negotiation
- Explain Tech to Non-Technical
- ...and more!

## 🔧 Troubleshooting

### Database Connection Issues
```bash
docker compose ps  # Check if running
docker compose logs postgres
docker compose restart
```

### Ollama Not Responding
```bash
curl http://localhost:11434/api/tags  # Check status
ollama serve  # Start if needed
```

### Whisper Issues
```bash
# Test whisper
echo "Hello" | whisper-cli -m models/ggml-base.bin -f -

# Verify paths in .env.local
```

See full troubleshooting guide in the [complete README](#troubleshooting).

## 💻 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **AI SDK**: Vercel AI SDK
- **AI Model**: Ollama (llama3.1:8b)
- **Speech**: Whisper (speech-to-text), Web Speech API (text-to-speech)
- **Database**: PostgreSQL (Drizzle ORM)
- **Cache**: Redis
- **Auth**: NextAuth.js
- **UI**: shadcn/ui

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

This project builds upon:
- [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot) - Original template (Apache 2.0 License)
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI streaming and tools

## 🙏 Acknowledgments

- Vercel team for the amazing AI Chatbot template
- Ollama team for local AI capabilities
- OpenAI for Whisper
- All contributors to this project

## 🔗 Links

- [GitHub Repository](https://github.com/Julianbourdes/ai-language-coach)
- [Report a Bug](https://github.com/Julianbourdes/ai-language-coach/issues)
- [Request a Feature](https://github.com/Julianbourdes/ai-language-coach/issues)

## 📊 System Requirements

- **RAM**: 16GB recommended (8GB minimum)
- **Disk**: ~10GB for models
- **Browser**: Chrome, Edge, Safari (with microphone access)
- **OS**: macOS, Linux, Windows (WSL2 recommended)

### Whisper Model Sizes

| Model | Size | RAM | Speed | Accuracy | Best For |
|-------|------|-----|-------|----------|----------|
| tiny | 75 MB | ~1 GB | Fastest | Lower | Quick testing |
| base | 142 MB | ~1 GB | Fast | Good | **Recommended** |
| small | 466 MB | ~2 GB | Medium | Better | Better accuracy |
| medium | 1.5 GB | ~5 GB | Slow | High | High accuracy |
| large | 3 GB | ~10 GB | Slowest | Best | Maximum accuracy |

---

Made with ❤️ by [Julian Bourdes](https://github.com/Julianbourdes)

Built on [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot)
