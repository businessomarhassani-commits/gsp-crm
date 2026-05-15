-- Landing Content Table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.landing_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section TEXT NOT NULL,
  field TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(section, field)
);

-- Seed with current landing page content
INSERT INTO public.landing_content (section, field, value) VALUES
-- HERO
('hero', 'title', 'Arrêtez de perdre\nvos leads.'),
('hero', 'subtitle', 'ArchiCRM transforme chaque prospect en client. Conçu exclusivement pour les cabinets d''architecture marocains.'),
('hero', 'button_primary_text', 'Commencer gratuitement'),
('hero', 'button_primary_link', 'https://app.archicrm.ma/signup'),
('hero', 'button_secondary_text', 'Voir la démo'),
('hero', 'badge_urgency', 'Offre de lancement — 30 jours gratuits'),
-- FEATURES
('features', 'feature_0_title', 'Gestion des Leads'),
('features', 'feature_0_desc', 'Suivez chaque prospect de la première prise de contact jusqu''au contrat signé.'),
('features', 'feature_0_icon', 'Users'),
('features', 'feature_1_title', 'Pipeline Visuel'),
('features', 'feature_1_desc', 'Visualisez l''avancement de vos projets avec un tableau Kanban intuitif.'),
('features', 'feature_1_icon', 'Kanban'),
('features', 'feature_2_title', 'Intégration Meta Ads'),
('features', 'feature_2_desc', 'Recevez automatiquement vos leads Facebook et Instagram directement dans le CRM.'),
('features', 'feature_2_icon', 'Zap'),
('features', 'feature_3_title', 'Rappels & Suivi'),
('features', 'feature_3_desc', 'Ne manquez plus jamais un rendez-vous ou une relance client.'),
('features', 'feature_3_icon', 'Bell'),
('features', 'feature_4_title', 'Suivi Financier'),
('features', 'feature_4_desc', 'Suivez votre chiffre d''affaires et vos deals conclus mois par mois.'),
('features', 'feature_4_icon', 'TrendingUp'),
('features', 'feature_5_title', 'Tableau de Bord'),
('features', 'feature_5_desc', 'Des statistiques claires pour piloter votre activité en un coup d''œil.'),
('features', 'feature_5_icon', 'BarChart2'),
('features', 'feature_6_title', 'API & Intégrations'),
('features', 'feature_6_desc', 'Connectez ArchiCRM à vos outils existants via notre API simple.'),
('features', 'feature_6_icon', 'Link2'),
-- PRICING (3 tiers — used by landing page and admin editor)
('pricing', 'tiers', '[{"name":"Starter","price":"490","currency":"DH","featured":false,"features":[{"text":"CRM complet","included":true},{"text":"Jusqu''à 100 leads","included":true},{"text":"Pipeline kanban","included":true},{"text":"Rappels","included":true},{"text":"Site web IA","included":false},{"text":"Meta Ads","included":false},{"text":"App desktop","included":false}]},{"name":"Pro","price":"890","currency":"DH","featured":true,"badge":"Le plus populaire","features":[{"text":"CRM complet","included":true},{"text":"Leads illimités","included":true},{"text":"Pipeline kanban","included":true},{"text":"Rappels","included":true},{"text":"Site web IA (1 site)","included":true},{"text":"Meta Ads","included":true},{"text":"App desktop","included":false}]},{"name":"Premium","price":"1490","currency":"DH","featured":false,"features":[{"text":"CRM complet","included":true},{"text":"Leads illimités","included":true},{"text":"Pipeline kanban","included":true},{"text":"Rappels","included":true},{"text":"Sites web IA (3 sites)","included":true},{"text":"Meta Ads","included":true},{"text":"App desktop","included":true}]}]'),
-- Legacy single-plan fields (kept for backward compat with AI editor)
('pricing', 'plan_name', 'Pro'),
('pricing', 'price', '890'),
('pricing', 'currency', 'DH'),
('pricing', 'badge_text', 'Le plus populaire'),
('pricing', 'cta_text', 'Commencer'),
('pricing', 'features', '["CRM complet","Leads illimités","Pipeline kanban","Rappels","Site web IA (1 site)","Meta Ads"]'),
-- TESTIMONIALS
('testimonials', 'testimonial_0_name', 'Karim Bensouda'),
('testimonials', 'testimonial_0_role', 'Architecte DPLG, Casablanca'),
('testimonials', 'testimonial_0_text', 'En 3 mois, j''ai doublé mon taux de conversion grâce au suivi automatique des leads. Je ne peux plus m''en passer.'),
('testimonials', 'testimonial_0_stars', '5'),
('testimonials', 'testimonial_1_name', 'Naïla El Fassi'),
('testimonials', 'testimonial_1_role', 'Cabinet d''Architecture, Rabat'),
('testimonials', 'testimonial_1_text', 'L''intégration Meta Ads m''a sauvé la mise. Mes leads Facebook arrivent directement dans le CRM, plus aucun oublié.'),
('testimonials', 'testimonial_1_stars', '5'),
-- FAQ
('faq', 'faq_0_question', 'Est-ce que l''essai est vraiment gratuit ?'),
('faq', 'faq_0_answer', 'Oui, 30 jours complets sans aucune carte bancaire requise. Vous accédez à toutes les fonctionnalités dès le premier jour.'),
('faq', 'faq_1_question', 'Puis-je annuler à tout moment ?'),
('faq', 'faq_1_answer', 'Oui, aucun engagement. Vous annulez quand vous voulez, sans frais ni justification nécessaire.'),
('faq', 'faq_2_question', 'Le CRM est-il en arabe ?'),
('faq', 'faq_2_answer', 'L''interface est entièrement en français, optimisée pour le marché marocain. Une version en arabe est prévue dans une prochaine mise à jour.'),
('faq', 'faq_3_question', 'Comment fonctionne l''intégration Meta Ads ?'),
('faq', 'faq_3_answer', 'Vous connectez votre page Facebook en 2 clics depuis les paramètres. Dès lors, chaque lead généré par vos formulaires Facebook ou Instagram est automatiquement importé dans ArchiCRM en temps réel.'),
('faq', 'faq_4_question', 'Mes données sont-elles sécurisées ?'),
('faq', 'faq_4_answer', 'Oui, toutes vos données sont hébergées sur des serveurs sécurisés avec chiffrement SSL. Vous restez propriétaire de vos données à tout moment.'),
('faq', 'faq_5_question', 'Puis-je importer mes leads existants ?'),
('faq', 'faq_5_answer', 'Oui, vous pouvez importer vos leads depuis Excel ou CSV directement dans ArchiCRM.'),
-- FINAL CTA
('cta', 'headline', 'Prêt à ne plus perdre\nun seul lead ?'),
('cta', 'subheadline', 'Rejoignez les architectes marocains qui pilotent leur activité avec ArchiCRM.'),
('cta', 'button_text', 'Commencer mon essai gratuit — 30 jours')
ON CONFLICT (section, field) DO NOTHING;
