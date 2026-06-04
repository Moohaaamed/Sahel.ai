import { useState, useMemo } from 'react';
import { ROUTES } from '../lib/routes';
import MarketingHeader from './layout/MarketingHeader';
import MarketingFooter from './layout/MarketingFooter';

const CATEGORIES = [
  {
    name: "Général",
    icon: "info",
    items: [
      {
        question: "C'est quoi Sahel.ai exactement ?",
        answer: "Sahel.ai est une plateforme qui permet à tout commerce marocain — hôtel, restaurant, pharmacie, boutique — de créer un chatbot IA et un mini-site web en moins de 5 minutes, sans aucune compétence technique. Sahel (سهل) signifie \"facile\" en arabe."
      },
      {
        question: "Est-ce vraiment gratuit ?",
        answer: "Oui. Le plan gratuit vous donne 1 commerce, un chatbot IA opérationnel, un mini-site hébergé, un QR code téléchargeable et 50 conversations par mois — sans aucune carte bancaire requise. Le plan Pro à 99 DH/mois ajoute des commerces illimités, les analytics et les notifications WhatsApp."
      },
      {
        question: "Quel type de commerce peut utiliser Sahel.ai ?",
        answer: "Tous les types : hôtel, riad, restaurant, café, pharmacie, clinique, épicerie, agence immobilière, salon de coiffure... Dès que vous avez des clients qui posent des questions répétitives, Sahel.ai vous fait gagner du temps."
      },
      {
        question: "Faut-il des compétences en informatique ?",
        answer: "Aucune. Vous remplissez un formulaire comme vous rempliriez un document Word, vous uploadez votre PDF de services, et Sahel.ai fait le reste automatiquement. Si vous pouvez envoyer un message WhatsApp, vous pouvez utiliser Sahel.ai."
      }
    ]
  },
  {
    name: "Chatbot IA",
    icon: "smart_toy",
    items: [
      {
        question: "Comment le chatbot connaît-il les infos de mon commerce ?",
        answer: "Vous uploadez vos documents (menu, tarifs, FAQ, horaires...) en PDF ou Word lors de la création. L'IA lit et mémorise tout ce contenu. Elle répond ensuite uniquement à partir de ces informations — jamais d'inventions. C'est ce qu'on appelle l'architecture RAG (Retrieval-Augmented Generation)."
      },
      {
        question: "Le chatbot répond en quelle langue ?",
        answer: "Le chatbot détecte automatiquement la langue de votre visiteur et répond dans la même langue. Il supporte l'arabe classique, le darija marocain, le français et l'anglais. Aucune configuration manuelle nécessaire."
      },
      {
        question: "Que se passe-t-il si le chatbot ne connaît pas la réponse ?",
        answer: "Si l'information n'est pas dans vos documents, le chatbot le dit clairement et invite le visiteur à contacter le commerce directement via WhatsApp ou téléphone. Il ne devine jamais et n'invente pas d'informations."
      },
      {
        question: "Comment mettre à jour les infos de mon chatbot ?",
        answer: "Depuis votre dashboard, cliquez sur \"Modifier\" à côté de votre commerce et uploadez un nouveau PDF. Le chatbot est automatiquement mis à jour en quelques secondes."
      }
    ]
  },
  {
    name: "Mini-site",
    icon: "language",
    items: [
      {
        question: "Où est hébergé mon mini-site ?",
        answer: "Sur les serveurs de Sahel.ai, gratuitement. Votre URL ressemble à : sahel.ai/business/nom-de-votre-commerce. Vous n'avez rien à configurer ni à payer pour l'hébergement."
      },
      {
        question: "J'ai déjà un site web, puis-je quand même utiliser Sahel.ai ?",
        answer: "Oui. Après la création de votre chatbot, Sahel.ai vous donne un snippet d'une ligne à coller dans votre site existant. Une bulle de chat apparaîtra automatiquement sur votre site actuel, alimentée par votre IA Sahel.ai."
      },
      {
        question: "Comment partager mon mini-site avec mes clients ?",
        answer: "Trois façons : (1) Partagez le lien directement sur WhatsApp, Instagram, ou Google Maps. (2) Imprimez le QR code et affichez-le dans votre commerce — les clients le scannent avec leur téléphone. (3) Si vous avez un site, intégrez le widget avec une seule ligne de code."
      }
    ]
  },
  {
    name: "Compte & Facturation",
    icon: "account_balance_wallet",
    items: [
      {
        question: "Dois-je créer un compte pour utiliser Sahel.ai ?",
        answer: "Non. Vous pouvez créer votre chatbot sans compte. Un compte est nécessaire uniquement pour accéder au dashboard analytique, modifier votre contenu après création, et gérer plusieurs commerces."
      },
      {
        question: "Comment passer au plan Pro ?",
        answer: "Depuis votre dashboard, cliquez sur \"Passer au Pro\". Le paiement se fait par virement bancaire ou via la page de contact — nous vous enverrons les instructions. Pas de paiement en ligne requis pour le moment."
      }
    ]
  }
];

