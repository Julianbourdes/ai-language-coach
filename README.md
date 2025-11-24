# AI Language Coach

An AI-powered language learning application that helps you practice conversation in multiple languages with real-time feedback and role-play scenarios.

## Features

- 🎤 **Voice Recording**: Practice speaking with automatic speech-to-text transcription (Whisper)
- 💬 **AI Conversation**: Chat with a supportive AI language coach powered by Ollama
- 🌍 **Multi-Language Support**: Practice English, French, or Spanish
- 🔊 **Text-to-Speech**: Listen to AI responses with natural voice synthesis
- ✨ **Real-time Feedback**: Get instant corrections on grammar, vocabulary, and style with highlighted text
- 🎭 **Role-Play Scenarios**: Practice specific situations like job interviews, business presentations, and casual conversations
- 📊 **Progress Tracking**: Monitor your improvement with scores and statistics
- 🔒 **Privacy First**: Everything runs locally - no data sent to external servers

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js 18+** and **pnpm**
   ```bash
   # Install pnpm if you don't have it
   npm install -g pnpm
   ```

2. **Docker** (for PostgreSQL database)
   ```bash
   # macOS: Download Docker Desktop from docker.com
   # Linux: Install via package manager
   # Windows: Download Docker Desktop from docker.com
   ```

3. **Ollama** (for local AI)
   ```bash
   # macOS
   brew install ollama

   # Linux
   curl -fsSL https://ollama.com/install.sh | sh

   # Windows: Download from https://ollama.com/download
   ```

4. **Whisper** (for speech-to-text)
   ```bash
   # macOS (recommended: whisper.cpp)
   brew install whisper-cpp

   # Linux: Build from source
   # https://github.com/ggerganov/whisper.cpp

   # Alternative: Python whisper (slower, requires more RAM)
   pip install openai-whisper
   ```

   **Important:** After installing whisper.cpp, you need to download a model:
   ```bash
   # Create models directory
   mkdir -p models

   # Download a model (base is recommended for balance of speed/accuracy)
   # Options: tiny, base, small, medium, large
   curl -L -o models/ggml-base.bin \
     https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin
   ```

   Find your whisper executable path:
   ```bash
   # macOS with Homebrew
   which whisper-cli  # Usually /opt/homebrew/bin/whisper-cli

   # If using Python whisper
   which whisper      # Usually /usr/local/bin/whisper
   ```

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up PostgreSQL & Redis (Required for auth)

```bash
# Using Docker (recommended)
docker compose up -d

# Initialize database
pnpm db:migrate
```

This will start both PostgreSQL (for user data) and Redis (for sessions). See [SETUP-DB.md](./SETUP-DB.md) for detailed instructions and alternatives.

### 3. Set Up Ollama

```bash
# Pull the language model (this may take a few minutes)
ollama pull llama3.1:8b

# Start Ollama server (keep this running)
ollama serve
```

### 4. Configure Environment

Create or update your `.env.local` file:

```bash
# Database & Cache
POSTGRES_URL=postgresql://languagecoach:local_dev_password@localhost:5432/languagecoach
REDIS_URL=redis://localhost:6379

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# Whisper - IMPORTANT: Update these paths for your system!
# For whisper.cpp: Use full path to the model file
WHISPER_MODEL=/path/to/your/project/models/ggml-base.bin
WHISPER_EXECUTABLE_PATH=/opt/homebrew/bin/whisper-cli

# For Python whisper: Use model name instead
# WHISPER_MODEL=base
# WHISPER_EXECUTABLE_PATH=/usr/local/bin/whisper

# Auth Secret (generate your own or use this for local dev)
AUTH_SECRET="your-secret-key-here"
```

**⚠️ Important:** You MUST update the Whisper configuration:
- `WHISPER_MODEL`: Full path to your downloaded `.bin` model file (whisper.cpp) or model name (Python)
- `WHISPER_EXECUTABLE_PATH`: Result of `which whisper-cli` or `which whisper`

