# CLAUDE.md - AI Language Coach Developer Guide

Ce document guide les développeurs IA (et humains) travaillant sur le projet AI Language Coach.

## Vue d'ensemble du projet

**AI Language Coach** est une application de coaching linguistique pour aider les francophones à pratiquer l'anglais oral. L'application utilise l'IA locale (Ollama + Whisper) pour garantir la confidentialité totale des utilisateurs.

### Philosophie du projet

- **Local-first**: Tout fonctionne en local, aucune donnée n'est envoyée à des serveurs externes
- **Privacy-first**: Les conversations restent sur la machine de l'utilisateur
- **Encouraging**: L'IA est toujours encourageante, jamais condescendante
- **Progressive**: Focus sur 2-3 corrections principales plutôt que surcharger l'utilisateur

## Architecture

### Stack technique

```
Frontend:
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui components

Backend/AI:
- Ollama (llama3.1:8b) via ollama-ai-provider
- Vercel AI SDK pour le streaming
- Whisper pour speech-to-text
- Zustand pour le state management

Audio:
- RecordRTC pour la capture audio
- Web Audio API
```

### Structure du projet

```
ai-language-coach/
├── app/
│   ├── api/                    # API Routes
│   │   ├── transcribe/         # POST: audio → text (Whisper)
│   │   ├── ollama/             # POST: chat avec streaming
│   │   └── feedback/           # POST: analyse de texte
│   ├── coach/                  # Page principale (/coach)
│   └── scenarios/              # Sélection de scénarios (/scenarios)
│
├── components/
│   ├── voice/
│   │   └── voice-recorder.tsx  # Capture audio + transcription
│   ├── feedback/
│   │   ├── highlight-text.tsx  # Affichage texte avec highlights
│   │   ├── correction-tooltip.tsx  # Tooltip détails correction
│   │   └── feedback-panel.tsx  # Panneau récapitulatif
│   ├── scenarios/
│   │   └── scenario-card.tsx   # Card pour un scénario
│   └── language-coach-chat.tsx # Interface principale
│
├── lib/
│   ├── ollama/
│   │   ├── client.ts           # Configuration Ollama + provider
│   │   └── prompts.ts          # Prompts système
│   ├── whisper/
│   │   ├── client.ts           # Client Whisper
│   │   └── audio-processor.ts  # Utilitaires audio
│   └── store/
│       ├── conversation-store.ts  # State conversations
│       └── scenario-store.ts      # State scénarios
│
├── types/
│   ├── conversation.ts         # Message, Conversation, Stats
│   ├── feedback.ts             # Feedback, FeedbackRequest/Response
│   └── scenario.ts             # Scenario
│
└── public/
    └── scenarios/
        └── default-scenarios.json  # Définitions des scénarios
```

## Conventions de code

### TypeScript

- **Stricte**: Toujours typer explicitement les props et return types
- **Pas de `any`**: Utiliser `unknown` si vraiment nécessaire
- **Types centralisés**: Tous les types dans `/types`

```typescript
// ✅ Bon
interface Props {
  onSubmit: (text: string) => Promise<void>;
  disabled?: boolean;
}

// ❌ Éviter
interface Props {
  onSubmit: any;
  disabled: boolean | undefined;
}
```

### Composants React

- **'use client'**: Obligatoire pour composants avec hooks/interactivité
- **Props explicites**: Interface dédiée pour chaque composant
- **Pas de barrel exports**: Import direct des composants

```typescript
// ✅ Bon
'use client';

interface VoiceRecorderProps {
  onTranscription: (text: string, audioUrl?: string) => void;
  onError?: (error: string) => void;
}

export function VoiceRecorder({ onTranscription, onError }: VoiceRecorderProps) {
  // ...
}

// ❌ Éviter
export default function VoiceRecorder(props: any) {
  // ...
}
```

### State Management

Utiliser Zustand pour le state global:

