import { useEffect } from 'react';
import { ROUTES } from '../lib/routes';
import SahelLogo from './SahelLogo';

const DEVELOPER_PORTRAIT =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuARROvAJR91eu1tJrfbWLq9mLaK8lMa_WsYaMoNAw9TktTdvCXXLEz9XtL8OYp5iFEMLHbCgc-OPDW36p04xdd4QAUQsWwlhKHbSzfDCPY1qCMDa5Q7FDTzJzNd0WWJGV1vvfOJOWDHYHo76jOlWNlO-q0EoX9h9wvetm7gbIMJPsLVxDLZqvIEeP2hxp4ylhGLzwUZ6731TSitGcILx9dFJISt64WxEOY_Frd3XyXmt5WRq91VPsA7nokgQU1_GjO06TM2kkMADlVk';

const TECH_STACK = [
  { name: 'React', color: '#61DAFB' },
  { name: 'Vite', color: '#646CFF' },
  { name: 'FastAPI', color: '#05998B' },
  { name: 'Groq API', color: '#F37021' },
  { name: 'FAISS', color: '#000000' },
  { name: 'HuggingFace', color: '#FFD21E' },
  { name: 'Supabase', color: '#3ECF8E' },
  { name: 'HF Spaces', color: '#FF9D00' },
];

function AboutSection({ id, className = '', children }) {
  return (
    <section id={id} className={`about-reveal px-margin ${className}`}>
      {children}
    </section>
  );
}

