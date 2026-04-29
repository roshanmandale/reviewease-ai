import { NextRequest, NextResponse } from 'next/server';

interface GenerateRequest {
  businessName: string;
  category: string;
  rating: number;
  tone: string;
}

interface ReviewResult {
  text: string;
}

// ─── Tight, fast prompt ───────────────────────────────────────────────────────
// Shorter prompt = fewer input tokens = faster response from the model

function buildPrompt(
  businessName: string,
  category: string,
  rating: number,
  tone: string
): string {
  const stars = '⭐'.repeat(rating);

  const toneGuide: Record<string, string> = {
    Professional: 'Formal English. No emojis. Polished sentences.',
    Friendly:     'Casual warm English. 1 emoji allowed. Like texting a friend.',
    Hindi:        'Pure Hindi in Devanagari script. Conversational, not formal.',
    Hinglish:     'Mix Hindi + English naturally like Indians speak. E.g. "Yaar bahut mast tha!"',
    Short:        'Max 8 words per review. Ultra punchy.',
  };

  const guide = toneGuide[tone] ?? toneGuide['Friendly'];

  // Varied human openers so reviews don't all start the same way
  const openerHint =
    tone === 'Hindi'
      ? 'शुरुआत अलग-अलग तरीके से करें।'
      : tone === 'Hinglish'
      ? 'Start differently each time — yaar, bhai, sach mein, etc.'
      : 'Start each review differently — avoid starting all with "I".';

  return `Write 3 real customer reviews for "${businessName}" (${category}). Rating: ${stars}
Tone: ${guide}
${openerHint}
Rules: under 20 words each, human & natural, no spam words, all 3 unique.
Reply ONLY with this JSON, nothing else:
[{"text":"..."},{"text":"..."},{"text":"..."}]`;
}

// ─── Parse AI response ────────────────────────────────────────────────────────

function parseReviews(raw: string): ReviewResult[] | null {
  const cleaned = raw.replace(/```json|```/gi, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    if (!Array.isArray(parsed)) return null;
    const results = parsed
      .filter((x) => x?.text && typeof x.text === 'string' && x.text.trim())
      .map((x) => ({ text: x.text.trim() }));
    return results.length >= 1 ? results : null;
  } catch {
    return null;
  }
}

// ─── Fetch with timeout ───────────────────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ─── NVIDIA NIM — primary ─────────────────────────────────────────────────────
// Uses mistral-7b — fastest model on NIM, sub-2s typical response