### 5. Run the Application

```bash
pnpm dev
```

Open [http://localhost:3000/coach](http://localhost:3000/coach) in your browser.

## Usage

### Starting a Conversation

1. **Free Conversation**: Go to `/coach` for free-form conversation
2. **Scenario Practice**: Click "Scenarios" button to choose a role-play scenario

### Selecting Your Target Language

Click the language selector (🌍) in the top right corner to choose:
- 🇬🇧 **English** - Practice English
- 🇫🇷 **Français** - Practice French
- 🇪🇸 **Español** - Practice Spanish

The AI will respond in your selected language and provide feedback tailored to that language.

### Using Voice Input

1. Click the microphone button (🎤)
2. Allow microphone access when prompted
3. Speak in your target language
4. Click stop when finished
5. Review the transcription in the input field
6. Press send to submit your message

### Text-to-Speech

Click the volume button (🔊) to enable/disable text-to-speech:
- When enabled: AI responses are automatically spoken aloud
- The voice automatically adapts to your selected language
- Uses the best available voice on your system

See [TTS-UPGRADE.md](./docs/TTS-UPGRADE.md) for instructions on installing higher-quality voices.

### Understanding Feedback

Messages are automatically analyzed with issues highlighted:

- 🔴 **Red (Error)**: Grammar mistakes to fix
- 🟡 **Yellow (Warning)**: Correct but not idiomatic
- 🔵 **Blue (Suggestion)**: Style improvements

Click highlighted text to see detailed explanations. The feedback panel on the right shows your overall score and all corrections.

## Available Scenarios

1. **Engineering Manager Interview** - Practice leadership questions
2. **Business Presentation** - Present to stakeholders
3. **Casual Coffee Chat** - Informal conversation practice
4. **Client Negotiation** - Practice negotiation skills
5. **Explain Tech to Non-Technical** - Simplify complex concepts

## Troubleshooting

### Database Connection Issues
```bash
# Check if containers are running
docker compose ps

# View logs
docker compose logs postgres
docker compose logs redis

# Restart services
docker compose restart
```

### Ollama Not Responding
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start if needed
ollama serve
```

### Microphone Issues
1. Check browser permissions
2. Ensure HTTPS or localhost
3. Refresh and allow access

### Whisper Issues

**Error: "Transcription failed" or 500 error**
```bash
# 1. Check if whisper is installed
which whisper-cli  # or: which whisper

# 2. Verify the model file exists
ls -la models/ggml-base.bin

# 3. Test whisper manually
echo "Hello world" | whisper-cli -m models/ggml-base.bin -f -

# 4. Check your .env.local has correct paths:
# - WHISPER_MODEL must be FULL path to .bin file
# - WHISPER_EXECUTABLE_PATH must be result of 'which whisper-cli'
```

**Model file not found**
```bash
# Download the model
curl -L -o models/ggml-base.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin
```

**Supported audio formats**: WAV, MP3, OGG, FLAC (not WebM)

## System Requirements

- **RAM**: 16GB recommended (8GB minimum)
- **Disk**: ~10GB for models
- **Browser**: Chrome, Edge, Safari (with microphone access)
- **OS**: macOS, Linux, Windows (with WSL2 for best experience)

### Whisper Model Sizes

| Model | Size | RAM | Speed | Accuracy | Best For |
|-------|------|-----|-------|----------|----------|
| tiny | 75 MB | ~1 GB | Fastest | Lower | Quick testing |
| base | 142 MB | ~1 GB | Fast | Good | **Recommended** |
| small | 466 MB | ~2 GB | Medium | Better | Better accuracy |
| medium | 1.5 GB | ~5 GB | Slow | High | High accuracy |
| large | 3 GB | ~10 GB | Slowest | Best | Maximum accuracy |

Download models from: https://huggingface.co/ggerganov/whisper.cpp/tree/main

## License

MIT
