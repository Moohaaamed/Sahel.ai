import { useState, useMemo } from 'react';
import { ROUTES } from '../lib/routes';
import { useLanguage } from '../i18n';
import MarketingHeader from './layout/MarketingHeader';
import MarketingFooter from './layout/MarketingFooter';

const BLOG_POSTS = [
  {
    id: 1,
    title: "Comment créer votre chatbot IA en 5 minutes avec Sahel.ai",
    category: "Tutoriel",
    date: "15 mai 2026",
    readTime: "5 min",
    summary: "Guide pas à pas pour un propriétaire de commerce : remplir le formulaire, uploader son PDF, obtenir son lien et son QR code. Capture d'écran à chaque étape.",
    content: "Vous pensez que déployer un assistant IA pour votre commerce est compliqué et réservé aux grandes entreprises ? Détrompez-vous. Avec Sahel.ai, vous pouvez créer un chatbot intelligent, un mini-site professionnel et un QR code personnalisé en moins de 5 minutes — sans écrire une seule ligne de code.\n\nÉtape 1 : Rendez-vous sur Sahel.ai et cliquez sur \"Commencer\". Vous n'avez même pas besoin de créer un compte pour démarrer. Remplissez simplement le nom de votre commerce, votre secteur d'activité et vos coordonnées.\n\nÉtape 2 : Uploadez vos documents. Ce peut être votre menu en PDF, votre liste de tarifs, vos horaires d'ouverture, ou même un simple document Word décrivant vos services. Sahel.ai va lire et indexer automatiquement toutes ces informations.\n\nÉtape 3 : Personnalisez votre mini-site. Choisissez une couleur principale, ajoutez votre logo, et sélectionnez les informations que vous souhaitez afficher : adresse, téléphone, lien WhatsApp, horaires, etc. Le mini-site est responsive et prêt à l'emploi.\n\nÉtape 4 : Obtenez votre lien et votre QR code. Votre mini-site est accessible à l'adresse sahel.ai/business/votre-commerce. Téléchargez votre QR code et imprimez-le pour l'afficher dans votre vitrine.\n\nÉtape 5 : Partagez et laissez l'IA travailler. Que ce soit via WhatsApp, Instagram, ou dans votre boutique, vos clients peuvent désormais poser des questions et obtenir des réponses instantanées 24h/24.\n\nEt voilà ! Moins de 5 minutes pour offrir à votre commerce une présence digitale professionnelle avec un assistant IA disponible jour et nuit.",
    gradient: "from-blue-500 to-cyan-400"
  },
  {
    id: 2,
    title: "Pourquoi votre restaurant au Maroc a besoin d'une présence digitale en 2026",
    category: "Guide",
    date: "10 mai 2026",
    readTime: "7 min",
    summary: "93% des PME marocaines n'ont aucun site web. Chiffres, impact sur les réservations, et comment Sahel.ai règle ce problème en quelques minutes.",
    content: "Le Maroc compte plus de 1,5 million de très petites entreprises et commerces. Selon une étude récente, 93% d'entre eux n'ont aucun site web ou présence en ligne structurée. Dans un monde où 78% des consommateurs recherchent un commerce en ligne avant de s'y rendre, cette absence coûte cher.\n\nPour un restaurant, les conséquences sont directes :\n- Un client cherche \"meilleur restaurant Marrakech\" sur Google. Si vous n'apparaissez pas, il va chez le concurrent.\n- Un touriste veut vérifier vos horaires ou votre menu avant de venir. Sans site, il passe au suivant.\n- Un client fidèle veut réserver une table un soir de semaine à 22h. Impossible si vous n'êtes pas joignable.\n\nAvec Sahel.ai, ce problème disparaît. En 5 minutes, vous créez :\n- Un mini-site vitrine avec vos menus, horaires, adresse et photos.\n- Un chatbot IA qui répond aux questions de vos clients 24h/24 : \"Avez-vous une terrasse ?\", \"Proposez-vous des plats végétariens ?\", \"Quel est votre plat le plus populaire ?\"\n- Un QR code à placer sur vos tables ou en vitrine pour que les clients scannent et accèdent instantanément à vos informations.\n\nLe résultat ? Des clients mieux informés, moins d'appels téléphoniques répétitifs pour votre personnel, et une augmentation des réservations grâce à une disponibilité permanente.\n\nNe laissez pas 93% de vos concurrents sans présence digitale — faites la différence dès aujourd'hui.",
    gradient: "from-emerald-500 to-teal-400"
  },
  {
    id: 3,
    title: "QR code en vitrine : 5 façons d'utiliser le vôtre pour attirer plus de clients",
    category: "Conseils",
    date: "4 mai 2026",
    readTime: "4 min",
    summary: "Affichage en caisse, sur les tables, dans les menus, sur les cartes de visite, sur WhatsApp — comment maximiser l'utilisation de votre QR code Sahel.ai.",
    content: "Votre QR code Sahel.ai est l'un des outils les plus puissants (et les plus sous-estimés) de votre commerce. Voici 5 façons concrètes de l'utiliser pour attirer plus de clients.\n\n1. En vitrine, 24h/24\nPlacez votre QR code bien visible dans la vitrine de votre magasin. Même fermé, les passants peuvent scanner pour découvrir vos horaires, votre menu ou vos services. Un restaurant qui affiche son menu via QR code en vitrine voit en moyenne 30% de passages en plus se transformer en visites.\n\n2. Sur chaque table\nDans un restaurant ou un café, déposez un petit chevalet avec votre QR code sur chaque table. Les clients peuvent scanner pour voir le menu complet, les suggestions du jour, ou poser des questions à l'IA — sans attendre le serveur. Résultat : un service plus fluide et des clients plus satisfaits.\n\n3. Dans vos menus physiques\nAjoutez le QR code en bas de votre menu papier. Après avoir choisi leur plat, les clients peuvent scanner pour en savoir plus sur votre établissement, réserver une table ou contacter le service traiteur.\n\n4. Sur vos cartes de visite\nImprimez votre QR code sur vos cartes de visite professionnelles. Quand un client potentiel la reçoit, il scanne et accède instantanément à votre mini-site avec tous vos services, horaires et coordonnées.\n\n5. Sur vos supports WhatsApp et réseaux sociaux\nTéléchargez votre QR code depuis le dashboard et partagez-le sur votre statut WhatsApp, dans vos stories Instagram ou sur votre page Facebook. Vos abonnés peuvent scanner directement pour interagir avec votre commerce.\n\nAstuce bonus : placez votre QR code près de la caisse. Pendant que le client attend, il peut découvrir d'autres produits ou services que vous proposez.",
    gradient: "from-purple-500 to-pink-400"
  },
  {
    id: 4,
    title: "Hôtel Todra Gorge : +40% de demandes de réservation grâce à Sahel.ai",
    category: "Cas client",
    date: "28 avril 2026",
    readTime: "6 min",
    summary: "Témoignage fictif mais réaliste d'un hôtel de Tinghir qui a adopté Sahel.ai. Avant/après : réponses manuelles vs chatbot IA 24h/24. Résultats chiffrés.",
    content: "Situé au cœur des gorges du Todra, dans la région de Tinghir, l'Hôtel Todra Gorge accueille chaque année des centaines de randonneurs et voyageurs venus du monde entier. Mais derrière ce succès se cachait un problème chronique : le personnel passait en moyenne 3 heures par jour à répondre aux mêmes questions par téléphone, email et WhatsApp.\n\n\"Quels sont vos tarifs pour une chambre double ?\" \"Avez-vous le chauffage en hiver ?\" \"Proposez-vous des repas végétariens ?\" \"Comment venir depuis Marrakech ?\" — autant de questions qui se répétaient chaque jour, accaparant le temps de la réception.\n\nEn février 2026, l'hôtel a adopté Sahel.ai. Le gérant a téléversé son livret d'accueil PDF, sa fiche tarifaire et la description de ses circuits. En 5 minutes, le chatbot était opérationnel.\n\nLes résultats après 3 mois :\n- +40% de demandes de réservation : le chatbot répond instantanément aux voyageurs, même à 2h du matin, ce qui a considérablement augmenté le taux de conversion.\n- -70% d'appels répétitifs : le personnel peut enfin se concentrer sur l'accueil des clients présents plutôt que de répondre au téléphone.\n- 24h/24 : les clients internationaux (Europe, Asie, Amériques) peuvent poser leurs questions dans leur fuseau horaire, sans attendre l'ouverture de la réception.\n- Multilingue : le chatbot répond en français, anglais, arabe et darija, ce qui a considérablement amélioré l'expérience des voyageurs étrangers.\n\n\"Sahel.ai a changé notre façon de travailler. Nous sommes un petit hôtel familial, mais nous offrons désormais une réponse instantanée 24h/24 comme les grands groupes hôteliers. Et tout cela pour un coût quasi nul.\" — Le gérant de l'Hôtel Todra Gorge.",
    gradient: "from-amber-500 to-orange-400"
  },
  {
    id: 5,
    title: "Parler à vos clients en arabe, français et anglais automatiquement",
    category: "Guide",
    date: "21 avril 2026",
    readTime: "5 min",
    summary: "Comment Sahel.ai détecte la langue du visiteur et répond dans la même langue. Explication simple du fonctionnement multilingue pour les commerçants.",
    content: "Le Maroc est un carrefour de langues. Un commerce à Marrakech peut recevoir le matin un client marocain parlant darija, à midi un touriste français et le soir un voyageur anglais. Répondre à chacun dans sa langue est essentiel, mais rarement possible quand on tient un commerce seul ou en petite équipe.\n\nSahel.ai résout ce problème automatiquement. Voici comment ça fonctionne :\n\n1. Détection automatique : Quand un client pose une question sur votre mini-site ou via le widget, le chatbot analyse instantanément la langue utilisée. Il reconnaît le français, l'anglais, l'arabe classique et le darija marocain (écrit en caractères arabes ou latins).\n\n2. Réponse dans la même langue : Une fois la langue détectée, l'IA formule sa réponse dans cette même langue. Le client français reçoit une réponse en français, le client anglais en anglais, le client marocain en darija.\n\n3. Contenu préservé : Les informations de votre commerce (tarifs, horaires, adresse) sont conservées dans la langue d'origine. L'IA traduit uniquement les réponses, pas vos documents. Ainsi, vos données restent exactes.\n\nPourquoi c'est important ?\n- Un client qui peut poser une question dans sa langue est 3 fois plus susceptible de passer à l'achat ou à la réservation.\n- Vous éliminez la barrière linguistique sans embaucher de personnel multilingue.\n- Vos clients internationaux se sentent accueillis et compris, ce qui renforce la réputation de votre établissement.\n\nAvec Sahel.ai, parler à vos clients dans leur langue maternelle n'a jamais été aussi simple.",
    gradient: "from-green-500 to-lime-400"
  },
  {
    id: 6,
    title: "Sahel.ai est lancé : la présence digitale pour toutes les PME de Tinghir et du Maroc",
    category: "Actualité",
    date: "15 avril 2026",
    readTime: "3 min",
    summary: "Article de lancement du projet. Contexte, mission, équipe, et vision. Idéal pour partager sur LinkedIn et les réseaux sociaux.",
    content: "Nous sommes fiers d'annoncer le lancement officiel de Sahel.ai — une plateforme destinée à révolutionner la présence digitale des petites et moyennes entreprises marocaines.\n\nNotre mission : donner à chaque commerce marocain — du plus petit épicier de quartier au riad de luxe — les mêmes outils digitaux que les grandes entreprises, sans complexité et sans investissement.\n\nLe constat est simple : au Maroc, plus de 90% des PME n'ont pas de site web. Les solutions existantes sont soit trop chères, soit trop techniques. Un restaurateur n'a ni le temps ni les compétences pour créer un site, configurer un chatbot ou gérer une présence en ligne. Et pourtant, ses clients sont de plus en plus connectés et recherchent tout sur leur téléphone.\n\nSahel.ai répond à ce problème avec une approche radicalement simple : on remplit un formulaire, on uploade un PDF, et en 5 minutes tout est prêt. Mini-site, chatbot IA, QR code, widget — sans aucune compétence technique.\n\nBasée à Tinghir, notre équipe connaît les réalités du terrain marocain. Nous savons que le darija est la langue du quotidien, que WhatsApp est le canal roi, et que la confiance passe par le bouche-à-oreille. C'est pourquoi Sahel.ai parle darija, s'intègre à WhatsApp et se partage via QR code.\n\nNotre vision : un Maroc où chaque commerce, aussi petit soit-il, a une présence digitale professionnelle et un assistant IA disponible 24h/24 pour servir ses clients.\n\nLe lancement n'est que le début. Dans les prochains mois, nous ajouterons les analytics avancés, les notifications automatiques, et bien d'autres fonctionnalités pour accompagner la transformation digitale des PME marocaines.\n\nRejoignez-nous dans cette aventure. Créez votre présence digitale dès aujourd'hui sur Sahel.ai.",
    gradient: "from-red-500 to-rose-400"
  }
];