async function generateWithNim(
  businessName: string,
  category: string,
  rating: number,
  tone: string,
  apiKey: string
): Promise<ReviewResult[]> {
  const res = await fetchWithTimeout(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct-v0.3',
        messages: [
          {
            role: 'system',
            content: 'You write short customer reviews. Output valid JSON only. No explanation.',
          },
          {
            role: 'user',
            content: buildPrompt(businessName, category, rating, tone),
          },
        ],
        temperature: 0.75,
        top_p: 0.8,
        max_tokens: 180,   // 3 reviews × ~20 words × ~5 tokens = ~300 max, 180 is enough for JSON
        stream: false,
      }),
    },
    8000 // 8 second hard timeout
  );

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`NIM ${res.status}: ${err.slice(0, 120)}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';
  if (!content) throw new Error('NIM empty response');

  const reviews = parseReviews(content);
  if (!reviews) throw new Error('NIM parse failed');
  return reviews;
}

// ─── NVIDIA NIM fallback model ────────────────────────────────────────────────
// If mistral fails, try llama as second attempt on same API key

async function generateWithNimLlama(
  businessName: string,
  category: string,
  rating: number,
  tone: string,
  apiKey: string
): Promise<ReviewResult[]> {
  const res = await fetchWithTimeout(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    {
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
            content: 'You write short customer reviews. Output valid JSON only. No explanation.',
          },
          {
            role: 'user',
            content: buildPrompt(businessName, category, rating, tone),
          },
        ],
        temperature: 0.7,
        top_p: 0.8,
        max_tokens: 180,
        stream: false,
      }),
    },
    10000 // 10 second timeout
  );

  if (!res.ok) throw new Error(`NIM llama ${res.status}`);
  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';
  const reviews = parseReviews(content);
  if (!reviews) throw new Error('NIM llama parse failed');
  return reviews;
}

// ─── Rich static fallback ─────────────────────────────────────────────────────
// Varied, human-sounding, never robotic — used when AI is unavailable

function getFallbackReviews(
  businessName: string,
  category: string,
  rating: number,
  tone: string
): ReviewResult[] {
  const cat = category.toLowerCase();
  const r = rating;

  const banks: Record<string, Record<number, ReviewResult[]>> = {
    Professional: {
      5: [
        { text: `Exceptional service at ${businessName}. Every detail was handled with care.` },
        { text: `Outstanding ${cat} experience. The team was professional and efficient throughout.` },
        { text: `Highly recommend ${businessName}. Quality and service both exceeded expectations.` },
      ],
      4: [
        { text: `Very good experience at ${businessName}. Staff was attentive and service was smooth.` },
        { text: `Solid ${cat} with professional staff. Minor wait time but overall great visit.` },
        { text: `${businessName} delivers consistent quality. Would definitely return.` },
      ],
      3: [
        { text: `Decent experience at ${businessName}. Service was satisfactory, room for improvement.` },
        { text: `Average ${cat} visit. Staff was polite but the experience felt rushed.` },
        { text: `${businessName} is okay. Gets the job done but nothing extraordinary.` },
      ],
    },
    Friendly: {
      5: [
        { text: `Omg loved it here! The staff at ${businessName} are so sweet and helpful 😍` },
        { text: `Best ${cat} visit in a long time! Everything was perfect, coming back for sure ⭐` },
        { text: `${businessName} never disappoints! Felt so welcome from the moment I walked in 🙌` },
      ],
      4: [
        { text: `Really enjoyed my time at ${businessName}! Great vibes and friendly staff 😊` },
        { text: `Super happy with the service! Small wait but totally worth it. Will visit again!` },
        { text: `${businessName} is such a good spot. Loved the atmosphere and the team was great!` },
      ],
      3: [
        { text: `It was okay! ${businessName} has potential, just needs a bit more consistency 😊` },
        { text: `Decent visit overall. Staff was nice but the experience could be smoother.` },
        { text: `Not bad at all! Would give it another shot and see if it improves.` },
      ],
    },
    Hindi: {
      5: [
        { text: `${businessName} में जाकर बहुत अच्छा लगा। सर्विस एकदम लाजवाब थी! ⭐` },
        { text: `यहाँ का अनुभव शानदार रहा। स्टाफ बहुत विनम्र और मददगार है।` },
        { text: `सच में बेहतरीन जगह है। ${businessName} को जरूर विजिट करें!` },
      ],
      4: [
        { text: `${businessName} में अच्छा अनुभव रहा। सर्विस अच्छी थी, दोबारा आऊंगा।` },
        { text: `काफी अच्छी जगह है। स्टाफ friendly है और माहौल भी अच्छा है।` },
        { text: `अच्छा ${cat} है। थोड़ा इंतजार करना पड़ा लेकिन सर्विस अच्छी थी।` },
      ],
      3: [
        { text: `ठीक-ठाक अनुभव रहा। ${businessName} में सुधार की गुंजाइश है।` },
        { text: `सामान्य अनुभव था। स्टाफ विनम्र था लेकिन सर्विस थोड़ी धीमी थी।` },
        { text: `औसत ${cat} है। बेहतर हो सकता है।` },
      ],
    },
    Hinglish: {
      5: [
        { text: `Yaar ${businessName} ekdum mast hai! Service itni fast thi, shocked ho gaya 🙌` },
        { text: `Bhai sach mein zabardast experience tha. Definitely recommend karunga sabko!` },
        { text: `${businessName} toh ab mera favourite ban gaya. Sab kuch perfect tha, 5 stars easily!` },
      ],
      4: [
        { text: `Bahut acha tha yaar! ${businessName} mein service bhi fast thi aur staff bhi friendly.` },
        { text: `Overall solid experience tha. Thoda wait karna pada but worth it tha bilkul!` },
        { text: `${businessName} is pretty good! Vibe acha hai aur log bhi helpful hain. Revisit karunga.` },
      ],
      3: [
        { text: `Theek tha yaar, kuch khaas nahi. ${businessName} mein improvement ki zaroorat hai.` },
        { text: `Average experience tha. Staff nice tha but service thodi slow thi.` },
        { text: `Not bad, not great. ${businessName} has potential, dekhte hain aage kya hota hai.` },
      ],
    },
    Short: {
      5: [
        { text: `${businessName} is 🔥 Absolutely loved it!` },
        { text: `Perfect ${cat}. No complaints at all!` },
        { text: `5 stars, zero doubts. Go here!` },
      ],
      4: [
        { text: `Really good! Will come back.` },
        { text: `Great ${cat}, happy customer. 👍` },
        { text: `${businessName} delivers. Solid visit!` },
      ],
      3: [
        { text: `Decent. Could be better.` },
        { text: `Okay experience, nothing special.` },
        { text: `Average but not bad.` },
      ],
    },
  };

  // Pick closest rating bucket (5, 4, or 3)
  const bucket = r >= 5 ? 5 : r >= 4 ? 4 : 3;
  const toneBank = banks[tone] ?? banks['Friendly'];
  return toneBank[bucket] ?? toneBank[5];
}

// ─── Ensure exactly 3 ────────────────────────────────────────────────────────

function ensureThree(reviews: ReviewResult[], fallback: ReviewResult[]): ReviewResult[] {
  const result = reviews.slice(0, 3);
  while (result.length < 3) result.push(fallback[result.length] ?? fallback[0]);
  return result;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    let body: GenerateRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { businessName, category, rating, tone } = body;

    if (!businessName?.trim() || !category?.trim() || !tone?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'rating must be 1–5' }, { status: 400 });
    }

    const fallback = getFallbackReviews(businessName, category, rating, tone);
    const nimKey = process.env.NVIDIA_NIM_API_KEY;

    // ── Try NVIDIA NIM (mistral — fastest) ──
    if (nimKey) {
      try {
        const reviews = await generateWithNim(businessName, category, rating, tone, nimKey);
        return NextResponse.json({ reviews: ensureThree(reviews, fallback), provider: 'nvidia-nim' });
      } catch (e) {
        console.error('[generate-review] NIM mistral failed:', (e as Error).message);
      }

      // ── Try NVIDIA NIM (llama — second attempt, same key) ──
      try {
        const reviews = await generateWithNimLlama(businessName, category, rating, tone, nimKey);
        return NextResponse.json({ reviews: ensureThree(reviews, fallback), provider: 'nvidia-nim-llama' });
      } catch (e) {
        console.error('[generate-review] NIM llama failed:', (e as Error).message);
      }
    }

    // ── Static fallback — instant, always works ──
    console.warn('[generate-review] All AI providers failed — using static fallback');
    return NextResponse.json({ reviews: fallback, provider: 'fallback' });

  } catch (err) {
    console.error('[generate-review] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
