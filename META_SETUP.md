# ArchiCRM — Meta Ads Integration Setup Guide

This guide explains how to configure Meta (Facebook/Instagram) Ads lead integration so that leads from your Meta Instant Forms flow automatically into ArchiCRM.

---

## Overview

When a prospect fills a Meta Instant Form on Facebook or Instagram, Meta sends a webhook event to ArchiCRM. The system then:
1. Fetches the lead data from the Meta Graph API
2. Maps the form fields to ArchiCRM fields (name, phone, email, city, budget, etc.)
3. Creates a new Lead with `source = "Meta Ads"` and `status = "Nouveau"`
4. Logs the event in `meta_leads_log` for traceability

---

## Step 1 — Create a Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com) and log in
2. Click **My Apps → Create App**
3. Select **Business** as app type
4. Fill in the app name (e.g., `ArchiCRM`) and contact email
5. Once created, note your **App ID** and **App Secret** (Settings → Basic)

---

## Step 2 — Configure App Permissions

In your Meta App dashboard:

1. Go to **Add a Product** → add **Webhooks** and **Lead Ads Testing** (for testing)
2. Under **App Review → Permissions and Features**, request:
   - `leads_retrieval`
   - `pages_manage_ads`
   - `pages_read_engagement`
   - `pages_show_list`

> For development/testing, these permissions work without App Review if you're a tester/developer on the app.

---

## Step 3 — Configure OAuth Redirect URI

1. In your Meta App, go to **Facebook Login → Settings**
2. Add your callback URL to **Valid OAuth Redirect URIs**:
   ```
   https://your-server-url.com/api/meta/callback
   ```
   Replace `your-server-url.com` with your actual server URL.

---

## Step 4 — Set Environment Variables

Add these to your server `.env` file:

```env
META_APP_ID=your_meta_app_id_here
META_APP_SECRET=your_meta_app_secret_here
META_WEBHOOK_VERIFY_TOKEN=archicrm_webhook_2024
SERVER_URL=https://your-server-url.com
FRONTEND_URL=https://your-frontend-url.com
```

- `META_APP_ID` — from Meta App dashboard (Settings → Basic)
- `META_APP_SECRET` — from Meta App dashboard (Settings → Basic → App Secret → Show)
- `META_WEBHOOK_VERIFY_TOKEN` — any random string; must match what you enter in the webhook config
- `SERVER_URL` — your Express server public URL (used to construct the OAuth callback URL)
- `FRONTEND_URL` — your React frontend URL (used for OAuth redirects)

---

## Step 5 — Configure the Webhook in Meta

1. In your Meta App, go to **Webhooks**
2. Click **Add Callback URL**
3. Set:
   - **Callback URL**: `https://your-server-url.com/api/webhook/meta`
   - **Verify Token**: same value as `META_WEBHOOK_VERIFY_TOKEN` in your `.env`
4. Click **Verify and Save**
5. Subscribe to the **Page** object → field **`leadgen`**

---

## Step 6 — Connect from the App

1. Log in to ArchiCRM as a regular user
2. Go to **Intégrations** (sidebar)
3. Click **Connecter Meta Ads**
4. A Facebook OAuth popup will open — authorize the app and select your Business Page
5. If you have multiple pages, you'll be prompted to select the correct one
6. Once connected, the status shows **Connecté** with a lead count

---

## Database Tables

### `meta_connections`
Stores one row per user. Tracks the connected Facebook Page and page access token.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | ArchiCRM user (unique) |
| `page_id` | VARCHAR | Facebook Page ID |
| `page_name` | VARCHAR | Display name of the page |
| `access_token` | TEXT | Long-lived page access token (60 days) |
| `pending_pages` | JSONB | Temporary store for multi-page selection |
| `is_active` | BOOLEAN | Whether the connection is active |

### `meta_leads_log`
Audit log of all leads received from Meta.

| Column | Type | Description |
|--------|------|-------------|
| `meta_lead_id` | VARCHAR | Meta's unique lead ID (unique constraint) |
| `lead_id` | UUID | ArchiCRM lead that was created |
| `form_id` | VARCHAR | Meta form ID |
| `page_id` | VARCHAR | Facebook Page ID |
| `raw_data` | JSONB | Full raw response from Meta Graph API |

---

## Field Mapping

ArchiCRM automatically maps Meta form field names to CRM fields using fuzzy matching:

| Meta field name(s) | ArchiCRM field |
|--------------------|----------------|
| `full_name`, `name`, `nom_complet` | `name` |
| `first_name`, `prénom` | combined into `name` |
| `last_name`, `nom` | combined into `name` |
| `phone_number`, `phone`, `téléphone`, `mobile` | `phone` |
| `email`, `email_address` | `email` |
| `city`, `ville` | `city` |
| `project_type`, `type_projet` | `project_type` |
| `budget`, `budget_estimé` | `budget` |

If no name field is found, the lead is named `Lead Meta Ads DD/MM/YYYY`.

---

## Token Renewal

Page access tokens from Meta long-lived exchange last ~60 days. ArchiCRM does **not** auto-renew tokens. When a token expires:
1. The webhook will fail to fetch lead data (Graph API returns an error)
2. The error is logged to console
3. The user must reconnect via **Intégrations → Déconnecter → Connecter Meta Ads**

Future enhancement: implement token expiry detection and notify the user to reconnect.

---

## Testing

1. In the Meta App dashboard, go to **Lead Ads Testing**
2. Select your Page and Form
3. Click **Preview Form** → submit test data
4. Meta sends a webhook event to your server
5. Check server logs for: `✓ Meta lead {leadgen_id} inserted as lead {id} for user {user_id}`
6. The lead appears in ArchiCRM with source "Meta Ads"
