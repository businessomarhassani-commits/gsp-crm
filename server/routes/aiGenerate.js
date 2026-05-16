const express = require('express')
const { auth } = require('../middleware/auth')
const router = express.Router()

// POST /api/ai/generate
// Proxy to Anthropic API — supports streaming SSE.
// Requires valid CRM JWT (auth middleware).
router.post('/generate', auth, async (req, res) => {
  const { messages, system, stream = true } = req.body
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY non configuré sur le serveur' })
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages requis' })
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        stream: !!stream,
        ...(system ? { system } : {}),
        messages,
      }),
    })

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.json().catch(() => ({}))
      return res.status(anthropicRes.status).json({
        error: errBody.error?.message || 'Erreur API Anthropic',
      })
    }

    if (stream) {
      // Forward the SSE stream directly to the client
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.flushHeaders()

      const reader = anthropicRes.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(decoder.decode(value, { stream: true }))
      }
      res.end()
    } else {
      const data = await anthropicRes.json()
      res.json(data)
    }
  } catch (err) {
    console.error('[ai/generate]', err.message)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erreur serveur lors de la génération' })
    } else {
      res.end()
    }
  }
})

module.exports = router