export default function FaqPage() {
  const [openItems, setOpenItems] = useState({});
  const [search, setSearch] = useState('');

  const toggleItem = (catIdx, itemIdx) => {
    const key = `${catIdx}-${itemIdx}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return CATEGORIES;
    const q = search.toLowerCase();
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        item =>
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q)
      )
    })).filter(cat => cat.items.length > 0);
  }, [search]);

  const totalFiltered = filteredCategories.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <div className="bg-warm-bg text-on-surface font-body-md antialiased min-h-screen flex flex-col justify-between page-enter">
      <div>
        <MarketingHeader />

        <main className="max-w-3xl mx-auto px-margin py-xl flex-1">
          <div className="text-center mb-xl">
            <a href={ROUTES.home} className="inline-flex items-center gap-xs text-on-surface-variant font-label-md no-underline hover:text-primary mb-md">
              <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
              Retour à l&apos;accueil
            </a>
            <h1 className="font-display-lg text-display-lg text-on-surface m-0 mb-sm">
              Foire aux questions
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant m-0 max-w-xl mx-auto">
              Tout ce que vous devez savoir sur Sahel.ai pour propulser votre commerce grâce à l&apos;IA.
            </p>
          </div>

          <div className="relative mb-xl">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une question..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-hairline-border bg-white font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {filteredCategories.map((cat, catIdx) => (
            <section key={cat.name} className="mb-xl">
              <div className="flex items-center gap-sm mb-md">
                <span className="material-symbols-outlined text-primary">{cat.icon}</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">{cat.name}</h2>
              </div>
              <div className="space-y-sm">
                {cat.items.map((item, itemIdx) => {
                  const key = `${catIdx}-${itemIdx}`;
                  const isOpen = !!openItems[key];
                  return (
                    <div
                      key={itemIdx}
                      className="bg-white rounded-xl border border-hairline-border overflow-hidden transition-all duration-300 hover:shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => toggleItem(catIdx, itemIdx)}
                        className="w-full px-md py-4 flex items-center justify-between text-left border-0 bg-transparent cursor-pointer font-semibold text-headline-sm text-on-surface"
                      >
                        <span>{item.question}</span>
                        <span
                          className={`material-symbols-outlined text-primary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        >
                          expand_more
                        </span>
                      </button>
                      <div
                        className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] border-t border-hairline-border' : 'max-h-0'} overflow-hidden`}
                      >
                        <p className="px-md py-4 text-body-md text-on-surface-variant leading-relaxed m-0 bg-surface-container-lowest">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {totalFiltered === 0 && (
            <div className="text-center py-xl">
              <span className="material-symbols-outlined text-[48px] text-outline mb-sm">search_off</span>
              <p className="font-body-lg text-body-lg text-on-surface-variant m-0">
                Aucune question ne correspond à votre recherche.
              </p>
            </div>
          )}
        </main>
      </div>

      <MarketingFooter />
    </div>
  );
}
