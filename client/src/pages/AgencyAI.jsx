import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ── Scoped CSS (all selectors prefixed .aai, keyframes renamed) ───────────
const APP_CSS = `
.aai {
  display: flex; flex-direction: column; gap: 0;
  min-height: 600px;
  font-family: Inter, system-ui, -apple-system, sans-serif;
  color: #1a1a1a;
}

.aai .topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 0.5px solid #e5e7eb;
  background: #ffffff;
}
.aai .topbar-left { display: flex; align-items: center; gap: 10px; }
.aai .logo-dot { width: 10px; height: 10px; background: #c8522a; border-radius: 50%; }
.aai .logo-text { font-size: 14px; font-weight: 500; color: #1a1a1a; }
.aai .logo-badge {
  font-size: 11px; color: #8b3a1e; background: #fef3ec;
  padding: 2px 8px; border-radius: 20px;
}
.aai .topbar-hint { font-size: 12px; color: #9ca3af; }

.aai .layout {
  display: grid; grid-template-columns: 220px 1fr; min-height: 560px;
}

.aai .sidebar {
  border-right: 0.5px solid #e5e7eb;
  background: #f9fafb;
  padding: 16px 0;
}
.aai .sidebar-section { padding: 0 12px; margin-bottom: 8px; }
.aai .sidebar-label {
  font-size: 11px; color: #9ca3af;
  text-transform: uppercase; letter-spacing: 1.5px;
  padding: 0 8px; margin-bottom: 6px;
}
.aai .step-btn {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: 8px;
  cursor: pointer; width: 100%; border: none;
  background: transparent; color: #1a1a1a;
  font-size: 13px; font-family: Inter, system-ui, sans-serif;
  text-align: left; transition: background 0.15s;
  position: relative;
}
.aai .step-btn:hover { background: #f3f4f6; }
.aai .step-btn.active {
  background: #ffffff; border: 0.5px solid #d1d5db;
}
.aai .step-num {
  width: 24px; height: 24px; border-radius: 6px;
  background: #f3f4f6; color: #6b7280;
  font-size: 11px; font-weight: 500; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
}
.aai .step-btn.active .step-num { background: #c8522a; color: white; }
.aai .step-btn.done .step-num { background: #ecfef3; color: #1a6b3a; }
.aai .step-name { font-size: 13px; line-height: 1.3; }
.aai .step-sub { font-size: 11px; color: #9ca3af; }

.aai .sidebar-bonus-divider {
  margin-top: 8px; padding-top: 12px; border-top: 0.5px solid #e5e7eb;
}

.aai .main-panel { display: flex; flex-direction: column; background: #ffffff; }

.aai .panel-header {
  padding: 20px 24px 16px;
  border-bottom: 0.5px solid #e5e7eb;
}
.aai .panel-header h2 { font-size: 17px; font-weight: 500; margin-bottom: 3px; color: #1a1a1a; }
.aai .panel-header p { font-size: 13px; color: #6b7280; }

.aai .panel-body { padding: 20px 24px; flex: 1; overflow-y: auto; max-height: 480px; }

.aai .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.aai .form-full { grid-column: 1 / -1; }
.aai .field { display: flex; flex-direction: column; gap: 5px; }
.aai .field label { font-size: 12px; font-weight: 500; color: #6b7280; }
.aai .field input,
.aai .field select,
.aai .field textarea {
  font-size: 13px; padding: 8px 10px;
  border-radius: 8px; width: 100%;
  font-family: Inter, system-ui, sans-serif;
  border: 0.5px solid #d1d5db;
  background: #ffffff;
  color: #1a1a1a;
  outline: none;
  transition: border-color 0.15s;
}
.aai .field input:focus,
.aai .field select:focus,
.aai .field textarea:focus { border-color: #c8522a; }
.aai .field textarea { resize: vertical; min-height: 70px; }

.aai .lang-row { display: flex; gap: 8px; flex-wrap: wrap; }
.aai .lang-opt {
  padding: 6px 14px; border-radius: 20px; font-size: 12px;
  cursor: pointer; border: 0.5px solid #d1d5db;
  background: #ffffff; color: #6b7280;
  transition: all 0.15s; font-family: Inter, system-ui, sans-serif;
}
.aai .lang-opt.selected { background: #c8522a; color: white; border-color: #c8522a; }

.aai .generate-bar {
  padding: 14px 24px; border-top: 0.5px solid #e5e7eb;
  display: flex; align-items: center; justify-content: space-between;
  background: #ffffff;
}
.aai .gen-info { font-size: 12px; color: #6b7280; }
.aai .gen-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 20px; border-radius: 8px;
  background: #1a1a1a; color: #ffffff;
  border: none; font-size: 13px; font-weight: 500;
  cursor: pointer; font-family: Inter, system-ui, sans-serif;
  transition: opacity 0.15s;
}
.aai .gen-btn:hover { opacity: 0.85; }
.aai .gen-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.aai .gen-btn .spin {
  animation: aai-spin 1s linear infinite;
  display: inline-block;
}
@keyframes aai-spin { to { transform: rotate(360deg); } }

.aai .output-panel { display: none; flex-direction: column; }
.aai .output-panel.visible { display: flex; }
.aai .output-header {
  padding: 14px 24px; border-bottom: 0.5px solid #e5e7eb;
  display: flex; align-items: center; justify-content: space-between;
}
.aai .output-header span { font-size: 13px; font-weight: 500; color: #1a1a1a; }
.aai .output-actions { display: flex; gap: 8px; }
.aai .out-btn {
  padding: 6px 12px; font-size: 12px; border-radius: 8px;
  border: 0.5px solid #d1d5db; background: #ffffff;
  cursor: pointer; font-family: Inter, system-ui, sans-serif;
  color: #1a1a1a;
  display: flex; align-items: center; gap: 5px;
}
.aai .out-btn:hover { background: #f9fafb; }
.aai .output-content {
  padding: 20px 24px; font-size: 13px; line-height: 1.7;
  color: #1a1a1a; white-space: pre-wrap; word-break: break-word;
  flex: 1; overflow-y: auto; max-height: 380px;
  font-family: Inter, system-ui, sans-serif;
}
.aai .streaming-cursor {
  display: inline-block; width: 2px; height: 14px;
  background: #c8522a;
  animation: aai-blink 1s step-end infinite;
  vertical-align: middle; margin-left: 1px;
}
@keyframes aai-blink { 50% { opacity: 0; } }

.aai .loading-state { display: flex; align-items: center; gap: 10px; padding: 20px 24px; }
.aai .loading-dots { display: flex; gap: 4px; }
.aai .loading-dots span {
  width: 6px; height: 6px; border-radius: 50%;
  background: #c8522a; animation: aai-bounce 0.8s infinite;
}
.aai .loading-dots span:nth-child(2) { animation-delay: 0.15s; }
.aai .loading-dots span:nth-child(3) { animation-delay: 0.3s; }
@keyframes aai-bounce {
  0%,80%,100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
.aai .loading-text { font-size: 13px; color: #6b7280; }

.aai .brief-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 20px; font-size: 11px;
  background: #ecfef3; color: #1a6b3a;
}
.aai .section-divider { height: 0.5px; background: #e5e7eb; margin: 16px 0; }
.aai .step0-note {
  background: #f9fafb; border: 0.5px solid #e5e7eb;
  border-radius: 8px; padding: 12px 14px;
  font-size: 12px; color: #6b7280; line-height: 1.6; margin-top: 12px;
}
.aai .step0-note strong { color: #1a1a1a; }
`