const CATEGORY_ICONS = {
  'Tutoriel': 'school',
  'Guide': 'travel_explore',
  'Conseils': 'lightbulb',
  'Cas client': 'business_center',
  'Actualité': 'newspaper'
};

export default function BlogPage() {
  const { t } = useLanguage();
  const [selectedPost, setSelectedPost] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Tous');

  const CATEGORIES = useMemo(() => [
    { value: 'Tous', label: t('blog.all') },
    { value: 'Tutoriel', label: t('blog.tutorial') },
    { value: 'Guide', label: t('blog.guide') },
    { value: 'Conseils', label: t('blog.tips') },
    { value: 'Cas client', label: t('blog.caseStudy') },
    { value: 'Actualité', label: t('blog.news') },
  ], [t]);

  const filteredPosts = activeCategory === 'Tous'
    ? BLOG_POSTS
    : BLOG_POSTS.filter(p => p.category === activeCategory);

  const categoryCounts = BLOG_POSTS.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-warm-bg text-on-surface font-body-md antialiased min-h-screen flex flex-col justify-between page-enter">
      <div>
        <MarketingHeader />

        <main className="max-w-7xl mx-auto px-margin py-xl flex-1">
          <div className="text-center mb-xl">
            <a href={ROUTES.home} className="inline-flex items-center gap-xs text-on-surface-variant font-label-md no-underline hover:text-primary mb-md">
              <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
              {t('common.backToHome')}
            </a>
            <h1 className="font-display-lg text-display-lg text-on-surface m-0 mb-sm">
              {t('blog.title')}
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant m-0 max-w-2xl mx-auto">
              {t('blog.subtitle')}
            </p>
          </div>

          <div className="flex flex-wrap gap-sm justify-center mb-xl">
            {CATEGORIES.map(cat => {
              const count = cat.value === 'Tous' ? BLOG_POSTS.length : (categoryCounts[cat.value] || 0);
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setActiveCategory(cat.value)}
                  className={`px-4 py-2 rounded-full font-label-md text-label-md border transition-all cursor-pointer ${
                    activeCategory === cat.value
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-white text-on-surface-variant border-hairline-border hover:border-primary hover:text-primary'
                  }`}
                >
                  {cat.label}
                  <span className={`ml-1.5 text-xs ${activeCategory === cat.value ? 'text-on-primary/70' : 'text-outline'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-xl border border-hairline-border overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div>
                  <div className={`h-48 bg-gradient-to-br ${post.gradient} relative flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-white/80 text-[56px]">
                      {CATEGORY_ICONS[post.category] || 'article'}
                    </span>
                    <span className="absolute top-sm left-sm bg-white/20 backdrop-blur-sm text-white font-label-sm text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {post.category}
                    </span>
                  </div>
                  <div className="p-md">
                    <span className="font-label-sm text-label-sm text-outline block mb-xs">
                      {post.date} · {post.readTime}
                    </span>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface mb-xs mt-0 hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed line-clamp-3 m-0">
                      {post.summary}
                    </p>
                  </div>
                </div>
                <div className="p-md pt-0 text-left">
                  <button
                    type="button"
                    onClick={() => setSelectedPost(post)}
                    className="text-primary font-label-md text-label-md hover:underline flex items-center gap-xs border-0 bg-transparent cursor-pointer p-0"
                  >
                    <span>{t('blog.readArticle')}</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>

      {selectedPost && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-md overflow-y-auto">
          <div className="bg-white rounded-xl border border-hairline-border w-full max-w-2xl my-md max-h-[90vh] overflow-y-auto relative p-md md:p-lg animate-fade-in">
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              className="absolute top-4 right-4 text-outline-variant hover:text-on-surface p-2 rounded-full border-0 bg-transparent cursor-pointer flex items-center justify-center"
              aria-label={t('common.close')}
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>

            <div className="mb-md">
              <span className="bg-primary/10 text-primary font-label-sm text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">
                {selectedPost.category}
              </span>
              <span className="font-label-sm text-label-sm text-outline ml-sm">
                {selectedPost.date} · {selectedPost.readTime}
              </span>
            </div>

            <h2 className="font-headline-md text-headline-md text-on-surface m-0 mb-md leading-tight text-left">
              {selectedPost.title}
            </h2>

            <div className={`h-48 w-full rounded-xl overflow-hidden mb-lg bg-gradient-to-br ${selectedPost.gradient} flex items-center justify-center`}>
              <span className="material-symbols-outlined text-white/60 text-[72px]">
                {CATEGORY_ICONS[selectedPost.category] || 'article'}
              </span>
            </div>

            <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed text-left space-y-md whitespace-pre-line">
              {selectedPost.content}
            </div>

            <div className="mt-lg pt-md border-t border-hairline-border flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="btn-primary-ui px-lg py-2.5 font-label-md text-label-md"
              >
                {t('blog.closeArticle')}
              </button>
            </div>
          </div>
        </div>
      )}

      <MarketingFooter />
    </div>
  );
}