```typescript
// Pattern standard
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MyState {
  // State
  data: Data[];

  // Actions
  addData: (item: Data) => void;
  removeData: (id: string) => void;
}

export const useMyStore = create<MyState>()(
  persist(
    (set, get) => ({
      data: [],

      addData: (item) => {
        const { data } = get();
        set({ data: [...data, item] });
      },

      removeData: (id) => {
        const { data } = get();
        set({ data: data.filter(d => d.id !== id) });
      },
    }),
    {
      name: 'my-storage',
      // Ne persister que ce qui est nécessaire
      partialize: (state) => ({ data: state.data }),
    }
  )
);
```

## Modifications courantes

### Ajouter un nouveau scénario

**1. Éditer** `public/scenarios/default-scenarios.json`:

```json
{
  "id": "mon-scenario",
  "title": "Mon Nouveau Scénario",
  "description": "Description courte et claire",
  "category": "business",
  "difficulty": "intermediate",
  "aiRole": "Rôle que l'IA doit jouer",
  "systemPrompt": "Instructions détaillées pour l'IA...",
  "suggestedDuration": 15,
  "focusAreas": ["focus1", "focus2"],
  "icon": "🎯",
  "tags": ["tag1", "tag2"]
}
```

**2. Conventions:**
- `id`: kebab-case, unique, descriptif
- `systemPrompt`: Instructions claires sur le comportement de l'IA
- `focusAreas`: Ce sur quoi l'utilisateur doit se concentrer
- `icon`: Un seul emoji représentatif

### Modifier les prompts système

**Fichier:** `lib/ollama/prompts.ts`

**Prompts disponibles:**

1. **`languageCoachPrompt`** - Conversation générale
   - Doit rester encourageant et naturel
   - Ne PAS corriger directement dans la conversation
   - L'analyse se fait séparément

2. **`feedbackAnalyzerPrompt`** - Analyse pour corrections
   - Doit retourner du JSON valide
   - Format strict pour parsing
   - Prioriser les erreurs importantes

3. **`generateRolePlayPrompt(scenario)`** - Génère prompt selon scénario
   - Combine `languageCoachPrompt` + instructions du scénario
   - Maintient le contexte du rôle

**⚠️ Important:** Les prompts affectent directement la qualité de l'expérience. Tester minutieusement après modification.

### Ajouter un nouveau type de feedback

**1. Mettre à jour le type** dans `types/feedback.ts`:

```typescript
export type FeedbackType = 'grammar' | 'vocabulary' | 'style' | 'pronunciation'; // Ajouter ici
```

**2. Mettre à jour** `feedbackAnalyzerPrompt` dans `lib/ollama/prompts.ts`:

```typescript
Focus on:
1. Grammar errors
2. Vocabulary issues
3. Style improvements
4. Pronunciation tips // Ajouter dans la liste
```

**3. Ajouter l'icône** dans `components/feedback/correction-tooltip.tsx`:

```typescript
function getIconForType(type: string) {
  switch (type) {
    case 'grammar':
      return AlertCircle;
    case 'vocabulary':
      return AlertTriangle;
    case 'style':
      return Lightbulb;
    case 'pronunciation':
      return Volume2; // Nouveau
    default:
      return AlertCircle;
  }
}
```

### Changer le modèle Ollama

**1. Tirer le nouveau modèle:**
```bash
ollama pull nom-du-modele
```

**2. Mettre à jour** `.env.local`:
```
OLLAMA_MODEL=nom-du-modele
```

**3. Considérations:**
- Modèles plus petits = plus rapide, moins précis
- Modèles plus grands = plus lent, meilleur feedback
- Vérifier RAM disponible (llama3.1:8b ≈ 6GB)

### Modifier l'interface de chat

**Fichier principal:** `components/language-coach-chat.tsx`

Ce composant orchestre:
- `VoiceRecorder` - Capture audio
- `HighlightText` - Affichage avec feedback
- `FeedbackPanel` - Récapitulatif
- `useChat` hook - Streaming AI