// ── STEPS data (identical to source HTML) ────────────────────────────────
const STEPS = [
  {
    title: 'Step 0 — Client Brief',
    desc: "Fill in your architect client's info. This feeds every other step.",
    info: 'Run Step 0 first — its output powers all other steps',
    fields: [
      { id: 'name',         label: 'Architect / Studio Name',    type: 'text',     placeholder: 'e.g. Atelier Benali',                          full: false },
      { id: 'city',         label: 'City',                       type: 'text',     placeholder: 'e.g. Casablanca',                              full: false },
      { id: 'specialty',    label: 'Specialty',                  type: 'text',     placeholder: 'e.g. Luxury residential villas',               full: false },
      { id: 'experience',   label: 'Years of experience',        type: 'text',     placeholder: 'e.g. 12 years',                               full: false },
      { id: 'projects',     label: 'Notable past projects',      type: 'textarea', placeholder: 'Describe 1-2 key projects...',                full: true  },
      { id: 'avgvalue',     label: 'Average project value (MAD)',type: 'text',     placeholder: 'e.g. 800,000 MAD',                             full: false },
      { id: 'currentleads', label: 'How they get clients now',   type: 'text',     placeholder: 'e.g. Word of mouth, Instagram',                full: false },
      { id: 'frustration',  label: 'Main business frustration',  type: 'textarea', placeholder: 'e.g. Inconsistent pipeline, clients want to negotiate price...', full: true },
      { id: 'target',       label: 'Target clients',             type: 'textarea', placeholder: 'e.g. Upper-middle-class families in Casablanca wanting to build their first villa', full: true },
      { id: 'lang',         label: 'Output Language',            type: 'lang',     placeholder: '',                                             full: true  },
    ],
    prompt: (d) => `You are a senior marketing strategist specializing in professional services in Morocco.

I run a lead generation agency. My client is an architect:
- Name / Studio: ${d.name}
- City: ${d.city}
- Specialty: ${d.specialty}
- Experience: ${d.experience}
- Notable projects: ${d.projects}
- Average project value: ${d.avgvalue}
- Current client acquisition: ${d.currentleads}
- Main frustration: ${d.frustration}
- Target clients: ${d.target}

Produce a complete client brief with these sections:
1. IDEAL CLIENT PROFILE — demographics, psychographics, fears, desires, what they search online late at night
2. TOP 3 PAIN POINTS — specific to architecture clients in Morocco
3. TOP 3 EMOTIONAL DESIRES — what they really want beyond just a building
4. UNIQUE POSITIONING ANGLE — one sentence that makes this architect stand out from competitors
5. MAIN OBJECTIONS — why prospects hesitate to reach out or hire
6. BEST PLATFORMS — where to find these clients in Morocco

Be specific to the Moroccan market. No generic advice. Output in ${d.lang}.`,
  },
  {
    title: 'Step 1 — Market Research',
    desc: 'Deep analysis of competitors and messaging opportunities.',
    info: 'Paste the Step 0 brief output in the field below',
    fields: [
      { id: 'brief', label: 'Client Brief (from Step 0)', type: 'textarea', placeholder: 'Paste the full output from Step 0 here...', full: true  },
      { id: 'city2', label: 'City',                       type: 'text',     placeholder: 'e.g. Casablanca',                            full: false },
      { id: 'lang',  label: 'Output Language',            type: 'lang',     placeholder: '',                                           full: true  },
    ],
    prompt: (d) => `You are a market research expert for professional services in Morocco.

CLIENT BRIEF:
${d.brief}

City: ${d.city2}

Produce a deep competitor analysis:
1. COMPETITOR LANDSCAPE — What do most architecture studios in ${d.city2} do wrong in their marketing?
2. MARKET GAPS — What messaging is NOT being used that our client can own?
3. EMOTIONAL TRIGGERS — What drives upper-middle-class Moroccans to choose an architect? (status, trust, fear of mistakes, legacy)
4. 5 HOOK ANGLES — Specific angles for ads based on real fears and desires
5. LEAD MAGNET IDEA — One free offer to get prospects to raise their hand (e.g. free consultation + project cost estimate)

Be specific. No fluff. Output in ${d.lang}.`,
  },
  {
    title: 'Step 2 — Ad Copywriting',
    desc: '3 Facebook/Instagram ad variations with different emotional angles.',
    info: 'Will produce 3 ready-to-run ads',
    fields: [
      { id: 'brief', label: 'Client Brief (from Step 0)', type: 'textarea', placeholder: 'Paste the full output from Step 0 here...', full: true  },
      { id: 'offer', label: 'The offer in the ad',        type: 'text',     placeholder: 'e.g. Free 30-min consultation + project estimate', full: false },
      { id: 'lang',  label: 'Output Language',            type: 'lang',     placeholder: '',                                           full: true  },
    ],
    prompt: (d) => `You are a world-class direct response copywriter for Facebook and Instagram ads.

CLIENT BRIEF:
${d.brief}

Offer: ${d.offer}

Write 3 Facebook/Instagram ad variations. Each ad structure:
- HOOK (stop-the-scroll first line — call out the target person directly)
- PAIN (1-2 sentences agitating the real problem)
- SOLUTION (2-3 sentences positioning the architect as the answer, with authority/social proof)
- CTA (one clear action)

Rules:
- Each under 150 words
- Ad 1: Emotion-based (fear of making a mistake building their home)
- Ad 2: Desire-based (dream home / status / legacy)
- Ad 3: Logic-based (ROI, investment value, avoid costly mistakes)
- No corporate language — sound like a real person
- End with: which ad will perform best and why

Output in ${d.lang}.`,
  },
  {
    title: 'Step 3 — Creative Brief',
    desc: 'Visual direction for 3 ad images. Specific enough for Canva.',
    info: 'Output ready for a designer or Canva',
    fields: [
      { id: 'brief', label: 'Client Brief (from Step 0)', type: 'textarea', placeholder: 'Paste the full output from Step 0 here...', full: true  },
      { id: 'style', label: 'Visual style preference',    type: 'text',     placeholder: 'e.g. Luxury minimal / warm Moroccan / modern clean', full: false },
      { id: 'lang',  label: 'Output Language',            type: 'lang',     placeholder: '',                                           full: true  },
    ],
    prompt: (d) => `You are a creative director for a performance marketing agency in Morocco.

CLIENT BRIEF:
${d.brief}

Visual style preference: ${d.style}

Create 3 detailed creative briefs for Facebook/Instagram static ad images.

For EACH visual describe:
1. FORMAT — square (1:1) or story (9:16)?
2. SCENE — Exactly what is shown (be cinematic and specific)
3. TEXT OVERLAY — Headline and subheadline text + position on image
4. COLOR PALETTE — 2-3 specific colors with hex codes if possible
5. EMOTION — What feeling in 0.5 seconds of viewing?
6. AVOID — Common mistakes for this type of ad

Visual 1: Before/After problem-to-dream-result concept
Visual 2: Project showcase / social proof
Visual 3: Direct CTA with clear offer

Be specific enough that a Canva beginner can execute without asking questions. Output in ${d.lang}.`,
  },
  {
    title: 'Step 4 — Landing Page Copy',
    desc: 'Full landing page copy ready to publish on Systeme.io or Carrd.',
    info: 'Complete page — headline to FAQ',
    fields: [
      { id: 'brief', label: 'Client Brief (from Step 0)', type: 'textarea', placeholder: 'Paste the full output from Step 0 here...', full: true  },
      { id: 'offer', label: 'The offer / CTA',            type: 'text',     placeholder: 'e.g. Book a free 30-min consultation',        full: false },
      { id: 'lang',  label: 'Output Language',            type: 'lang',     placeholder: '',                                           full: true  },
    ],
    prompt: (d) => `You are a conversion copywriter. Write a high-converting landing page for an architect.

CLIENT BRIEF:
${d.brief}

Main offer/CTA: ${d.offer}

Write the complete landing page copy:
1. HEADLINE — Dream result + who it's for (one powerful sentence)
2. SUBHEADLINE — 1-2 sentences supporting the headline
3. THE PROBLEM — 3 bullet points of pain the prospect feels now
4. THE SOLUTION — How this architect solves it differently (2-3 sentences)
5. HOW IT WORKS — 3 simple steps (e.g. Book call → Get your plan → Build your dream)
6. SOCIAL PROOF — Template structure for 2-3 testimonials the client can fill in
7. ABOUT THE ARCHITECT — 4-5 sentences. Authority + human. Not a boring bio.
8. THE OFFER — Exactly what they get when they click
9. CTA BUTTON TEXT — Not "Submit" — something that sells the next step
10. FAQ — 4 objections turned into reassuring answers

Simple language. No jargon. Goal: get them to book the call. Output in ${d.lang}.`,
  },
  {
    title: 'Step 5 — Follow-up Messages',
    desc: "5-message WhatsApp sequence for leads who filled the form but didn't book.",
    info: 'Copy-paste ready WhatsApp messages',
    fields: [
      { id: 'brief',     label: 'Client Brief (from Step 0)',     type: 'textarea', placeholder: 'Paste the full output from Step 0 here...',       full: true  },
      { id: 'offer',     label: 'The offer they signed up for',   type: 'text',     placeholder: 'e.g. Free consultation + project estimate',        full: false },
      { id: 'objection', label: 'Main objection (if known)',      type: 'text',     placeholder: 'e.g. Price too high / not the right time',         full: false },
      { id: 'lang',      label: 'Output Language',                type: 'lang',     placeholder: '',                                                full: true  },
    ],
    prompt: (d) => `You are an expert at writing follow-up sequences that convert warm leads into booked calls.

CLIENT BRIEF:
${d.brief}

Offer they responded to: ${d.offer}
Main objection: ${d.objection}

Write a 5-message WhatsApp follow-up sequence for leads who filled the form but haven't booked yet.

Schedule:
- Message 1 (Day 0, within 1 hour): Warm welcome + confirm next step
- Message 2 (Day 1): Quick value tip or insight relevant to their situation
- Message 3 (Day 3): Social proof — short story of a past client result
- Message 4 (Day 5): Handle the main objection (${d.objection})
- Message 5 (Day 7): Soft final follow-up — keep the door open

Rules:
- Each message max 5 lines
- No pressure or "last chance" language
- End each message with ONE soft question or CTA
- Sound like a real person, not a bot

Output in ${d.lang}.`,
  },
  {
    title: 'Step 6 — Client Report',
    desc: 'Professional weekly performance update message for the architect.',
    info: 'Copy-paste into WhatsApp to send your client',
    fields: [
      { id: 'clientname',  label: 'Client name',                       type: 'text',     placeholder: 'e.g. M. Benali',                                      full: false },
      { id: 'period',      label: 'Report period',                     type: 'text',     placeholder: 'e.g. 1–7 May 2026',                                   full: false },
      { id: 'impressions', label: 'Impressions',                       type: 'text',     placeholder: 'e.g. 24,500',                                         full: false },
      { id: 'reach',       label: 'Reach',                             type: 'text',     placeholder: 'e.g. 18,200',                                         full: false },
      { id: 'clicks',      label: 'Link Clicks',                       type: 'text',     placeholder: 'e.g. 342',                                            full: false },
      { id: 'leads',       label: 'Leads collected',                   type: 'text',     placeholder: 'e.g. 12',                                             full: false },
      { id: 'cpl',         label: 'Cost per lead (MAD)',               type: 'text',     placeholder: 'e.g. 28 MAD',                                         full: false },
      { id: 'calls',       label: 'Calls booked',                      type: 'text',     placeholder: 'e.g. 3',                                              full: false },
      { id: 'budget',      label: 'Budget spent (MAD)',                type: 'text',     placeholder: 'e.g. 350 MAD',                                        full: false },
      { id: 'next',        label: "What you'll improve next week",     type: 'textarea', placeholder: 'e.g. Test new hook angle targeting fear of construction errors', full: true },
      { id: 'lang',        label: 'Output Language',                   type: 'lang',     placeholder: '',                                                    full: true  },
    ],
    prompt: (d) => `You are a marketing agency account manager writing a weekly WhatsApp report for a client.

Client: ${d.clientname}
Period: ${d.period}

Campaign results:
- Impressions: ${d.impressions}
- Reach: ${d.reach}
- Link clicks: ${d.clicks}
- Leads collected: ${d.leads}
- Cost per lead: ${d.cpl}
- Calls booked: ${d.calls}
- Budget spent: ${d.budget}

Next week plan: ${d.next}

Write a professional WhatsApp message (under 200 words) that:
1. Opens with a genuine positive observation
2. Summarizes the 3 most important numbers in plain language (no jargon — explain CTR as "the % of people who clicked after seeing the ad")
3. States what we're improving next week and why
4. Closes with a confident, reassuring line

Warm professional tone. No marketing jargon. Output in ${d.lang}.`,
  },
  {
    title: 'Bonus — Sales Call Prep',
    desc: 'Get coached on objections before your next prospect call.',
    info: 'Prepare for your next architecture client sales call',
    fields: [
      { id: 'prospect', label: 'Prospect description',           type: 'textarea', placeholder: 'Who are they? What do you know about their business?',            full: true  },
      { id: 'price',    label: 'Your monthly price (MAD)',       type: 'text',     placeholder: 'e.g. 3,500 MAD/month',                                           full: false },
      { id: 'service',  label: 'What your service includes',    type: 'textarea', placeholder: 'e.g. Run Meta ads, build landing page, generate qualified leads monthly', full: true },
      { id: 'lang',     label: 'Output Language',               type: 'lang',     placeholder: '',                                                               full: true  },
    ],
    prompt: (d) => `You are my sales coach. I have a call with an architect prospect today.

Prospect: ${d.prospect}
My price: ${d.price}/month
My service: ${d.service}

Give me:
1. The 5 most likely objections this prospect will raise
2. For each objection — the EXACT words I should say to handle it (give me scripts)
3. 3 powerful discovery questions to ask early in the call to understand their situation
4. How to close — what to say to get a yes or clear next step

Speak to me like my sales coach. Direct. Give me scripts I can say out loud — not theory. Output in ${d.lang}.`,
  },
]

