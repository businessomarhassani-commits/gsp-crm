-- ArchiCRM Database Schema
-- Run this in your Supabase SQL Editor

-- Enable pgcrypto for password hashing in seed data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- USERS
-- ============================================================
DROP TABLE IF EXISTS history CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  api_key UUID UNIQUE DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- LEADS
-- ============================================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  project_type VARCHAR(100),
  city VARCHAR(100),
  budget VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Nouveau' CHECK (status IN ('Nouveau','Contacté','Rendez-vous','Proposition','Gagné','Perdu')),
  source VARCHAR(100),
  last_contact_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, phone)
);

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  project_type VARCHAR(100),
  city VARCHAR(100),
  project_value NUMERIC(12, 2),
  closing_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- REMINDERS
-- ============================================================
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reminder_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- HISTORY
-- ============================================================
CREATE TABLE history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID,
  client_id UUID,
  action VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SEED DATA  (passwords hashed with pgcrypto bcrypt)
-- ============================================================
INSERT INTO users (name, email, password, role) VALUES
  ('Admin Système',   'admin@archicrm.ma',   crypt('Admin2024!',  gen_salt('bf', 12)), 'admin'),
  ('Karim Benali',    'karim@archicrm.ma',   crypt('User2024!',   gen_salt('bf', 12)), 'user'),
  ('Sara Alami',      'sara@archicrm.ma',    crypt('User2024!',   gen_salt('bf', 12)), 'user'),
  ('Youssef Chaoui',  'youssef@archicrm.ma', crypt('User2024!',   gen_salt('bf', 12)), 'user');

-- Seed leads for Karim
DO $$
DECLARE
  karim_id UUID := (SELECT id FROM users WHERE email = 'karim@archicrm.ma');
  lead1 UUID; lead2 UUID; lead3 UUID; lead4 UUID; lead5 UUID; lead6 UUID;
  client1 UUID;
BEGIN

  INSERT INTO leads (user_id, name, phone, email, project_type, city, budget, status, source, last_contact_date)
  VALUES
    (karim_id,'Mehdi Laaroussi','+212661001001','mehdi@example.ma','Résidentiel','Casablanca','500.000 – 1.000.000 DH','Gagné','Instagram', NOW()-INTERVAL '10 days')
  RETURNING id INTO lead1;

  INSERT INTO leads (user_id, name, phone, email, project_type, city, budget, status, source, last_contact_date)
  VALUES
    (karim_id,'Nadia Tahir','+212661002002','nadia@example.ma','Commercial','Rabat','1.000.000 – 2.000.000 DH','Proposition','Référence', NOW()-INTERVAL '5 days')
  RETURNING id INTO lead2;

  INSERT INTO leads (user_id, name, phone, email, project_type, city, budget, status, source, last_contact_date)
  VALUES
    (karim_id,'Omar Benkirane','+212661003003','omar@example.ma','Rénovation','Marrakech','200.000 – 500.000 DH','Rendez-vous','Site web', NOW()-INTERVAL '2 days')
  RETURNING id INTO lead3;

  INSERT INTO leads (user_id, name, phone, email, project_type, city, budget, status, source, last_contact_date)
  VALUES
    (karim_id,'Fatima Zahra','+212661004004','fatima@example.ma','Extension','Fès','100.000 – 200.000 DH','Contacté','Appel direct', NOW()-INTERVAL '1 day')
  RETURNING id INTO lead4;

  INSERT INTO leads (user_id, name, phone, email, project_type, city, budget, status, source, last_contact_date)
  VALUES
    (karim_id,'Rachid Moussaoui','+212661005005','rachid@example.ma','Design intérieur','Agadir','50.000 – 100.000 DH','Nouveau','Instagram', NOW())
  RETURNING id INTO lead5;

  INSERT INTO leads (user_id, name, phone, email, project_type, city, budget, status, source, last_contact_date)
  VALUES
    (karim_id,'Amina Idrissi','+212661006006','amina@example.ma','Résidentiel','Casablanca','200.000 – 500.000 DH','Perdu','Référence', NOW()-INTERVAL '20 days')
  RETURNING id INTO lead6;

  -- Client from won lead
  INSERT INTO clients (user_id, lead_id, name, phone, email, project_type, city, project_value, closing_date, notes)
  VALUES (karim_id, lead1, 'Mehdi Laaroussi', '+212661001001', 'mehdi@example.ma', 'Résidentiel', 'Casablanca', 750000, NOW()-INTERVAL '8 days', 'Villa moderne 4 chambres avec piscine. Client très satisfait.')
  RETURNING id INTO client1;

  -- Reminders
  INSERT INTO reminders (user_id, lead_id, client_id, title, description, reminder_date)
  VALUES
    (karim_id, lead2, NULL, 'Relance Nadia Tahir', 'Envoyer la proposition finale révisée', NOW()+INTERVAL '1 day'),
    (karim_id, lead3, NULL, 'Rendez-vous Omar Benkirane', 'Visite du chantier à Marrakech', NOW()+INTERVAL '3 days'),
    (karim_id, NULL, client1, 'Suivi Mehdi Laaroussi', 'Appel de satisfaction 1 mois après livraison', NOW()+INTERVAL '22 days');

  -- History
  INSERT INTO history (user_id, lead_id, client_id, action, description)
  VALUES
    (karim_id, lead1, NULL, 'Nouveau lead',         'Lead créé via Instagram'),
    (karim_id, lead1, NULL, 'Changement de statut', 'Statut: Nouveau → Contacté'),
    (karim_id, lead1, NULL, 'Changement de statut', 'Statut: Contacté → Rendez-vous'),
    (karim_id, lead1, NULL, 'Changement de statut', 'Statut: Rendez-vous → Proposition'),
    (karim_id, lead1, client1, 'Client gagné',       'Mehdi Laaroussi converti en client – 750 000 DH');
END $$;

-- Seed leads for Sara
DO $$
DECLARE
  sara_id UUID := (SELECT id FROM users WHERE email = 'sara@archicrm.ma');
  lead1 UUID; client1 UUID;
BEGIN
  INSERT INTO leads (user_id, name, phone, email, project_type, city, budget, status, source)
  VALUES (sara_id,'Hassan Ouali','+212662001001','hassan@mail.ma','Commercial','Casablanca','2.000.000+ DH','Proposition','Salon')
  RETURNING id INTO lead1;

  INSERT INTO leads (user_id, name, phone, email, project_type, city, budget, status, source)
  VALUES (sara_id,'Zineb Benhaddou','+212662002002','zineb@mail.ma','Résidentiel','Rabat','500.000 – 1.000.000 DH','Gagné','Référence');

  INSERT INTO clients (user_id, name, phone, email, project_type, city, project_value, closing_date)
  VALUES (sara_id,'Zineb Benhaddou','+212662002002','zineb@mail.ma','Résidentiel','Rabat',920000,NOW()-INTERVAL '15 days');
END $$;
