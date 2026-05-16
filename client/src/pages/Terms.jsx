import { Link } from 'react-router-dom'

const Section = ({ title, children }) => (
  <div className="space-y-3">
    <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
    <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-2">{children}</div>
  </div>
)

export default function Terms() {
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Conditions d'utilisation</h1>
          <p className="text-sm text-gray-400">Dernière mise à jour : avril 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-white/5 p-8 space-y-8">

          <Section title="1. Acceptation des conditions">
            <p>
              En accédant à ArchiCRM et en utilisant ses services, vous acceptez sans réserve les
              présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez
              ne pas utiliser ce service.
            </p>
          </Section>

          <Section title="2. Description du service">
            <p>
              ArchiCRM est un logiciel de gestion de la relation client (CRM) destiné aux
              architectes et cabinets d'architecture. Il permet la gestion des leads, clients,
              projets et l'automatisation de l'importation de prospects depuis des plateformes
              publicitaires (Meta Ads).
            </p>
            <p>
              L'accès au service est fourni via une interface web accessible après inscription
              et connexion. ArchiCRM se réserve le droit de modifier, suspendre ou interrompre
              tout ou partie du service à tout moment.
            </p>
          </Section>

          <Section title="3. Conditions d'accès">
            <p>Pour utiliser ArchiCRM, vous devez :</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Être une personne physique ou morale exerçant une activité professionnelle</li>
              <li>Fournir des informations exactes lors de l'inscription</li>
              <li>Maintenir la confidentialité de vos identifiants de connexion</li>
              <li>Ne pas partager votre compte avec des tiers</li>
              <li>Être âgé d'au moins 18 ans</li>
            </ul>
          </Section>

          <Section title="4. Utilisation acceptable">
            <p>Il est strictement interdit d'utiliser ArchiCRM pour :</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Stocker des données de manière illégale ou sans consentement</li>
              <li>Tenter d'accéder aux comptes ou données d'autres utilisateurs</li>
              <li>Introduire des virus, malwares ou tout code malveillant</li>
              <li>Effectuer des attaques par déni de service (DDoS)</li>
              <li>Contourner les mesures de sécurité de la plateforme</li>
              <li>Utiliser le service à des fins illégales ou frauduleuses</li>
            </ul>
          </Section>

          <Section title="5. Responsabilités de l'utilisateur">
            <p>
              L'utilisateur est seul responsable des données qu'il saisit dans ArchiCRM,
              notamment les informations relatives à ses leads et clients. Il s'engage à
              respecter la réglementation applicable en matière de protection des données
              personnelles (RGPD, Loi 09-08) lorsqu'il collecte et traite des données
              de tiers via la plateforme.
            </p>
            <p>
              L'utilisateur est responsable de la sécurité de ses identifiants et doit
              notifier immédiatement ArchiCRM en cas d'utilisation non autorisée de son compte.
            </p>
          </Section>

          <Section title="6. Responsabilité d'ArchiCRM">
            <p>
              ArchiCRM s'efforce de maintenir la disponibilité et la fiabilité du service,
              mais ne peut garantir un fonctionnement ininterrompu. En aucun cas ArchiCRM
              ne pourra être tenu responsable :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Des pertes de données résultant d'une utilisation incorrecte</li>
              <li>Des interruptions de service dues à des causes extérieures</li>
              <li>Des dommages indirects liés à l'utilisation du service</li>
              <li>Des actions de tiers (Meta, fournisseurs d'hébergement, etc.)</li>
            </ul>
          </Section>

          <Section title="7. Propriété intellectuelle">
            <p>
              L'ensemble des éléments constituant ArchiCRM (logo, design, code source,
              fonctionnalités, textes) sont protégés par le droit de la propriété
              intellectuelle et appartiennent exclusivement à ArchiCRM.
            </p>
            <p>
              Toute reproduction, distribution, modification ou exploitation non autorisée
              de ces éléments est strictement interdite et peut faire l'objet de poursuites.
            </p>
            <p>
              Les données saisies par l'utilisateur restent sa propriété exclusive.
              ArchiCRM ne revendique aucun droit sur ces données.
            </p>
          </Section>

          <Section title="8. Tarification et paiement">
            <p>
              Les conditions tarifaires sont communiquées lors de l'inscription ou sur
              demande auprès de notre équipe commerciale. ArchiCRM se réserve le droit
              de modifier ses tarifs avec un préavis raisonnable notifié par email.
            </p>
            <p>
              En cas de non-paiement, l'accès au compte peut être suspendu jusqu'à
              régularisation de la situation.
            </p>
          </Section>

          <Section title="9. Résiliation">
            <p>
              <strong className="text-gray-700 dark:text-gray-300">Par l'utilisateur :</strong>{' '}
              Vous pouvez résilier votre compte à tout moment en contactant notre support.
              Les données seront supprimées dans un délai de 30 jours suivant la demande.
            </p>
            <p>
              <strong className="text-gray-700 dark:text-gray-300">Par ArchiCRM :</strong>{' '}
              Nous nous réservons le droit de suspendre ou de résilier tout compte en cas
              de violation des présentes conditions, sans préavis et sans indemnité.
            </p>
          </Section>

          <Section title="10. Droit applicable">
            <p>
              Les présentes conditions sont régies par le droit marocain. En cas de litige,
              les parties s'engagent à rechercher une solution amiable avant tout recours
              judiciaire. À défaut, les tribunaux compétents de Casablanca seront seuls
              compétents.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              Pour toute question relative aux présentes conditions d'utilisation :
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
          <Link to="/privacy" className="text-sm text-[#C9A84C] hover:underline">
            Politique de confidentialité →
          </Link>
        </div>

      </div>
    </div>
  )
}