**Pattern de données:**

```typescript
// Message utilisateur
{
  role: 'user',
  content: 'texte transcrit ou tapé'
}

// Récupérer feedback
const response = await fetch('/api/feedback', {
  method: 'POST',
  body: JSON.stringify({ text: userMessage })
});

// Stocker feedback pour affichage
setCurrentFeedback({
  messageId: message.id,
  feedback: data.corrections,
  score: data.overallScore
});
```

## API Routes

### POST /api/transcribe

**Input:** FormData avec fichier audio
**Output:** `{ transcription: string, timestamp: string }`

**Limites:**
- Max 10MB par fichier
- Formats: wav, webm, ogg, mp3, mp4
- Timeout: 30 secondes

**Gestion d'erreurs:**
- 400: Fichier manquant ou invalide
- 500: Erreur Whisper (service down, format non supporté)

### POST /api/ollama

**Input:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "scenario": { /* Scenario object */ }
}
```

**Output:** Stream de texte via `toDataStreamResponse()`

**Configuration:**
- Temperature: 0.7 (équilibre créativité/cohérence)
- MaxTokens: 1000 (performance)
- Contexte: 10 derniers messages max

### POST /api/feedback

**Input:**
```json
{
  "text": "texte à analyser",
  "context": "scenario title (optionnel)",
  "userLevel": "intermediate"
}
```

**Output:**
```json
{
  "original": "texte original",
  "corrections": [
    {
      "id": "abc123",
      "type": "grammar",
      "severity": "error",
      "original": "I go yesterday",
      "suggestion": "I went yesterday",
      "explanation": "Use past tense for past actions",
      "startIndex": 0,
      "endIndex": 13
    }
  ],
  "overallScore": 85,
  "summary": "Good! A few improvements suggested."
}
```

## Patterns importants

### Gestion audio avec RecordRTC

```typescript
// Créer recorder
const recorder = new RecordRTC(stream, {
  type: 'audio',
  mimeType: 'audio/webm',
  recorderType: RecordRTC.StereoAudioRecorder,
  numberOfAudioChannels: 1,
  desiredSampRate: 16000, // Whisper préfère 16kHz
});

// Démarrer
recorder.startRecording();

// Arrêter et récupérer
recorder.stopRecording(() => {
  const blob = recorder.getBlob();
  // Envoyer à /api/transcribe
});

// ⚠️ Important: Toujours nettoyer
stream.getTracks().forEach(track => track.stop());
```

### Streaming avec Vercel AI SDK

```typescript
// Server-side (API route)
import { streamText } from 'ai';
import { languageModel } from '@/lib/ollama/client';

const result = streamText({
  model: languageModel,
  messages: [...messages],
  temperature: 0.7,
});

return result.toDataStreamResponse();

// Client-side
import { useChat } from 'ai/react';

