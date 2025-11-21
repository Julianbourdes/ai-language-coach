# Améliorer la qualité TTS

Ce document explique comment améliorer la qualité de la synthèse vocale (TTS) dans AI Language Coach.

## Solution 1 : Optimisation Web Speech API (✅ Déjà implémenté)

Le système sélectionne maintenant automatiquement les **meilleures voix disponibles** dans votre navigateur :
- Voix premium/neural (Google, Microsoft)
- Voix locales pour meilleures performances
- Paramètres audio optimisés

### Comment obtenir de meilleures voix natives ?

#### macOS
Les voix Apple sont de haute qualité. Pour les installer :

1. **Ouvrir** : Préférences Système → Accessibilité → Contenu énoncé
2. **Cliquer** sur "Voix système..."
3. **Télécharger** les voix Enhanced/Premium pour chaque langue :
   - **Anglais (US)** : Samantha (Enhanced), Alex (Enhanced)
   - **Français** : Thomas (Enhanced), Audrey (Enhanced)
   - **Espagnol** : Monica (Enhanced), Paulina (Enhanced)

Ces voix sont nettement plus naturelles que les versions par défaut.

#### Windows
Windows 10/11 inclut des voix neurales Microsoft :

1. **Ouvrir** : Paramètres → Heure et langue → Voix
2. **Télécharger** les voix pour vos langues
3. Les voix neurales (comme "Microsoft Jenny Online") sont de haute qualité

#### Linux
Ubuntu/Debian avec `speech-dispatcher` :
```bash
sudo apt-get install speech-dispatcher espeak-ng
```

Pour de meilleures voix :
```bash
# Festival (bonne qualité)
sudo apt-get install festival festvox-us-slt-hts

# eSpeak-NG avec MBROLA (meilleure qualité)
sudo apt-get install espeak-ng mbrola mbrola-en1 mbrola-fr1 mbrola-es1
```

## Solution 2 : Piper TTS Local (Qualité supérieure - Local & Private)

**Piper** est un moteur TTS local open-source avec des voix **neurales de très haute qualité**, respectant la philosophie "privacy-first" du projet.

### Avantages
- ✅ Voix neurales très naturelles
- ✅ 100% local - aucune donnée envoyée
- ✅ Gratuit et open source
- ✅ Support EN/FR/ES avec plusieurs voix
- ✅ Rapide (optimisé pour CPU)

### Installation

#### Option 1 : Avec Homebrew (macOS/Linux)
```bash
# Installation de Piper
brew install piper-tts

# Télécharger les modèles de voix
mkdir -p ~/.local/share/piper/models

# Anglais (US) - Voix féminine naturelle
curl -LO https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx
curl -LO https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json

# Français - Voix masculine naturelle
curl -LO https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx
curl -LO https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx.json

# Espagnol - Voix féminine naturelle
curl -LO https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_ES/carlfm/x_low/es_ES-carlfm-x_low.onnx
curl -LO https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_ES/carlfm/x_low/es_ES-carlfm-x_low.onnx.json

# Déplacer dans le dossier models
mv *.onnx* ~/.local/share/piper/models/
```

#### Option 2 : Build depuis les sources
```bash
git clone https://github.com/rhasspy/piper.git
cd piper/src/cpp
make
```

### Tester Piper

```bash
# Test Anglais
echo "Hello! This is a test of the Piper text to speech system." | \
  piper --model ~/.local/share/piper/models/en_US-lessac-medium.onnx \
  --output_file test_en.wav

# Test Français
echo "Bonjour ! Ceci est un test du système de synthèse vocale Piper." | \
  piper --model ~/.local/share/piper/models/fr_FR-siwis-medium.onnx \
  --output_file test_fr.wav

# Écouter
afplay test_en.wav  # macOS
aplay test_en.wav   # Linux
```

### Intégration dans l'application

Pour intégrer Piper dans l'application, il faut créer une route API :

```bash
# Créer le dossier API
mkdir -p app/api/tts
```

Créer `app/api/tts/route.ts` :
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile } from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

const PIPER_EXECUTABLE = process.env.PIPER_EXECUTABLE || 'piper';
const MODELS_PATH = process.env.PIPER_MODELS_PATH ||
  path.join(os.homedir(), '.local', 'share', 'piper', 'models');

