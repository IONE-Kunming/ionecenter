# Gemma Translator API Integration Guide

This guide documents how to connect the **Gemma Translator API** with IONE Center for multilingual content translation.

## Overview

[Gemma](https://ai.google.dev/gemma) is a family of open-source large language models from Google. When used as a translator, Gemma can translate product descriptions, category names, and UI content between the languages IONE Center supports (English, Arabic, Chinese, Urdu).

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Architecture](#2-architecture)
3. [Setting Up the Gemma Model](#3-setting-up-the-gemma-model)
4. [API Route Implementation](#4-api-route-implementation)
5. [Translation Utility](#5-translation-utility)
6. [Frontend Integration](#6-frontend-integration)
7. [Environment Variables](#7-environment-variables)
8. [Usage Examples](#8-usage-examples)
9. [Error Handling & Fallbacks](#9-error-handling--fallbacks)
10. [Performance Considerations](#10-performance-considerations)

---

## 1. Prerequisites

- **Node.js 18+** and **Next.js 16+** (already present in the project)
- A running Gemma model instance. Options include:
  - **Google AI Studio** — hosted API via `@google/generative-ai` SDK
  - **Ollama** — self-hosted, run `ollama pull gemma2` locally
  - **Hugging Face Inference API** — hosted inference endpoint
  - **Custom deployment** — deploy Gemma on your own GPU server

---

## 2. Architecture

```
┌─────────────────────────┐
│   Frontend (React)      │
│   useTranslation hook   │
│   or translate button   │
└──────────┬──────────────┘
           │ POST /api/translate
           ▼
┌─────────────────────────┐
│   Next.js API Route     │
│   app/api/translate/    │
│   route.ts              │
└──────────┬──────────────┘
           │ HTTP request
           ▼
┌─────────────────────────┐
│   Gemma Model           │
│   (Ollama / Google AI / │
│    HuggingFace / Custom)│
└─────────────────────────┘
```

The translation flow:
1. Frontend sends text + target language to the API route
2. API route forwards to the Gemma model with a translation prompt
3. Gemma returns translated text
4. API route responds with the translation
5. Optionally, translations are cached in the database

---

## 3. Setting Up the Gemma Model

### Option A: Ollama (Self-Hosted, Recommended for Development)

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull the Gemma 2 model
ollama pull gemma2

# Verify it's running
ollama list
```

Set the following in `.env.local`:

```env
GEMMA_PROVIDER=ollama
GEMMA_API_URL=http://localhost:11434/api/generate
```

### Option B: Google AI Studio (Hosted)

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. Install the SDK:

```bash
npm install @google/generative-ai
```

Set the following in `.env.local`:

```env
GEMMA_PROVIDER=google
GOOGLE_AI_API_KEY=your-api-key-here
```

### Option C: Hugging Face Inference API

1. Get an API token from [Hugging Face](https://huggingface.co/settings/tokens)
2. Use the `google/gemma-2-9b-it` model endpoint

```env
GEMMA_PROVIDER=huggingface
HUGGINGFACE_API_TOKEN=hf_your_token_here
GEMMA_MODEL=google/gemma-2-9b-it
```

---

## 4. API Route Implementation

Create the file `app/api/translate/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"

const PROVIDER = process.env.GEMMA_PROVIDER || "ollama"
const OLLAMA_URL = process.env.GEMMA_API_URL || "http://localhost:11434/api/generate"
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_API_KEY || ""
const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN || ""
const GEMMA_MODEL = process.env.GEMMA_MODEL || "gemma2"

const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: "English",
  ar: "Arabic",
  zh: "Chinese (Simplified)",
  ur: "Urdu",
}

async function translateWithOllama(text: string, targetLang: string): Promise<string> {
  const prompt = `Translate the following text to ${targetLang}. Only return the translated text, nothing else.\n\nText: ${text}`
  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: GEMMA_MODEL, prompt, stream: false }),
  })
  const data = await res.json()
  return data.response?.trim() || ""
}

async function translateWithGoogle(text: string, targetLang: string): Promise<string> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai")
  const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY)
  const model = genAI.getGenerativeModel({ model: "gemma-2-9b-it" })
  const prompt = `Translate the following text to ${targetLang}. Only return the translated text, nothing else.\n\nText: ${text}`
  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}

async function translateWithHuggingFace(text: string, targetLang: string): Promise<string> {
  const prompt = `Translate the following text to ${targetLang}. Only return the translated text, nothing else.\n\nText: ${text}`
  const res = await fetch(`https://api-inference.huggingface.co/models/${GEMMA_MODEL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: prompt }),
  })
  const data = await res.json()
  return Array.isArray(data) ? data[0]?.generated_text?.trim() || "" : ""
}

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage, sourceLanguage } = await request.json()

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: "Missing required fields: text, targetLanguage" },
        { status: 400 }
      )
    }

    if (!SUPPORTED_LANGUAGES[targetLanguage]) {
      return NextResponse.json(
        { error: `Unsupported language: ${targetLanguage}. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(", ")}` },
        { status: 400 }
      )
    }

    const targetLangName = SUPPORTED_LANGUAGES[targetLanguage]
    const sourceLangName = sourceLanguage ? SUPPORTED_LANGUAGES[sourceLanguage] || sourceLanguage : undefined
    const langContext = sourceLangName
      ? `from ${sourceLangName} to ${targetLangName}`
      : `to ${targetLangName}`

    let translated: string

    switch (PROVIDER) {
      case "google":
        translated = await translateWithGoogle(text, langContext)
        break
      case "huggingface":
        translated = await translateWithHuggingFace(text, langContext)
        break
      case "ollama":
      default:
        translated = await translateWithOllama(text, langContext)
        break
    }

    return NextResponse.json({ translated, source: text, targetLanguage })
  } catch (error) {
    console.error("Translation error:", error)
    return NextResponse.json(
      { error: "Translation failed. Please try again." },
      { status: 500 }
    )
  }
}
```

---

## 5. Translation Utility

Create a reusable client-side utility at `lib/translate.ts`:

```typescript
interface TranslateOptions {
  text: string
  targetLanguage: string    // "en" | "ar" | "zh" | "ur"
  sourceLanguage?: string   // optional, auto-detected if omitted
}

interface TranslateResult {
  translated: string
  source: string
  targetLanguage: string
  error?: string
}

export async function translate(options: TranslateOptions): Promise<TranslateResult> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  })

  if (!res.ok) {
    const err = await res.json()
    return { translated: "", source: options.text, targetLanguage: options.targetLanguage, error: err.error }
  }

  return res.json()
}

export async function translateBatch(
  texts: string[],
  targetLanguage: string
): Promise<TranslateResult[]> {
  return Promise.all(
    texts.map((text) => translate({ text, targetLanguage }))
  )
}
```

---

## 6. Frontend Integration

### Example: Translate Button on Product Description

```tsx
"use client"

import { useState } from "react"
import { useLocale } from "next-intl"
import { translate } from "@/lib/translate"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"

export function TranslateButton({ text, onTranslated }: {
  text: string
  onTranslated: (translated: string) => void
}) {
  const locale = useLocale()
  const [loading, setLoading] = useState(false)

  async function handleTranslate() {
    setLoading(true)
    const result = await translate({ text, targetLanguage: locale })
    if (result.translated) onTranslated(result.translated)
    setLoading(false)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleTranslate} disabled={loading}>
      <Globe className="h-4 w-4 mr-1" />
      {loading ? "Translating..." : "Translate"}
    </Button>
  )
}
```

### Example: Hook for Auto-Translation

```tsx
import { useState, useEffect } from "react"
import { useLocale } from "next-intl"
import { translate } from "@/lib/translate"

export function useTranslatedText(originalText: string) {
  const locale = useLocale()
  const [translated, setTranslated] = useState(originalText)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (locale === "en") {
      setTranslated(originalText)
      return
    }

    let cancelled = false
    setLoading(true)

    translate({ text: originalText, targetLanguage: locale }).then((result) => {
      if (!cancelled && result.translated) {
        setTranslated(result.translated)
      }
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [originalText, locale])

  return { translated, loading }
}
```

---

## 7. Environment Variables

Add the following to your `.env.local` (choose one provider):

```env
# ─── Gemma Translation Configuration ──────────────────────

# Provider: "ollama" | "google" | "huggingface"
GEMMA_PROVIDER=ollama

# Ollama settings (if using ollama)
GEMMA_API_URL=http://localhost:11434/api/generate
GEMMA_MODEL=gemma2

# Google AI Studio settings (if using google)
# GOOGLE_AI_API_KEY=your-api-key

# Hugging Face settings (if using huggingface)
# HUGGINGFACE_API_TOKEN=hf_your_token
# GEMMA_MODEL=google/gemma-2-9b-it
```

---

## 8. Usage Examples

### Translate a single text

```typescript
const result = await translate({
  text: "Premium aluminum exterior gate",
  targetLanguage: "ar"
})
// result.translated = "بوابة خارجية من الألومنيوم الممتاز"
```

### Translate product descriptions in bulk

```typescript
const descriptions = ["Heavy duty steel fence", "Glass partition system"]
const results = await translateBatch(descriptions, "zh")
// results[0].translated = "重型钢围栏"
// results[1].translated = "玻璃隔断系统"
```

### API request via cURL

```bash
curl -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Welcome to IONE Center", "targetLanguage": "ar"}'
```

Response:

```json
{
  "translated": "مرحبا بكم في مركز IONE",
  "source": "Welcome to IONE Center",
  "targetLanguage": "ar"
}
```

---

## 9. Error Handling & Fallbacks

The translation system is designed to fail gracefully:

| Scenario | Behavior |
|---|---|
| Gemma model unreachable | Returns 500 error, UI shows original text |
| Invalid target language | Returns 400 error with supported languages |
| Empty text | Returns 400 error |
| Translation timeout | Set fetch timeout (default 30s), fallback to original |
| Rate limiting | Implement exponential backoff in the client |

### Recommended: Add Translation Caching

To avoid repeated API calls for the same content, cache translations in the `site_settings` table or a dedicated `translations` table:

```sql
CREATE TABLE IF NOT EXISTS translation_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_text TEXT NOT NULL,
  target_language TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_text, target_language)
);
```

---

## 10. Performance Considerations

| Tip | Description |
|---|---|
| **Cache aggressively** | Store translations to avoid redundant calls |
| **Batch requests** | Combine multiple texts into one API call when possible |
| **Use `gemma2:2b`** | Smaller model variant for faster inference on limited hardware |
| **Pre-translate** | Translate product listings at import time, not request time |
| **Rate limit** | Add rate limiting to the `/api/translate` endpoint |
| **Queue long batches** | Use background jobs for bulk translation tasks |

---

## Quick Start Checklist

1. [ ] Choose a Gemma provider (Ollama for dev, Google AI or HuggingFace for production)
2. [ ] Set environment variables in `.env.local`
3. [ ] Create the API route at `app/api/translate/route.ts`
4. [ ] Create the client utility at `lib/translate.ts`
5. [ ] Add a translate button or hook to the desired UI components
6. [ ] (Optional) Set up translation caching
7. [ ] (Optional) Pre-translate product descriptions during bulk import

---

## Related Files

| File | Purpose |
|---|---|
| `messages/en.json` | English UI translations (static, managed by next-intl) |
| `messages/ar.json` | Arabic UI translations |
| `messages/zh.json` | Chinese UI translations |
| `messages/ur.json` | Urdu UI translations |
| `components/language-switcher.tsx` | Language selector component |
| `app/api/translate/route.ts` | Translation API endpoint (to be created) |
| `lib/translate.ts` | Client-side translation utility (to be created) |
