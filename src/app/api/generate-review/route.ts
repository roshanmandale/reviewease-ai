import { NextRequest, NextResponse } from 'next/server';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GenerateRequest {
  businessName: string;
  category: string;
  rating: number;
  tone: string;
}

interface ReviewResult {
  text: string;
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(
  businessName: string,
  category: string,
  rating: number,
  tone: string
): string {
  const toneInstructions: Record<string, string> = {
    Professional:
      'Write in a formal, professional tone. Use complete sentences. No emojis.',
    Friendly:
      'Write in a warm, casual, friendly tone. Can include 1 emoji per review.',
    Hindi:
      'Write entirely in Hindi (Devanagari script). Natural conversational Hindi.',
    Hinglish:
      'Write in Hinglish — a natural mix of Hindi words and English words as spoken in India.',
    Short:
      'Write very short reviews — maximum 10 words each. Punchy and direct.',
  };

  const instruction = toneInstructions[tone] || toneInstructions['Friendly'];

  return `You are a review-writing assistant for local businesses in India.

Task: Write exactly 3 short, realistic customer reviews for the business below.

Business: ${businessName}
Category: ${category}
Star Rating: ${rating} out of 5
Tone: ${tone}
Tone instruction: ${instruction}

Rules:
- Each review must be under 25 words
- Sound like a real human customer, not a bot
- Positive and believable — match the star rating
- No spammy phrases like "best ever", "absolutely perfect", "world class"
- Each review must be unique — different wording, different angle
- Do NOT include the business name in every review
- Do NOT number the reviews

Return ONLY a valid JSON array of exactly 3 objects. No explanation, no markdown, no extra text.

Format:
[
  { "text": "First review here." },
  { "text": "Second review here." },
  { "text": "Third review here." }
]`;
}

// ─── Parse AI response safely ─────────────────────────────────────────────────

function parseReviews(raw: string): ReviewResult[] | null {
  // Strip markdown code fences if present
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Find the JSON array
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) return null;

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    if (!Array.isArray(parsed)) return null;

    const results: ReviewResult[] = parsed
      .filter((item) => item && typeof item.text === 'string' && item.text.trim().length > 0)
      .map((item) => ({ text: item.text.trim() }));

    return results.length >= 1 ? results : null;
  } catch {
    return null;
  }
}

// ─── NVIDIA NIM ───────────────────────────────────────────────────────────────

async function generateWithNvidianim(
  businessName: string,
  category: string,
  rating: number,
  tone: string,
  apiKey: string
): Promise<ReviewResult[]> {
  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'meta/llama-3.1-8b-instruct',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that writes short, realistic customer reviews. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: buildPrompt(businessName, category, rating, tone),
        },
      ],
      temperature: 0.8,
      top_p: 0.9,
      max_tokens: 400,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'unknown error');
    throw new Error(`NVIDIA NIM API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';

  if (!content) throw new Error('NVIDIA NIM returned empty content');

  const reviews = parseReviews(content);
  if (!reviews) throw new Error('NVIDIA NIM response could not be parsed as review JSON');

  return reviews;
}

// ─── OpenAI fallback ──────────────────────────────────────────────────────────

async function generateWithOpenAI(
  businessName: string,
  category: string,
  rating: number,
  tone: string,
  apiKey: string
): Promise<ReviewResult[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that writes short, realistic customer reviews. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: buildPrompt(businessName, category, rating, tone),
        },
      ],
      temperature: 0.8,
      max_tokens: 400,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI API error ${response.status}`);

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';
  const reviews = parseReviews(content);
  if (!reviews) throw new Error('OpenAI response could not be parsed');
  return reviews;
}

// ─── Gemini fallback ──────────────────────────────────────────────────────────