// ── Module-level mutable state (persists across React re-renders) ─────────
let _currentStep = 0
let _formData = {}
let _savedBriefs = {}
let _selectedLang = 'French'

// ── Module-level DOM functions ────────────────────────────────────────────
function _switchStep(n) {
  _currentStep = n
  document.querySelectorAll('.aai .step-btn').forEach(b => b.classList.remove('active'))
  const btn = document.querySelector(`.aai .step-btn[data-step="${n}"]`)
  if (btn) btn.classList.add('active')
  const op = document.getElementById('aai-outputPanel')
  if (op) op.classList.remove('visible')
  _renderForm(n)
}

function _renderForm(n) {
  const step = STEPS[n]
  const titleEl  = document.getElementById('aai-stepTitle')
  const descEl   = document.getElementById('aai-stepDesc')
  const infoEl   = document.getElementById('aai-genInfo')
  const body     = document.getElementById('aai-formBody')
  if (!step || !body) return

  if (titleEl) titleEl.textContent = step.title
  if (descEl)  descEl.textContent  = step.desc
  if (infoEl)  infoEl.textContent  = step.info

  body.innerHTML = ''
  const grid = document.createElement('div')
  grid.className = 'form-grid'

  step.fields.forEach(f => {
    const wrap = document.createElement('div')
    wrap.className = 'field' + (f.full ? ' form-full' : '')

    const label = document.createElement('label')
    label.textContent = f.label
    label.setAttribute('for', `aai-field_${f.id}`)
    wrap.appendChild(label)

    if (f.type === 'lang') {
      const row = document.createElement('div')
      row.className = 'lang-row'
      ;['French', 'Arabic', 'Darija'].forEach(l => {
        const langBtn = document.createElement('button')
        langBtn.className = 'lang-opt' + (_selectedLang === l ? ' selected' : '')
        langBtn.textContent = l
        langBtn.onclick = () => {
          _selectedLang = l
          document.querySelectorAll('.aai .lang-opt').forEach(x => x.classList.remove('selected'))
          langBtn.classList.add('selected')
        }
        row.appendChild(langBtn)
      })
      wrap.appendChild(row)
    } else if (f.type === 'textarea') {
      const el = document.createElement('textarea')
      el.id = `aai-field_${f.id}`
      el.placeholder = f.placeholder
      el.value = _formData[`${n}_${f.id}`] || ''
      el.oninput = () => { _formData[`${n}_${f.id}`] = el.value }
      wrap.appendChild(el)
    } else {
      const el = document.createElement('input')
      el.type = f.type
      el.id = `aai-field_${f.id}`
      el.placeholder = f.placeholder
      el.value = _formData[`${n}_${f.id}`] || ''
      el.oninput = () => { _formData[`${n}_${f.id}`] = el.value }
      wrap.appendChild(el)
    }

    grid.appendChild(wrap)
  })

  body.appendChild(grid)

  if (n === 0) {
    const note = document.createElement('div')
    note.className = 'step0-note'
    note.innerHTML = '<strong>Tip:</strong> Fill this once per client. Copy the output and paste it into Steps 1–6. The more detail you add here, the better every other output will be.'
    body.appendChild(note)
  }
}

