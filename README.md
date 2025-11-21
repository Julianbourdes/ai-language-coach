# AI Language Coach

An AI-powered language learning application that helps French speakers practice English conversation with real-time feedback and role-play scenarios.

## Features

- 🎤 **Voice Recording**: Practice speaking English with automatic speech-to-text transcription
- 💬 **AI Conversation**: Chat with a supportive AI language coach powered by Ollama
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
   # macOS
   brew install whisper-cpp

   # Linux: Build from source
   # https://github.com/ggerganov/whisper.cpp

   # Or use Python whisper
   pip install openai-whisper
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

The `.env.local` file is already configured with defaults:

```
# Database & Cache
POSTGRES_URL=postgresql://languagecoach:local_dev_password@localhost:5432/languagecoach
REDIS_URL=redis://localhost:6379

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# Whisper
WHISPER_MODEL=small
WHISPER_EXECUTABLE_PATH=/usr/local/bin/whisper
```

Update the `WHISPER_EXECUTABLE_PATH` if needed based on your installation.

### 5. Run the Application

```bash
pnpm dev
```

Open [http://localhost:3000/coach](http://localhost:3000/coach) in your browser.

## Usage

### Starting a Conversation

1. **Free Conversation**: Go to `/coach` for free-form conversation
2. **Scenario Practice**: Go to `/scenarios` to choose a role-play scenario

### Using Voice Input

1. Click the microphone button
2. Allow microphone access when prompted
3. Speak in English
4. Click stop when finished
5. Your speech will be transcribed and analyzed

### Understanding Feedback

Messages are automatically analyzed with issues highlighted:

- 🔴 **Red (Error)**: Grammar mistakes to fix
- 🟡 **Yellow (Warning)**: Correct but not idiomatic
- 🔵 **Blue (Suggestion)**: Style improvements

Click highlighted text to see detailed explanations.

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
```bash
# Test installation
whisper --version

# Update path in .env.local if needed
```

## System Requirements

- **RAM**: 16GB recommended (8GB minimum)
- **Disk**: ~10GB for models
- **Browser**: Chrome, Edge, Safari

## License

MIT