const { messages, append, isLoading } = useChat({
  api: '/api/ollama',
  onError: (error) => {
    toast.error('Error: ' + error.message);
  },
});
```

### Highlighting avec feedback

```typescript
// Créer des segments de texte
function createTextSegments(text: string, feedback: Feedback[]) {
  const sorted = [...feedback].sort((a, b) => a.startIndex - b.startIndex);

  const segments = [];
  let currentIndex = 0;

  for (const fb of sorted) {
    // Texte avant
    if (currentIndex < fb.startIndex) {
      segments.push({ text: text.slice(currentIndex, fb.startIndex) });
    }

    // Texte avec feedback
    segments.push({
      text: text.slice(fb.startIndex, fb.endIndex),
      feedback: fb
    });

    currentIndex = fb.endIndex;
  }

  // Texte restant
  if (currentIndex < text.length) {
    segments.push({ text: text.slice(currentIndex) });
  }

  return segments;
}
```

## Pièges à éviter

### ❌ Ne pas faire

1. **Modifier le contexte de conversation sans limite**
   - Garder max 10 messages pour performance
   - Plus = plus lent et plus de RAM

2. **Oublier de nettoyer les ressources audio**
   ```typescript
   // ❌ Mauvais
   recorder.stopRecording(() => {
     const blob = recorder.getBlob();
   });

   // ✅ Bon
   recorder.stopRecording(() => {
     const blob = recorder.getBlob();
     stream.getTracks().forEach(track => track.stop());
   });
   ```

3. **Parser JSON sans try/catch**
   ```typescript
   // ❌ Mauvais
   const corrections = JSON.parse(result.text);

   // ✅ Bon
   try {
     const corrections = JSON.parse(result.text);
   } catch (error) {
     console.error('Failed to parse:', result.text);
     return [];
   }
   ```

4. **Ignorer les erreurs Ollama/Whisper**
   - Toujours vérifier que les services sont en ligne
   - Fournir des messages d'erreur clairs pour l'utilisateur

5. **Envoyer tout le feedback à l'utilisateur**
   - Prioriser: errors > warnings > suggestions
   - Max 5 corrections par message idéalement

### ✅ Bonnes pratiques

1. **Tester les services au démarrage**
   ```typescript
   useEffect(() => {
     const checkServices = async () => {
       const ollamaOk = await fetch('/api/ollama').then(r => r.ok);
       const whisperOk = await fetch('/api/transcribe').then(r => r.ok);

       if (!ollamaOk) toast.error('Ollama not available');
       if (!whisperOk) toast.error('Whisper not available');
     };

     checkServices();
   }, []);
   ```

2. **Debounce des appels API coûteux**
   - Pas nécessaire pour le chat (streaming)
   - Utile si on ajoute de l'auto-feedback pendant la frappe

3. **Validation des entrées utilisateur**
   ```typescript
   // Avant d'envoyer à l'API
   if (text.length > 5000) {
     toast.error('Text too long (max 5000 characters)');
     return;
   }
   ```

4. **Gestion des permissions microphone**
   ```typescript
   try {
     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
   } catch (error) {
     if (error.name === 'NotAllowedError') {
       toast.error('Microphone access denied');
     } else if (error.name === 'NotFoundError') {
       toast.error('No microphone found');
     }
   }
   ```

## Performance

### Optimisations actuelles

1. **Contexte limité**: 10 messages max envoyés à Ollama
2. **Token limit**: 1000 tokens max par réponse
3. **Streaming**: Réponses streamées pour UX responsive
4. **Cleanup**: Fichiers audio temporaires supprimés immédiatement
5. **Persistence sélective**: Seules les conversations sauvées en localStorage

### Métriques à surveiller

- **Temps de transcription**: < 5s pour 30s d'audio
- **Temps première réponse**: < 2s après envoi message
- **Mémoire**: < 8GB utilisés au total
- **Latence streaming**: Tokens doivent apparaître progressivement

### Si performance dégradée

1. Réduire le contexte (de 10 à 5 messages)
2. Utiliser un modèle plus petit (llama3.1:7b)
3. Réduire maxTokens (de 1000 à 500)
4. Vider le cache Ollama: `ollama rm model && ollama pull model`

## Testing

### Test manuel recommandé

**Workflow de test complet:**

1. **Services**
   - [ ] Ollama running: `curl http://localhost:11434/api/tags`
   - [ ] Whisper accessible: `whisper --version`

2. **Page /coach**
   - [ ] Affichage correct du message de bienvenue
   - [ ] Bouton micro visible et cliquable
   - [ ] Input texte fonctionnel

3. **Voice recording**
   - [ ] Click micro → animation recording
   - [ ] Permission microphone demandée
   - [ ] Recording → Transcribing → Message apparaît
   - [ ] Audio transcrit correctement

4. **AI response**
   - [ ] Réponse apparaît progressivement (streaming)
   - [ ] Ton encourageant et naturel
   - [ ] Contextuel (si scénario sélectionné)

5. **Feedback**
   - [ ] Mots/phrases surlignés en couleur
   - [ ] Click → tooltip avec détails
   - [ ] Panneau récapitulatif affiche score

