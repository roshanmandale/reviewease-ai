import { NextRequest, NextResponse } from 'next/server';

interface GenerateRequest {
  businessName: string;
  category: string;
  city?: string;
  about?: string;
  speciality?: string;
  rating: number;
  tone: string;
}

interface ReviewResult {
  text: string;
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(req: GenerateRequest): string {
  const { businessName, category, city, about, speciality, rating, tone } = req;
  const stars = '⭐'.repeat(rating);

  const toneGuide: Record<string, string> = {
    Professional: 'Formal English. No emojis. Polished, complete sentences.',
    Friendly:     'Casual warm English. 1 emoji allowed. Like texting a friend.',
    Hindi:        'Pure Hindi in Devanagari script. Conversational, not formal.',
    Hinglish:     'Mix Hindi + English naturally like Indians speak. E.g. "Yaar bahut mast tha!"',
    Short:        'Max 8 words per review. Ultra punchy. No filler.',
  };

  const guide = toneGuide[tone] ?? toneGuide['Friendly'];

  // Random variation seeds — injected at call time so every request is different
  const angles = [
    'focus on the food or service quality',
    'focus on the staff and hospitality',
    'focus on ambience and atmosphere',
    'focus on value for money',
    'focus on speed and efficiency',
    'focus on taste and freshness',
    'focus on overall experience',
    'focus on what makes it special',
  ];
  const perspectives =
    tone === 'Hindi'
      ? ['पहली बार गया था', 'दोस्त के साथ गया', 'परिवार के साथ गया', 'नियमित ग्राहक हूं']
      : tone === 'Hinglish'
      ? ['Pehli baar gaya tha', 'Dost ke saath gaya', 'Family ke saath tha', 'Regular customer hoon']
      : ['First time visitor', 'Regular customer', 'Came with family', 'Visited with friends', 'Solo visit'];

  const angle = angles[Math.floor(Math.random() * angles.length)];
  const perspective = perspectives[Math.floor(Math.random() * perspectives.length)];

  // Build context lines — only include fields that have real values
  const contextLines: string[] = [];
  if (city) contextLines.push(`City: ${city}`);
  if (about) contextLines.push(`About: ${about}`);
  if (speciality) contextLines.push(`Known for: ${speciality}`);
  const context = contextLines.length > 0 ? contextLines.join('\n') : '';

  return `Write 3 DIFFERENT short customer reviews.
Business: ${businessName}
Category: ${category}
${context}
Rating: ${stars}
Tone: ${guide}
Angle: ${angle}. Perspective: ${perspective}.

Rules:
- Each review must be UNIQUE with different sentence structure
- Mention specific details from "Known for" if provided
- Sound like a real human, not generic
- Avoid "highly recommend" — use varied expressions
- Under 25 words each
- Mix styles: one short, one expressive, one casual
- Each review must start with a DIFFERENT word
- No repeated phrases across the 3 reviews

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
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── NVIDIA NIM — mistral (fastest) ──────────────────────────────────────────

async function generateWithNim(req: GenerateRequest, apiKey: string): Promise<ReviewResult[]> {
  const res = await fetchWithTimeout(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct-v0.3',
        messages: [
          {
            role: 'system',
            content:
              'You write short, specific, human-sounding customer reviews. Output valid JSON only. No explanation. Every response must be completely different.',
          },
          { role: 'user', content: buildPrompt(req) },
        ],
        temperature: 1.0,
        top_p: 0.95,
        max_tokens: 200,
        stream: false,
      }),
    },
    8000
  );

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`NIM mistral ${res.status}: ${err.slice(0, 100)}`);
  }
  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';
  if (!content) throw new Error('NIM empty response');
  const reviews = parseReviews(content);
  if (!reviews) throw new Error('NIM parse failed');
  return reviews;
}

// ─── NVIDIA NIM — llama fallback ─────────────────────────────────────────────

async function generateWithNimLlama(req: GenerateRequest, apiKey: string): Promise<ReviewResult[]> {
  const res = await fetchWithTimeout(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          {
            role: 'system',
            content:
              'You write short, specific, human-sounding customer reviews. Output valid JSON only. No explanation. Every response must be completely different.',
          },
          { role: 'user', content: buildPrompt(req) },
        ],
        temperature: 1.0,
        top_p: 0.95,
        max_tokens: 200,
        stream: false,
      }),
    },
    10000
  );

  if (!res.ok) throw new Error(`NIM llama ${res.status}`);
  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';
  const reviews = parseReviews(content);
  if (!reviews) throw new Error('NIM llama parse failed');
  return reviews;
}

// ─── Rich static fallback ─────────────────────────────────────────────────────
// Used when all AI providers fail. Incorporates speciality if available.

function getFallbackReviews(req: GenerateRequest): ReviewResult[] {
  const { businessName, category, speciality, rating, tone } = req;
  const cat = category.toLowerCase();
  const spec = speciality ? speciality.split(',')[0].trim() : '';
  const r = rating >= 5 ? 5 : rating >= 4 ? 4 : 3;

  const banks: Record<string, Record<number, ReviewResult[]>> = {
    Professional: {
      5: [
        { text: spec ? `The ${spec} at ${businessName} was exceptional. Service was prompt and professional.` : `${businessName} delivered an exceptional experience. Service quality was commendable throughout.` },
        { text: `Outstanding ${cat}. Staff was attentive and every detail was handled with care.` },
        { text: spec ? `${spec} — absolutely worth it. ${businessName} sets a high standard for ${cat}.` : `${businessName} sets a high standard. Quality and professionalism exceeded expectations.` },
      ],
      4: [
        { text: `Very good experience at ${businessName}. Staff was professional and service was smooth.` },
        { text: spec ? `${spec} was great. Minor wait time but the quality made it worthwhile.` : `Solid ${cat} with professional staff. Minor wait but overall a great visit.` },
        { text: `${businessName} delivers consistent quality. Would definitely return.` },
      ],
      3: [
        { text: `Decent experience at ${businessName}. Service was satisfactory with room for improvement.` },
        { text: `Average ${cat} visit. Staff was polite but the experience felt a bit rushed.` },
        { text: `${businessName} is okay. Gets the job done but nothing extraordinary.` },
      ],
    },
    Friendly: {
      5: [
        { text: spec ? `Omg the ${spec} here is INSANE 😍 ${businessName} never disappoints!` : `Omg loved it here! The staff at ${businessName} are so sweet and helpful 😍` },
        { text: spec ? `Best ${spec} I've had in a long time! Everything was perfect ⭐` : `Best ${cat} visit in a long time! Everything was perfect, coming back for sure ⭐` },
        { text: `${businessName} is such a vibe! Felt so welcome from the moment I walked in 🙌` },
      ],
      4: [
        { text: `Really enjoyed my time at ${businessName}! Great vibes and friendly staff 😊` },
        { text: spec ? `${spec} was so good! Small wait but totally worth it. Will visit again!` : `Super happy with the service! Small wait but totally worth it. Will visit again!` },
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
        { text: spec ? `${spec} का स्वाद लाजवाब था! ${businessName} में जरूर आएं ⭐` : `${businessName} में जाकर बहुत अच्छा लगा। सर्विस एकदम लाजवाब थी!` },
        { text: `यहाँ का अनुभव शानदार रहा। स्टाफ बहुत विनम्र और मददगार है।` },
        { text: `सच में बेहतरीन जगह है। ${businessName} को जरूर विजिट करें!` },
      ],
      4: [
        { text: spec ? `${spec} बहुत अच्छा था। ${businessName} में दोबारा आऊंगा।` : `${businessName} में अच्छा अनुभव रहा। सर्विस अच्छी थी, दोबारा आऊंगा।` },
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
        { text: spec ? `Yaar ${spec} toh ekdum zabardast tha! ${businessName} is a must visit 🙌` : `Yaar ${businessName} ekdum mast hai! Service itni fast thi, shocked ho gaya 🙌` },
        { text: `Bhai sach mein zabardast experience tha. Definitely sabko recommend karunga!` },
        { text: `${businessName} toh ab mera favourite ban gaya. Sab kuch perfect tha, 5 stars easily!` },
      ],
      4: [
        { text: spec ? `${spec} bahut acha tha yaar! ${businessName} mein service bhi fast thi.` : `Bahut acha tha yaar! ${businessName} mein service bhi fast thi aur staff bhi friendly.` },
        { text: `Overall solid experience tha. Thoda wait karna pada but worth it tha bilkul!` },
        { text: `${businessName} is pretty good! Vibe acha hai aur log bhi helpful hain. Revisit karunga.` },
      ],
      3: [
        { text: `Theek tha yaar, kuch khaas nahi. ${businessName} mein improvement ki zaroorat hai.` },
        { text: `Average experience tha. Staff nice tha but service thodi slow thi.` },
        { text: `Not bad, not great. ${businessName} has potential, dekhte hain aage.` },
      ],
    },
    Short: {
      5: [
        { text: spec ? `${spec} here = 🔥 Absolutely loved it!` : `${businessName} is 🔥 Absolutely loved it!` },
        { text: `Perfect ${cat}. Zero complaints!` },
        { text: `5 stars, no doubts. Go here!` },
      ],
      4: [
        { text: `Really good! Will come back.` },
        { text: spec ? `${spec} was great. Happy customer 👍` : `Great ${cat}, happy customer 👍` },
        { text: `${businessName} delivers. Solid visit!` },
      ],
      3: [
        { text: `Decent. Could be better.` },
        { text: `Okay experience, nothing special.` },
        { text: `Average but not bad.` },
      ],
    },
  };

  const toneBank = banks[tone] ?? banks['Friendly'];
  return toneBank[r] ?? toneBank[5];
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

    const fallback = getFallbackReviews(body);
    const nimKey = process.env.NVIDIA_NIM_API_KEY;

    // 1. NVIDIA NIM — mistral (fastest)
    if (nimKey) {
      try {
        const reviews = await generateWithNim(body, nimKey);
        return NextResponse.json({ reviews: ensureThree(reviews, fallback), provider: 'nvidia-nim' });
      } catch (e) {
        console.error('[generate-review] NIM mistral failed:', (e as Error).message);
      }

      // 2. NVIDIA NIM — llama fallback
      try {
        const reviews = await generateWithNimLlama(body, nimKey);
        return NextResponse.json({ reviews: ensureThree(reviews, fallback), provider: 'nvidia-nim-llama' });
      } catch (e) {
        console.error('[generate-review] NIM llama failed:', (e as Error).message);
      }
    }

    // 3. Static fallback — instant, always works
    console.warn('[generate-review] All AI providers failed — using static fallback');
    return NextResponse.json({ reviews: fallback, provider: 'fallback' });

  } catch (err) {
    console.error('[generate-review] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