async function generateWithGemini(
  businessName: string,
  category: string,
  rating: number,
  tone: string,
  apiKey: string
): Promise<ReviewResult[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(businessName, category, rating, tone) }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 400 },
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini API error ${response.status}`);

  const data = await response.json();
  const content: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const reviews = parseReviews(content);
  if (!reviews) throw new Error('Gemini response could not be parsed');
  return reviews;
}

// ─── Static fallback ──────────────────────────────────────────────────────────

function getFallbackReviews(
  businessName: string,
  category: string,
  rating: number,
  tone: string
): ReviewResult[] {
  const adj = rating >= 5 ? 'amazing' : rating >= 4 ? 'great' : 'good';
  const cat = category.toLowerCase();

  const banks: Record<string, ReviewResult[]> = {
    Professional: [
      { text: `${businessName} delivered an ${adj} experience with commendable service quality.` },
      { text: `Exceptional professionalism at ${businessName}. Exceeded expectations on every front.` },
      { text: `A reliable ${cat} with consistent quality. Would recommend ${businessName} without hesitation.` },
    ],
    Friendly: [
      { text: `Loved my visit to ${businessName}! Staff was so warm and everything was ${adj}. 😊` },
      { text: `Had a wonderful time here. The vibe was great and service was top-notch!` },
      { text: `${businessName} is my new favourite spot! ${adj.charAt(0).toUpperCase() + adj.slice(1)} from start to finish. ⭐` },
    ],
    Hindi: [
      { text: `${businessName} में बहुत अच्छा अनुभव रहा। सेवा शानदार और माहौल बेहतरीन था।` },
      { text: `यहाँ की सर्विस लाजवाब है। स्टाफ बहुत विनम्र और मददगार है।` },
      { text: `${businessName} में ${adj === 'amazing' ? 'अद्भुत' : 'बढ़िया'} अनुभव मिला। पूरी तरह संतुष्ट हूं।` },
    ],
    Hinglish: [
      { text: `${businessName} ka experience ekdum ${adj} tha! Staff super friendly aur service fast. 🙌` },
      { text: `Yaar, sach mein maza aa gaya. Quality top-notch hai aur price bhi reasonable. Must visit!` },
      { text: `Pehli baar gaya tha but ab toh regular ban gaya hoon. Sab kuch perfect tha. 5 stars!` },
    ],
    Short: [
      { text: `${businessName} — ${adj} experience! Highly recommend.` },
      { text: `Great service, friendly staff. Never disappoints!` },
      { text: `Best ${cat} around. Must visit!` },
    ],
  };

  return banks[tone] ?? banks['Friendly'];
}

// ─── Ensure exactly 3 results ─────────────────────────────────────────────────

function ensureThree(
  reviews: ReviewResult[],
  fallback: ReviewResult[]
): ReviewResult[] {
  const result = reviews.slice(0, 3);
  while (result.length < 3) {
    result.push(fallback[result.length] ?? fallback[0]);
  }
  return result;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Parse and validate body
    let body: GenerateRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { businessName, category, rating, tone } = body;

    if (!businessName?.trim() || !category?.trim() || !tone?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: businessName, category, tone' },
        { status: 400 }
      );
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'rating must be a number between 1 and 5' },
        { status: 400 }
      );
    }

    const fallback = getFallbackReviews(businessName, category, rating, tone);
    let reviews: ReviewResult[] = [];
    let provider = 'fallback';

    // 1. NVIDIA NIM — primary
    const nimKey = process.env.NVIDIA_NIM_API_KEY;
    if (nimKey) {
      try {
        reviews = await generateWithNvidianim(businessName, category, rating, tone, nimKey);
        provider = 'nvidia-nim';
      } catch (err) {
        console.error('[generate-review] NVIDIA NIM failed:', err);
      }
    }

    // 2. OpenAI — first fallback
    if (!reviews.length) {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        try {
          reviews = await generateWithOpenAI(businessName, category, rating, tone, openaiKey);
          provider = 'openai';
        } catch (err) {
          console.error('[generate-review] OpenAI failed:', err);
        }
      }
    }

    // 3. Gemini — second fallback
    if (!reviews.length) {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey) {
        try {
          reviews = await generateWithGemini(businessName, category, rating, tone, geminiKey);
          provider = 'gemini';
        } catch (err) {
          console.error('[generate-review] Gemini failed:', err);
        }
      }
    }

    // 4. Static fallback — always works
    if (!reviews.length) {
      reviews = fallback;
      provider = 'fallback';
    }

    return NextResponse.json({
      reviews: ensureThree(reviews, fallback),
      provider,
    });
  } catch (err) {
    console.error('[generate-review] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
