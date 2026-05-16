import { Link } from 'react-router-dom'

const Section = ({ title, children }) => (
  <div className="space-y-3">
    <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
    <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-2">{children}</div>
  </div>
)

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-[#C9A84C] rounded-lg flex items-center justify-center text-[#1a2640] font-bold text-lg">A</div>
          <span className="font-bold text-gray-900 dark:text-white text-lg">ArchiCRM</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Politique de confidentialité</h1>
          <p className="text-sm text-gray-400">Dernière mise à jour : avril 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-white/5 p-8 space-y-8">

          <Section title="1. Introduction">
            <p>
              ArchiCRM s'engage à protéger la vie privée de ses utilisateurs. Cette politique décrit
              comment nous collectons, utilisons et protégeons vos données personnelles conformément
              au Règlement Général sur la Protection des Données (RGPD) et à la législation marocaine
              en vigueur (Loi 09-08).
            </p>
          </Section>

          <Section title="2. Données collectées">
            <p>Dans le cadre de l'utilisation d'ArchiCRM, nous collectons les données suivantes :</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-gray-700 dark:text-gray-300">Données de compte :</strong> nom complet, adresse email, mot de passe (chiffré)</li>
              <li><strong className="text-gray-700 dark:text-gray-300">Données de leads :</strong> nom, téléphone, email, ville, type de projet, budget</li>
              <li><strong className="text-gray-700 dark:text-gray-300">Données de clients :</strong> informations contractuelles, valeur de projet</li>
              <li><strong className="text-gray-700 dark:text-gray-300">Données de navigation :</strong> logs de connexion, adresse IP</li>
            </ul>
          </Section>

          <Section title="3. Utilisation des données">
            <p>Les données collectées sont utilisées exclusivement aux fins suivantes :</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Gestion et suivi des leads et clients (CRM)</li>
              <li>Importation automatique des leads depuis Meta Ads</li>
              <li>Génération de statistiques et rapports d'activité</li>
              <li>Envoi de rappels et notifications internes</li>
              <li>Amélioration du service et support technique</li>
            </ul>
            <p>
              Nous ne vendons, ne louons ni ne partageons vos données avec des tiers à des fins
              commerciales.
            </p>
          </Section>

          <Section title="4. Stockage et sécurité">
            <p>
              Vos données sont stockées sur des serveurs sécurisés fournis par Supabase (PostgreSQL)
              hébergés en Europe. Nous appliquons les mesures de sécurité suivantes :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Chiffrement des mots de passe (bcrypt)</li>
              <li>Authentification par token JWT à durée limitée</li>
              <li>Connexions HTTPS uniquement</li>
              <li>Accès aux données strictement limité par utilisateur (Row Level Security)</li>
            </ul>
          </Section>

          <Section title="5. Durée de conservation">
            <p>
              Vos données sont conservées aussi longtemps que votre compte est actif. En cas de
              suppression de compte, toutes vos données personnelles sont effacées dans un délai de
              30 jours, sauf obligation légale contraire.
            </p>
          </Section>

          <Section title="6. Vos droits">
            <p>Conformément à la réglementation applicable, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-gray-700 dark:text-gray-300">Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
              <li><strong className="text-gray-700 dark:text-gray-300">Droit de rectification :</strong> corriger des données inexactes</li>
              <li><strong className="text-gray-700 dark:text-gray-300">Droit à l'effacement :</strong> demander la suppression de vos données</li>
              <li><strong className="text-gray-700 dark:text-gray-300">Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
              <li><strong className="text-gray-700 dark:text-gray-300">Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
            </ul>
            <p>Pour exercer ces droits, contactez-nous à l'adresse ci-dessous.</p>
          </Section>

          <Section title="7. Cookies">
            <p>
              ArchiCRM est une application web qui utilise le stockage local (localStorage) pour
              maintenir votre session de connexion. Aucun cookie de tracking ou publicitaire n'est
              utilisé.
            </p>
          </Section>

          <Section title="8. Contact">
            <p>
              Pour toute question relative à cette politique de confidentialité ou pour exercer vos
              droits, contactez notre responsable de la protection des données :
            </p>
            <p>
              <strong className="text-gray-700 dark:text-gray-300">Email :</strong>{' '}
              <a href="mailto:admin@crm.archi" className="text-[#C9A84C] hover:underline">
                admin@crm.archi
              </a>
            </p>
          </Section>

        </div>

        {/* Back link */}
        <div className="mt-8 flex items-center justify-between">
          <Link to="/login" className="text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            ← Retour à la connexion
          </Link>
          <Link to="/terms" className="text-sm text-[#C9A84C] hover:underline">
            Conditions d'utilisation →
          </Link>
        </div>

      </div>
    </div>
  )
}
