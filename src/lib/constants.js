export const PROSPECT_STATUSES = [
  { value: 'new',            label: 'New',              color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  { value: 'contacted',      label: 'Contacted',        color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { value: 'interested',     label: 'Interested',       color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { value: 'proposal_sent',  label: 'Proposal Sent',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { value: 'client',         label: 'Client',           color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { value: 'not_interested', label: 'Not Interested',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  { value: 'follow_up_later','label': 'Follow Up Later', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
]

export const OUTREACH_TYPES = [
  { value: 'cold_call',        label: 'Cold Call',         icon: 'Phone' },
  { value: 'cold_email',       label: 'Cold Email',        icon: 'Mail' },
  { value: 'instagram_dm',     label: 'Instagram DM',      icon: 'Instagram' },
  { value: 'linkedin_message', label: 'LinkedIn Message',  icon: 'Linkedin' },
  { value: 'door_to_door',     label: 'Door to Door',      icon: 'DoorOpen' },
]

export const TEAM_ROLES = [
  { value: 'owner',       label: 'Owner',      description: 'Full access to everything' },
  { value: 'admin',       label: 'Admin',      description: 'Full access except billing' },
  { value: 'sales_rep',   label: 'Sales Rep',  description: 'Prospects, outreach, tasks' },
  { value: 'copywriter',  label: 'Copywriter', description: 'Copy Studio and Creative Studio only' },
  { value: 'viewer',      label: 'Viewer',     description: 'Read-only access' },
]

export const CURRENCIES = [
  { value: 'MAD', label: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham' },
  { value: 'USD', label: 'USD', symbol: '$',    name: 'US Dollar' },
  { value: 'EUR', label: 'EUR', symbol: '€',    name: 'Euro' },
]

export const LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'French',  label: 'French' },
  { value: 'Arabic',  label: 'Arabic' },
  { value: 'Darija',  label: 'Darija (Moroccan Arabic)' },
]

export const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual',       label: 'Casual' },
  { value: 'aggressive',   label: 'Aggressive' },
  { value: 'friendly',     label: 'Friendly' },
]

export const COPY_TYPES = [
  { value: 'cold_call_script',    label: 'Cold Call Script' },
  { value: 'cold_email',          label: 'Cold Email' },
  { value: 'instagram_dm',        label: 'Instagram DM' },
  { value: 'linkedin_message',    label: 'LinkedIn Message' },
  { value: 'door_to_door_pitch',  label: 'Door to Door Pitch' },
  { value: 'meta_ad_copy',        label: 'Meta Ad Copy' },
  { value: 'landing_page_copy',   label: 'Landing Page Copy' },
  { value: 'lead_funnel_copy',    label: 'Lead Funnel Copy' },
]

export const VIDEO_DURATIONS = [
  { value: '15s', label: '15 seconds' },
  { value: '30s', label: '30 seconds' },
  { value: '60s', label: '60 seconds' },
]

export const PROSPECT_SOURCES = [
  'Google Maps', 'Instagram', 'LinkedIn', 'Referral', 'Cold Call', 'Door to Door', 'Other'
]

export const NICHE_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#f97316', '#84cc16', '#6366f1',
]

export const CALL_OUTCOMES = ['No Answer', 'Voicemail', 'Not Interested', 'Interested', 'Callback Requested', 'Proposal Sent']
export const EMAIL_RESPONSES = ['No Reply', 'Opened', 'Replied - Interested', 'Replied - Not Interested', 'Bounced']
export const DM_RESPONSES = ['Not Seen', 'Seen - No Reply', 'Replied - Interested', 'Replied - Not Interested']

export const PAYMENT_STATUSES = [
  { value: 'paid',    label: 'Paid',    color: '#10b981' },
  { value: 'pending', label: 'Pending', color: '#f59e0b' },
  { value: 'overdue', label: 'Overdue', color: '#ef4444' },
]

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

export const SCRAPER_SOURCES = [
  { value: 'google_maps', label: 'Google Maps' },
  { value: 'instagram',   label: 'Instagram' },
  { value: 'linkedin',    label: 'LinkedIn' },
]

export const ROLE_PERMISSIONS = {
  owner:      ['dashboard','prospects','clients','outreach','scraper','copy_studio','creative_studio','tasks','niches','team','settings'],
  admin:      ['dashboard','prospects','clients','outreach','scraper','copy_studio','creative_studio','tasks','niches','settings'],
  sales_rep:  ['dashboard','prospects','clients','outreach','tasks'],
  copywriter: ['copy_studio','creative_studio'],
  viewer:     ['dashboard','prospects','clients'],
}