const VOICE_MODELS = {
  'en': 'en_US-lessac-medium.onnx',
  'fr': 'fr_FR-siwis-medium.onnx',
  'es': 'es_ES-carlfm-x_low.onnx',
};

export async function POST(request: NextRequest) {
  try {
    const { text, language = 'en' } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    const model = VOICE_MODELS[language as keyof typeof VOICE_MODELS];
    if (!model) {
      return NextResponse.json(
        { error: `Unsupported language: ${language}` },
        { status: 400 }
      );
    }

    const modelPath = path.join(MODELS_PATH, model);
    const outputFile = path.join(os.tmpdir(), `tts-${Date.now()}.wav`);
    const inputFile = path.join(os.tmpdir(), `tts-input-${Date.now()}.txt`);

    try {
      // Write text to file
      await writeFile(inputFile, text, 'utf-8');

      // Run Piper
      await execAsync(
        `cat "${inputFile}" | ${PIPER_EXECUTABLE} --model "${modelPath}" --output_file "${outputFile}"`,
        { timeout: 30000 }
      );

      // Read audio file
      const audioBuffer = await readFile(outputFile);

      // Clean up
      await Promise.all([
        unlink(inputFile).catch(() => {}),
        unlink(outputFile).catch(() => {}),
      ]);

      // Return audio
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/wav',
          'Content-Length': audioBuffer.length.toString(),
        },
      });
    } catch (error) {
      // Clean up on error
      await Promise.all([
        unlink(inputFile).catch(() => {}),
        unlink(outputFile).catch(() => {}),
      ]);
      throw error;
    }
  } catch (error) {
    console.error('Piper TTS error:', error);
    return NextResponse.json(
      {
        error: 'TTS generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

Ajouter dans `.env.local` :
```bash
PIPER_EXECUTABLE=piper
PIPER_MODELS_PATH=/Users/VOTRE_USERNAME/.local/share/piper/models
```

Mettre à jour `components/language-coach-chat.tsx` pour utiliser Piper si disponible :
```typescript
// Check if Piper is available
const [piperAvailable, setPiperAvailable] = useState(false);

useEffect(() => {
  const checkPiper = async () => {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'test', language: 'en' }),
      });
      setPiperAvailable(response.ok);
    } catch {
      setPiperAvailable(false);
    }
  };
  checkPiper();
}, []);

// Use Piper if available, fallback to Web Speech
if (textContent.trim()) {
  if (piperAvailable) {
    // Use Piper TTS
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: textContent,
        language: targetLanguage,
      }),
    });

    if (response.ok) {
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => URL.revokeObjectURL(audioUrl);
    }
  } else {
    // Fallback to Web Speech API (current implementation)
    const utterance = new SpeechSynthesisUtterance(textContent);
    // ... existing code
  }
}
```

## Comparaison

| Solution | Qualité | Confidentialité | Setup | Coût |
|----------|---------|----------------|-------|------|
| Web Speech (défaut) | ⭐⭐⭐ | ✅ Local | Aucun | Gratuit |
| Web Speech + Voix Premium | ⭐⭐⭐⭐ | ✅ Local | 5 min | Gratuit |
| Piper TTS | ⭐⭐⭐⭐⭐ | ✅ Local | 15 min | Gratuit |
| OpenAI TTS | ⭐⭐⭐⭐⭐ | ❌ Cloud | 5 min | ~$15/1M chars |
| ElevenLabs | ⭐⭐⭐⭐⭐ | ❌ Cloud | 5 min | ~$30/30K chars |

## Recommandation

**Pour la plupart des utilisateurs** : Les voix Web Speech améliorées (Solution 1) offrent un excellent compromis qualité/simplicité.

**Pour une qualité maximale en local** : Piper TTS (Solution 2) offre des voix neurales exceptionnelles tout en respectant la philosophie privacy-first.

**À éviter** : Les API cloud (OpenAI, ElevenLabs) sacrifient la confidentialité et ajoutent des coûts récurrents.

## Ressources

- [Piper TTS](https://github.com/rhasspy/piper)
- [Catalogue de voix Piper](https://huggingface.co/rhasspy/piper-voices)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