6. **Page /scenarios**
   - [ ] Cards affichées correctement
   - [ ] Sélection → redirection vers /coach
   - [ ] Scénario actif affiché dans header

### Tests unitaires (à ajouter)

```typescript
// Exemple: tests pour createTextSegments
describe('createTextSegments', () => {
  it('should create segments with feedback', () => {
    const text = "I go to store";
    const feedback = [{
      startIndex: 2,
      endIndex: 4,
      type: 'grammar',
      // ...
    }];

    const segments = createTextSegments(text, feedback);

    expect(segments).toHaveLength(3);
    expect(segments[1].feedback).toBeDefined();
  });
});
```

## Déploiement

### Considérations

Le projet est conçu pour fonctionner **localement uniquement**. Un déploiement classique ne fonctionnera pas car:

- Ollama doit tourner localement ou sur un serveur accessible
- Whisper nécessite accès aux binaires système
- Microphone nécessite HTTPS ou localhost

### Options de déploiement

**Option 1: Docker local**
- Packager Ollama + Whisper + App dans un container
- L'utilisateur lance le container localement
- Accès via `localhost:3000`

**Option 2: Electron app**
- Distribuer comme app desktop
- Inclure Ollama et Whisper
- Installation simplifiée pour utilisateurs

**Option 3: Cloud hybride** (⚠️ perd privacy-first)
- Frontend sur Vercel
- Ollama sur serveur GPU dédié
- Whisper via API (OpenAI, AssemblyAI...)

## Dépendances critiques

### Versions à maintenir

```json
{
  "next": "15.3.0-canary.31",      // App Router stable
  "react": "19.0.0-rc",             // Concurrent features
  "ai": "5.0.26",                   // Vercel AI SDK
  "ollama-ai-provider": "1.2.0",   // Provider Ollama
  "zustand": "5.0.8",               // State management
  "recordrtc": "5.6.2"              // Audio recording
}
```

### Migration à surveiller

- **React 19 RC → Stable**: Mettre à jour quand disponible
- **Next.js**: Suivre les canary pour fixes App Router
- **Vercel AI SDK**: API en évolution rapide

## Support et ressources

### Documentation externe

- [Vercel AI SDK](https://sdk.vercel.ai/)
- [Ollama](https://ollama.com/)
- [Whisper](https://github.com/openai/whisper)
- [RecordRTC](https://recordrtc.org/)
- [Zustand](https://zustand.docs.pmnd.rs/)

### Fichiers clés à connaître

1. **`lib/ollama/prompts.ts`** - Tous les prompts système
2. **`components/language-coach-chat.tsx`** - Orchestration principale
3. **`app/api/feedback/route.ts`** - Logique d'analyse
4. **`types/index.ts`** - Toutes les interfaces TypeScript

### Debugging

**Activer les logs détaillés:**

```typescript
// Dans lib/ollama/client.ts
export const languageModel = ollamaProvider(modelName, {
  // Ajouter pour debug
  fetch: async (url, options) => {
    console.log('Ollama request:', url, options);
    const response = await fetch(url, options);
    console.log('Ollama response:', response);
    return response;
  }
});
```

**Logs Whisper:**
- Check `console.error` dans `/api/transcribe`
- Test manuel: `whisper audio.wav --model small`

**Logs RecordRTC:**
```typescript
RecordRTC.prototype.debug = true; // Active les logs internes
```

## Conclusion

Ce projet privilégie:
- 🔒 **Privacy** - Tout local, rien ne quitte la machine
- 💪 **Encouragement** - Feedback constructif, jamais décourageant
- 🎯 **Focus** - 2-3 corrections importantes plutôt que tout
- ⚡ **Performance** - Optimisé pour M1 Pro 16GB

Avant toute modification majeure, considérer l'impact sur ces principes fondamentaux.

---

**Questions?** Consultez le README.md pour le setup ou ouvrez une issue.