async function _generateContent() {
  const step = STEPS[_currentStep]
  const btn = document.getElementById('aai-genBtn')

  const data = { lang: _selectedLang }
  step.fields.forEach(f => {
    if (f.type !== 'lang') {
      data[f.id] = _formData[`${_currentStep}_${f.id}`] || ''
    }
  })

  const prompt = step.prompt(data)

  if (btn) {
    btn.disabled = true
    btn.innerHTML = '<span class="spin"><i class="ti ti-loader" aria-hidden="true"></i></span> Generating...'
  }

  const outputPanel = document.getElementById('aai-outputPanel')
  if (outputPanel) outputPanel.classList.add('visible')

  const outputLabel = document.getElementById('aai-outputLabel')
  if (outputLabel) outputLabel.textContent = step.title + ' — Output'

  const outputEl = document.getElementById('aai-outputContent')
  if (outputEl) outputEl.textContent = ''

  const cursor = document.createElement('span')
  cursor.className = 'streaming-cursor'
  if (outputEl) outputEl.appendChild(cursor)

  try {
    // Read JWT from storage (impersonation token takes priority)
    const _token =
      sessionStorage.getItem('archicrm_impersonation_token') ||
      localStorage.getItem('archicrm_token') ||
      ''

    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${_token}`,
      },
      body: JSON.stringify({
        stream: true,
        system: 'You are an expert marketing strategist and copywriter for professional service agencies in Morocco. You deliver precise, actionable, market-specific output. No filler, no generic advice.',
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6)
          if (dataStr === '[DONE]') continue
          try {
            const parsed = JSON.parse(dataStr)
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              fullText += parsed.delta.text
              if (outputEl) {
                outputEl.textContent = fullText
                outputEl.appendChild(cursor)
                outputEl.scrollTop = outputEl.scrollHeight
              }
            }
          } catch {}
        }
      }
    }

    cursor.remove()
    if (_currentStep === 0) _savedBriefs.main = fullText

    const stepBtn = document.querySelector(`.aai .step-btn[data-step="${_currentStep}"]`)
    if (stepBtn) stepBtn.classList.add('done')
    const stepNum = document.querySelector(`.aai .step-btn[data-step="${_currentStep}"] .step-num`)
    if (stepNum) stepNum.innerHTML = '<i class="ti ti-check" aria-hidden="true"></i>'

  } catch (err) {
    cursor.remove()
    if (outputEl) {
      outputEl.textContent = 'Erreur: ' + err.message + '\n\nVérifiez votre connexion et réessayez.'
    }
  }

  if (btn) {
    btn.disabled = false
    btn.innerHTML = '<i class="ti ti-sparkles" aria-hidden="true"></i> Generate'
  }
}

function _copyOutput(btnEl) {
  const text = document.getElementById('aai-outputContent')?.textContent || ''
  navigator.clipboard.writeText(text).then(() => {
    if (btnEl) {
      btnEl.innerHTML = '<i class="ti ti-check" aria-hidden="true"></i> Copied!'
      setTimeout(() => {
        btnEl.innerHTML = '<i class="ti ti-copy" aria-hidden="true"></i> Copy'
      }, 2000)
    }
  })
}

function _closeOutput() {
  const op = document.getElementById('aai-outputPanel')
  if (op) op.classList.remove('visible')
}

// ── Component ─────────────────────────────────────────────────────────────
export default function AgencyAI() {
  const { user, isImpersonating } = useAuth()

  // Guard: allow superadmin, admin, and impersonation sessions; block regular users
  if (user && user.role !== 'superadmin' && user.role !== 'admin' && !isImpersonating) {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    // Load Tabler Icons CDN (v3.31.0)
    if (!document.getElementById('tabler-icons-cdn')) {
      const link = document.createElement('link')
      link.id   = 'tabler-icons-cdn'
      link.rel  = 'stylesheet'
      link.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.31.0/tabler-icons.min.css'
      document.head.appendChild(link)
    }

    // Reset module state on mount so each page load starts fresh
    _currentStep = 0
    _selectedLang = 'French'

    // Initialise form
    _renderForm(0)

    // Activate first step button
    const firstBtn = document.querySelector('.aai .step-btn[data-step="0"]')
    if (firstBtn) firstBtn.classList.add('active')
  }, [])

  return (
    <>
      <style>{APP_CSS}</style>

      <div className="aai">
        {/* ── Top bar ── */}
        <div className="topbar">
          <div className="topbar-left">
            <div className="logo-dot" />
            <span className="logo-text">Architect Agency AI</span>
            <span className="logo-badge">Powered by Claude</span>
          </div>
          <span className="topbar-hint">Fill client info → Generate</span>
        </div>

        {/* ── Layout ── */}
        <div className="layout">

          {/* ── Sidebar ── */}
          <div className="sidebar">
            <div className="sidebar-section">
              <div className="sidebar-label">Workflow</div>

              {[
                { n: 0, name: 'Client Brief',    sub: 'Foundation' },
                { n: 1, name: 'Market Research', sub: 'Strategy' },
                { n: 2, name: 'Ad Copywriting',  sub: '3 variations' },
                { n: 3, name: 'Creative Brief',  sub: 'Visual direction' },
                { n: 4, name: 'Landing Page',    sub: 'Full copy' },
                { n: 5, name: 'Follow-up Msgs',  sub: '5-message sequence' },
                { n: 6, name: 'Client Report',   sub: 'Weekly update' },
              ].map(({ n, name, sub }) => (
                <button
                  key={n}
                  className={`step-btn${n === 0 ? ' active' : ''}`}
                  data-step={n}
                  onClick={() => _switchStep(n)}
                >
                  <div className="step-num">{n}</div>
                  <div>
                    <div className="step-name">{name}</div>
                    <div className="step-sub">{sub}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="sidebar-section sidebar-bonus-divider">
              <div className="sidebar-label">Bonus</div>
              <button
                className="step-btn"
                data-step="7"
                onClick={() => _switchStep(7)}
              >
                <div className="step-num" style={{ background: '#fef3ec', color: '#8b3a1e' }}>★</div>
                <div>
                  <div className="step-name">Sales Prep</div>
                  <div className="step-sub">Objection handler</div>
                </div>
              </button>
            </div>
          </div>

          {/* ── Main panel ── */}
          <div className="main-panel" id="aai-mainPanel">

            {/* Form area */}
            <div id="aai-formArea">
              <div className="panel-header">
                <h2 id="aai-stepTitle">Step 0 — Client Brief</h2>
                <p id="aai-stepDesc">Fill in your architect client's info. This feeds every other step.</p>
              </div>
              {/* formBody is filled by _renderForm() */}
              <div className="panel-body" id="aai-formBody" />
              <div className="generate-bar">
                <span className="gen-info" id="aai-genInfo">
                  Run Step 0 first — its output powers all other steps
                </span>
                <button
                  className="gen-btn"
                  id="aai-genBtn"
                  onClick={() => _generateContent()}
                >
                  <i className="ti ti-sparkles" aria-hidden="true" /> Generate
                </button>
              </div>
            </div>

            {/* Output panel */}
            <div className="output-panel" id="aai-outputPanel">
              <div className="output-header">
                <span id="aai-outputLabel">Generated output</span>
                <div className="output-actions">
                  <button
                    className="out-btn"
                    onClick={e => _copyOutput(e.currentTarget)}
                  >
                    <i className="ti ti-copy" aria-hidden="true" /> Copy
                  </button>
                  <button
                    className="out-btn"
                    onClick={() => _closeOutput()}
                  >
                    <i className="ti ti-arrow-left" aria-hidden="true" /> Back
                  </button>
                </div>
              </div>
              <div className="output-content" id="aai-outputContent" />
            </div>

          </div>{/* /main-panel */}
        </div>{/* /layout */}
      </div>{/* /aai */}
    </>
  )
}
