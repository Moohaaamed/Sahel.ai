import { useState, useMemo } from 'react';
import { ROUTES } from '../lib/routes';
import { useLanguage } from '../i18n';
import MarketingHeader from './layout/MarketingHeader';
import MarketingFooter from './layout/MarketingFooter';

export default function FaqPage() {
  const { t } = useLanguage();
  const [openItems, setOpenItems] = useState({});
  const [search, setSearch] = useState('');

  const CATEGORIES = useMemo(() => [
    {
      name: t('faq.categories.general'),
      icon: "info",
      items: [
        { question: t('faq.q1'), answer: t('faq.a1') },
        { question: t('faq.q2'), answer: t('faq.a2') },
        { question: t('faq.q3'), answer: t('faq.a3') },
        { question: t('faq.q4'), answer: t('faq.a4') },
      ]
    },
    {
      name: t('faq.categories.chatbot'),
      icon: "smart_toy",
      items: [
        { question: t('faq.q5'), answer: t('faq.a5') },
        { question: t('faq.q6'), answer: t('faq.a6') },
        { question: t('faq.q7'), answer: t('faq.a7') },
        { question: t('faq.q8'), answer: t('faq.a8') },
      ]
    },
    {
      name: t('faq.categories.miniSite'),
      icon: "language",
      items: [
        { question: t('faq.q9'), answer: t('faq.a9') },
        { question: t('faq.q10'), answer: t('faq.a10') },
        { question: t('faq.q11'), answer: t('faq.a11') },
      ]
    },
    {
      name: t('faq.categories.billing'),
      icon: "account_balance_wallet",
      items: [
        { question: t('faq.q12'), answer: t('faq.a12') },
        { question: t('faq.q13'), answer: t('faq.a13') },
      ]
    }
  ], [t]);

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
  }, [search, CATEGORIES]);

  const totalFiltered = filteredCategories.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <div className="bg-warm-bg text-on-surface font-body-md antialiased min-h-screen flex flex-col justify-between page-enter">
      <div>
        <MarketingHeader />

        <main className="max-w-3xl mx-auto px-margin py-xl flex-1">
          <div className="text-center mb-xl">
            <a href={ROUTES.home} className="inline-flex items-center gap-xs text-on-surface-variant font-label-md no-underline hover:text-primary mb-md">
              <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
              {t('common.backToHome')}
            </a>
            <h1 className="font-display-lg text-display-lg text-on-surface m-0 mb-sm">
              {t('faq.title')}
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant m-0 max-w-xl mx-auto">
              {t('faq.subtitle')}
            </p>
          </div>

          <div className="relative mb-xl">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('faq.searchPlaceholder')}
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
                {t('faq.noResults')}
              </p>
            </div>
          )}
        </main>
      </div>

      <MarketingFooter />
    </div>
  );
}