export default function AboutPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
          }
        });
      },
      { threshold: 0.1 },
    );

    const sections = document.querySelectorAll('.about-reveal');
    sections.forEach((section) => {
      section.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-10');
      observer.observe(section);
    });

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  return (
    <div className="bg-warm-bg text-on-surface font-body-md antialiased overflow-x-hidden min-h-screen flex flex-col">
      <header className="w-full top-0 sticky z-50 bg-background border-b border-hairline-border">
        <div className="max-w-[1280px] mx-auto px-margin flex justify-between items-center h-xl">
          <a href={ROUTES.home} className="flex items-center gap-xs no-underline">
            <SahelLogo size={32} textClass="font-headline-sm text-primary tracking-tight" />
          </a>
          <a
            href={ROUTES.contact}
            className="bg-primary text-on-primary px-sm py-xs rounded text-label-md active:scale-95 transition-all no-underline"
          >
            Nous contacter
          </a>
        </div>
      </header>

      <main className="flex flex-col flex-1">
        <AboutSection className="pt-xl pb-lg bg-background" id="vision">
          <div className="max-w-[1280px] mx-auto flex flex-col gap-sm">
            <span className="text-primary font-label-sm tracking-widest uppercase">Notre Vision</span>
            <h1 className="font-display-lg text-display-lg text-on-surface m-0">
              Rendre l&apos;IA accessible
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg m-0">
              Au Maroc, près de{' '}
              <span className="font-bold text-on-surface">93&nbsp;% des PME</span> manquent encore
              d&apos;une présence digitale structurée.{' '}
              <span className="italic font-headline-sm text-primary">Sahel</span>, qui signifie «&nbsp;facile&nbsp;»
              en arabe, est notre réponse à ce défi.
            </p>
            <div className="mt-md p-sm bg-surface-blue rounded-xl flex items-start gap-sm">
              <span className="material-symbols-outlined text-primary shrink-0">lightbulb</span>
              <p className="text-label-md text-on-primary-fixed-variant leading-relaxed m-0">
                L&apos;intelligence artificielle ne doit pas être un luxe technologique, mais un artisanat
                numérique au service de l&apos;économie locale.
              </p>
            </div>
          </div>
        </AboutSection>

        <AboutSection className="py-xl" id="mission">
          <div className="max-w-[1280px] mx-auto flex flex-col gap-lg">
            <div className="flex flex-col gap-sm">
              <h2 className="font-headline-md text-headline-md text-on-surface m-0">L&apos;Essence du Projet</h2>
              <div className="h-1 w-12 bg-primary rounded-full" />
            </div>
            <div className="grid grid-cols-1 gap-md">
              <div className="bg-surface-container-lowest p-md border border-hairline-border rounded-lg">
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center mb-sm text-primary">
                  <span className="material-symbols-outlined">auto_fix</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm mb-xs mt-0">Automatisation Locale</h3>
                <p className="text-on-surface-variant leading-relaxed m-0">
                  Nous traduisons le savoir-faire métier des entreprises marocaines en agents intelligents,
                  capables de gérer les interactions clients sans aucune complexité technique pour le gérant.
                </p>
              </div>
              <div className="bg-surface-container-lowest p-md border border-hairline-border rounded-lg">
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center mb-sm text-primary">
                  <span className="material-symbols-outlined">chat</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm mb-xs mt-0">Zéro Barrière</h3>
                <p className="text-on-surface-variant leading-relaxed m-0">
                  Notre mission est de supprimer la «&nbsp;peur de l&apos;écran&nbsp;». Sahel.ai est conçu comme un
                  outil de productivité intuitif, aussi simple qu&apos;une conversation.
                </p>
              </div>
            </div>
          </div>
        </AboutSection>

        <AboutSection className="py-xl bg-surface-container-low" id="team">
          <div className="max-w-[1280px] mx-auto flex flex-col gap-md">
            <h2 className="font-headline-md text-headline-md text-on-surface m-0">Le Développeur</h2>
            <div className="bg-background border border-hairline-border p-md rounded-lg flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-sm border-2 border-primary/20">
                <img
                  alt="Portrait de Mouhamed, développeur Sahel.ai"
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                  src={DEVELOPER_PORTRAIT}
                />
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">MOUHAMED</h3>
              <p className="text-primary font-label-md mt-1 mb-0">Développeur — EST Meknès</p>
              <p className="text-on-surface-variant font-label-sm text-label-sm mt-2 mb-0 uppercase tracking-widest">
                Génie Informatique DUT 2e année
              </p>
              <div className="flex gap-sm mt-md">
                <a
                  href={ROUTES.contact}
                  className="material-symbols-outlined text-outline hover:text-primary transition-colors no-underline"
                  aria-label="Contacter par email"
                >
                  alternate_email
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="material-symbols-outlined text-outline hover:text-primary transition-colors no-underline"
                  aria-label="Profil GitHub"
                >
                  terminal
                </a>
              </div>
            </div>
          </div>
        </AboutSection>

        <AboutSection className="py-xl bg-background" id="stack">
          <div className="max-w-[1280px] mx-auto flex flex-col gap-md">
            <h2 className="font-headline-md text-headline-md text-on-surface m-0">Architecture Technique</h2>
            <p className="text-on-surface-variant font-body-md m-0 max-w-2xl">
              Stack réelle du produit Sahel.ai&nbsp;: mini-sites React, API FastAPI, RAG avec FAISS et
              embeddings HuggingFace, inférence Groq, base PostgreSQL hébergée sur Supabase, déploiement API
              sur HuggingFace Spaces (Docker).
            </p>
            <div className="grid grid-cols-2 gap-xs">
              {TECH_STACK.map((item) => (
                <div
                  key={item.name}
                  className="px-sm py-xs border border-hairline-border rounded text-label-md text-center text-on-surface-variant flex items-center justify-center gap-xs bg-surface-container-lowest"
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        </AboutSection>

        <AboutSection className="py-xl bg-surface-blue" id="academic">
          <div className="max-w-[1280px] mx-auto flex flex-col gap-sm">
            <h2 className="font-headline-md text-headline-md text-primary m-0">Contexte Académique</h2>
            <p className="font-body-md text-body-md text-on-primary-fixed-variant leading-relaxed m-0">
              Ce projet est réalisé dans le cadre du{' '}
              <span className="font-bold">Projet de Fin d&apos;Études (PFE)</span> au sein de l&apos;
              <span className="font-bold">École Supérieure de Technologie de Meknès (EST Meknès)</span>.
            </p>
            <div className="mt-md flex items-center gap-md">
              <div className="flex-1 h-px bg-primary/20" />
              <span className="font-label-sm text-primary/60">EST MEKNÈS 2026</span>
              <div className="flex-1 h-px bg-primary/20" />
            </div>
          </div>
        </AboutSection>
      </main>

      <footer className="w-full bg-surface-container-low border-t border-hairline-border">
        <div className="max-w-[1280px] mx-auto px-margin py-lg flex flex-col items-center gap-gutter">
          <a href={ROUTES.home} className="flex items-center gap-2 no-underline">
            <SahelLogo size={28} textClass="font-headline-sm text-on-surface font-bold" />
          </a>
          <nav className="flex flex-wrap justify-center gap-md">
            <a className="text-body-md text-on-surface-variant hover:text-primary transition-colors no-underline" href="#mission">
              Mission
            </a>
            <a className="text-body-md text-on-surface-variant hover:text-primary transition-colors no-underline" href="#team">
              Équipe
            </a>
            <a className="text-body-md text-on-surface-variant hover:text-primary transition-colors no-underline" href="#stack">
              Stack
            </a>
            <a
              className="text-body-md text-on-surface-variant hover:text-primary transition-colors no-underline"
              href={ROUTES.privacy}
            >
              Confidentialité
            </a>
          </nav>
          <p className="font-label-sm text-label-sm text-secondary text-center m-0">
            © 2026 Sahel.ai. Empowering Moroccan SMEs through digital craftsmanship.
          </p>
        </div>
      </footer>
    </div>
  );
}
