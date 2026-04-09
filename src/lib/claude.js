/**
 * Claude API wrapper — calls Anthropic API directly from browser.
 * API key is stored in useSettingsStore.
 */

const CLAUDE_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

export async function generateCopy({ apiKey, niche, outreachType, targetBusiness, painPoint, offer, tone, language }) {
  if (!apiKey) throw new Error('No Claude API key set. Please add your key in Settings → AI.')

  const systemPrompt = `You are an expert sales copywriter for a Moroccan lead generation agency.
Generate high-converting outreach copy in ${language}.
Be specific, persuasive, and tailored to the exact business type and pain point provided.
Output ONLY the copy — no explanations, no headers, no meta-commentary.`

  const userPrompt = `Write a ${outreachType.replace(/_/g, ' ')} for:
- Niche: ${niche}
- Target Business Type: ${targetBusiness}
- Pain Point: ${painPoint}
- Offer: ${offer}
- Tone: ${tone}
- Language: ${language}

Output the complete, ready-to-use copy now.`

  const response = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text || ''
}

export async function generateVideoScript({ apiKey, adConcept, targetAudience, niche, hook, visualStyle, duration }) {
  if (!apiKey) throw new Error('No Claude API key set. Please add your key in Settings → AI.')

  const systemPrompt = `You are an expert video ad scriptwriter and creative director.
Generate compelling video ad scripts for a Moroccan lead generation agency.
Always return a JSON object with keys: script, scenes (array of {number, description, duration}), voiceover, onscreen_text, cta`

  const userPrompt = `Create a ${duration} video ad script:
- Ad Concept: ${adConcept}
- Target Audience: ${targetAudience}
- Niche: ${niche}
- Hook Idea: ${hook}
- Visual Style: ${visualStyle}

Return valid JSON only.`

  const response = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'
  try {
    return JSON.parse(text)
  } catch {
    return { script: text, scenes: [], voiceover: '', onscreen_text: '', cta: '' }
  }
}

export async function testApiKey(apiKey) {
  const response = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say OK' }],
    }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'Invalid API key')
  }
  return true
}
