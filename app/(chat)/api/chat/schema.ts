import { z } from "zod";

const textPartSchema = z.object({
  type: z.enum(["text"]),
  text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
  type: z.enum(["file"]),
  mediaType: z.enum(["image/jpeg", "image/png"]),
  name: z.string().min(1).max(100),
  url: z.string().url(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

// Language Coach: Scenario data schema
const scenarioDataSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    category: z.string(),
    difficulty: z.string(),
    aiRole: z.string(),
    systemPrompt: z.string(),
    suggestedDuration: z.number(),
    focusAreas: z.array(z.string()),
    icon: z.string(),
    tags: z.array(z.string()),
  })
  .nullable()
  .optional();

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  message: z.object({
    id: z.string().uuid(),
    role: z.enum(["user"]),
    parts: z.array(partSchema),
  }),
  selectedChatModel: z.enum(["chat-model", "chat-model-reasoning"]),
  selectedVisibilityType: z.enum(["public", "private"]),
  // Language Coach fields
  targetLanguage: z.enum(["en", "fr", "es"]).nullable().optional(),
  scenarioId: z.string().nullable().optional(),
  scenarioData: scenarioDataSchema,
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
