import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import DashboardPage from './components/DashboardPage';
import ChatInterface from './components/ChatInterface';
import BusinessShowcasePage from './components/PublicBusinessPage';
import LoginPage from './components/LoginPage';
import VerifyEmailPage from './components/VerifyEmailPage';
import OnboardingFlow from './components/OnboardingFlow';
import SuccessPage from './components/SuccessPage';
import AboutPage from './components/AboutPage';
import FaqPage from './components/FaqPage';
import ShowcasePage from './components/ShowcasePage';
import ContactPage from './components/ContactPage';
import BlogPage from './components/BlogPage';
import SahelLogo from './components/SahelLogo';
import MarketingFooter from './components/layout/MarketingFooter';
import MarketingHeader from './components/layout/MarketingHeader';
import { ROUTES, loginUrl } from './lib/routes';
import { getSession } from './lib/session';
import { API_URL } from './config';

const AppContainer = styled.div`
  min-height: 100vh;
  background: #ffffff;
  color: #1c1b1b;
  font-family: 'Inter', system-ui, sans-serif;
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 76px;
  padding: 0 clamp(18px, 5vw, 64px);
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 0.5px solid #d9d6cc;
  backdrop-filter: blur(12px);
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Brand = styled.div`
  color: #185fa5;
  font-size: clamp(18px, 3vw, 22px);
  font-weight: 500;
`;

const HeaderNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 18px;

  a {
    color: #414751;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
  }

  @media (max-width: 720px) {
    a:not(.primary-link) {
      display: none;
    }
  }
`;

const PageTransition = styled.div`
  animation: page-in 420ms ease both;

  @keyframes page-in {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Shell = styled.main`
  display: grid;
  grid-template-columns: minmax(280px, 380px) minmax(0, 1fr);
  gap: 24px;
  padding: 24px 32px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    padding: 16px;
  }
`;

const DashboardIntro = styled.section`
  display: grid;
  gap: 18px;
  padding: 24px 32px 0;

  @media (max-width: 900px) {
    padding: 18px 16px 0;
  }
`;

const DashboardHero = styled.div`
  display: grid;
  gap: 16px;
  padding: clamp(20px, 4vw, 34px);
  border: 0.5px solid #d9d6cc;
  border-radius: 8px;
  background: #f6f3f2;

  @media (min-width: 860px) {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
  }
`;

const DashboardTitle = styled.h1`
  margin: 0;
  font-size: clamp(32px, 5vw, 54px);
  font-weight: 500;
  line-height: 1;
`;

const DashboardSubnav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  a {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 0 12px;
    border: 0.5px solid #c8c5bc;
    border-radius: 6px;
    background: #ffffff;
    color: #2f3540;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
  }

  a:hover {
    border-color: #378add;
    color: #185fa5;
  }
`;

const WorkspaceHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
`;

const WorkspaceActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Panel = styled.section`
  background: #ffffff;
  border: 0.5px solid #d9d6cc;
  border-radius: 8px;
  padding: clamp(18px, 3vw, 28px);
`;

const PanelTitle = styled.h2`
  margin: 0 0 14px;
  font-size: clamp(24px, 4vw, 34px);
  font-weight: 500;
`;

const Form = styled.form`
  display: grid;
  gap: 12px;
`;

const Label = styled.label`
  display: grid;
  gap: 9px;
  color: #2f3540;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
`;

const Input = styled.input`
  border: 0.5px solid #c8c5bc;
  border-radius: 6px;
  min-height: 58px;
  padding: 0 16px;
  background: #ffffff;
  color: #1c1b1b;
  font-size: 15px;

  &:focus {
    border-color: #378add;
    outline: none;
  }
`;

const TextArea = styled.textarea`
  min-height: 78px;
  border: 0.5px solid #c8c5bc;
  border-radius: 6px;
  padding: 14px 16px;
  font-size: 14px;
  resize: vertical;

  &:focus {
    border-color: #378add;
    outline: none;
  }
`;

const Button = styled.button`
  border: 0;
  border-radius: 6px;
  min-height: 46px;
  padding: 0 18px;
  background: #378add;
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease;

  &:hover {
    background: #185fa5;
  }

  &:disabled {
    background: #9db6cc;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(Button)`
  background: #ffffff;
  color: #1c1b1b;
  border: 0.5px solid #c8c5bc;

  &:hover {
    background: #f6f3f2;
  }
`;

const GhostButton = styled.button`
  border: 0.5px solid #c8c5bc;
  border-radius: 6px;
  min-height: 40px;
  padding: 0 12px;
  background: #ffffff;
  color: #17201b;
  font-weight: 700;
  cursor: pointer;
`;

const BusinessList = styled.div`
  display: grid;
  gap: 8px;
  margin-top: 18px;
`;

const BusinessButton = styled.button`
  border: 1px solid ${({ $active }) => ($active ? '#207a4c' : '#dfe7df')};
  border-radius: 6px;
  padding: 10px;
  background: ${({ $active }) => ($active ? '#eef8f1' : '#ffffff')};
  text-align: left;
  cursor: pointer;
`;

const LinkBox = styled.div`
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 6px;
  background: #f8faf8;
  font-size: 14px;
`;

const EmbedCode = styled.pre`
  margin: 8px 0 0;
  padding: 12px;
  overflow-x: auto;
  border: 1px solid #dfe7df;
  border-radius: 6px;
  background: #17201b;
  color: #eef8f1;
  font-size: 12px;
  line-height: 1.5;
`;

const QrBox = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #dfe7df;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const SmallButton = styled.button`
  border: 1px solid #c6ddce;
  border-radius: 6px;
  min-height: 36px;
  padding: 0 12px;
  background: #eef8f1;
  color: #207a4c;
  font-weight: 700;
  cursor: pointer;
`;

const Muted = styled.span`
  color: #617065;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const StatBox = styled.div`
  padding: 12px;
  border: 1px solid #dfe7df;
  border-radius: 6px;
  background: #f8faf8;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 800;
`;

const RecentList = styled.div`
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
`;

const RecentItem = styled.div`
  padding: 10px;
  border-radius: 6px;
  background: #f8faf8;
  border: 1px solid #e5ece5;
  font-size: 14px;
`;

const ItemMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
  color: #617065;
  font-size: 12px;
`;

const StatusText = styled.div`
  min-height: 18px;
  color: ${({ $error }) => ($error ? '#a13a2b' : '#207a4c')};
  font-size: 13px;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: ${({ $status }) =>
    $status === 'closed' ? '#eef0f2' : $status === 'contacted' ? '#eef8f1' : '#fff4df'};
  color: ${({ $status }) =>
    $status === 'closed' ? '#596168' : $status === 'contacted' ? '#207a4c' : '#8a5a00'};
  font-size: 12px;
  font-weight: 700;
`;

const LanguageBadge = styled(StatusBadge)`
  background: ${({ $language }) =>
    $language === 'ar' ? '#eef3ff' : $language === 'fr' ? '#fff4df' : '#eef8f1'};
  color: ${({ $language }) =>
    $language === 'ar' ? '#2f5faa' : $language === 'fr' ? '#8a5a00' : '#207a4c'};
`;

const PublicShell = styled.main`
  max-width: 1180px;
  margin: 0 auto;
  padding: clamp(28px, 6vw, 72px) 18px;
`;

const PublicHero = styled.section`
  display: grid;
  gap: 18px;
  margin-bottom: 28px;
  padding: clamp(32px, 6vw, 72px) clamp(20px, 5vw, 48px);
  background: #185fa5;
  color: #e6f1fb;
  border-radius: 8px;
  overflow: hidden;
`;

const PublicTitle = styled.h1`
  margin: 0;
  max-width: 780px;
  font-size: clamp(48px, 9vw, 92px);
  font-weight: 500;
  line-height: 0.96;
`;

const PublicActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
`;

const LinkButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  padding: 0 18px;
  border-radius: 6px;
  background: #378add;
  color: white;
  font-weight: 700;
  text-decoration: none;
  transition: background 150ms ease, border-color 150ms ease;

  &:hover {
    background: #185fa5;
  }
`;

const SecondaryLink = styled(LinkButton)`
  background: #ffffff;
  color: #1c1b1b;
  border: 0.5px solid #c8c5bc;

  &:hover {
    background: #f6f3f2;
  }
`;

const LandingHero = styled.section`
  position: relative;
  display: grid;
  gap: 40px;
  min-height: calc(100svh - 76px);
  padding: clamp(44px, 7vw, 88px) clamp(18px, 5vw, 64px) 28px;
  overflow: hidden;

  @media (min-width: 980px) {
    grid-template-columns: minmax(0, 1.08fr) minmax(360px, 0.92fr);
    align-items: center;
  }
`;

const Eyebrow = styled.div`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  padding: 7px 11px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  background: #ffffff;
  color: #414751;
  font-size: 12px;
  font-weight: 700;
`;

const HeroTitle = styled.h1`
  max-width: 780px;
  margin: 0;
  font-size: clamp(48px, 10vw, 92px);
  font-weight: 500;
  line-height: 0.98;

  em {
    font-style: italic;
  }
`;

const HeroCopy = styled.p`
  max-width: 620px;
  margin: 20px 0 0;
  color: #414751;
  font-size: clamp(16px, 2.2vw, 20px);
  line-height: 1.65;
`;

const HeroActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;

  a {
    min-width: min(100%, 228px);
  }
`;

const ProductVisual = styled.div`
  display: grid;
  gap: 14px;
`;

const BrowserMock = styled.div`
  border: 0.5px solid #d9d6cc;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
`;

const BrowserBar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 12px;
  border-bottom: 0.5px solid #d9d6cc;
  background: #f6f3f2;

  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #b8c2cc;
  }
`;

const DashboardPreview = styled.div`
  display: grid;
  gap: 16px;
  padding: 18px;
`;

const ChartImage = styled.div`
  min-height: 210px;
  border-radius: 6px;
  border: 0.5px solid #d9d6cc;
  background: #f1efe8;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 36px 28px;
    border-left: 0.5px solid #b5d4f4;
    border-bottom: 0.5px solid #b5d4f4;
  }

  &::after {
    content: '';
    position: absolute;
    left: 54px;
    right: 34px;
    bottom: 54px;
    height: 72px;
    background: #378add;
    clip-path: polygon(0 78%, 18% 58%, 38% 68%, 58% 30%, 78% 42%, 100% 8%, 100% 100%, 0 100%);
    opacity: 0.9;
  }
`;

const PreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  div {
    min-height: 76px;
    padding: 12px;
    border-radius: 6px;
    background: #f6f3f2;
    color: #185fa5;
    font-size: 26px;
  }

  span {
    display: block;
    margin-top: 6px;
    color: #717783;
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 700;
  }
`;

const SectionBand = styled.section`
  padding: clamp(48px, 8vw, 92px) clamp(18px, 5vw, 64px);
  background: ${({ $tone }) => ($tone === 'warm' ? '#f1efe8' : '#ffffff')};
  border-top: 0.5px solid #d9d6cc;
`;

const SectionInner = styled.div`
  max-width: 1180px;
  margin: 0 auto;
`;

const SectionTitle = styled.h2`
  max-width: 720px;
  margin: 0 0 16px;
  font-size: clamp(34px, 6vw, 58px);
  font-weight: 500;
  line-height: 1.05;
`;

const SectionLead = styled.p`
  max-width: 640px;
  margin: 0 0 32px;
  color: #414751;
  line-height: 1.7;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
`;

const FeatureCard = styled.div`
  min-height: 190px;
  padding: 22px;
  border: 0.5px solid #d9d6cc;
  border-radius: 8px;
  background: #ffffff;
  transition: background 150ms ease, border-color 150ms ease;

  &:hover {
    border-color: #85b7eb;
    background: #f8fbff;
  }
`;

const IconBox = styled.div`
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-bottom: 18px;
  border-radius: 6px;
  background: #e6f1fb;
  color: #185fa5;
  font-size: 22px;
`;

const StepsGrid = styled.div`
  display: grid;
  gap: 28px;

  @media (min-width: 900px) {
    grid-template-columns: minmax(0, 1fr) 420px;
    align-items: center;
  }
`;

const StepList = styled.div`
  display: grid;
  gap: 18px;
`;

const StepItem = styled.div`
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 16px;

  strong {
    display: block;
    margin-bottom: 5px;
  }

  p {
    margin: 0;
    color: #414751;
    line-height: 1.6;
  }
`;

const StepNumber = styled.div`
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0.5px solid #378add;
  border-radius: 6px;
  color: #185fa5;
  font-weight: 800;
`;

const QrPhoto = styled.div`
  aspect-ratio: 4 / 5;
  border-radius: 8px;
  border: 0.5px solid #d9d6cc;
  background: #ffffff;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    width: 46%;
    aspect-ratio: 1;
    left: 27%;
    top: 24%;
    background: #185fa5;
    border: 14px solid #f1efe8;
    outline: 0.5px solid #d9d6cc;
  }

  &::after {
    content: 'QR code partageable';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 24%;
    text-align: center;
    color: #414751;
    font-size: 13px;
    font-weight: 500;
  }
`;

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 16px;
`;

const PriceCard = styled.div`
  position: relative;
  padding: 24px;
  border: ${({ $featured }) => ($featured ? '2px solid #378add' : '0.5px solid #d9d6cc')};
  border-radius: 8px;
  background: #ffffff;

  h3 {
    margin: 0 0 16px;
    color: ${({ $featured }) => ($featured ? '#185fa5' : '#414751')};
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  strong {
    display: block;
    margin-bottom: 18px;
    font-size: 34px;
    font-weight: 500;
  }

  p {
    color: #414751;
    line-height: 1.7;
  }
`;

const PopularBadge = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  padding: 5px 9px;
  background: #378add;
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
`;

const Footer = styled.footer`
  padding: 44px clamp(18px, 5vw, 64px);
  border-top: 0.5px solid #d9d6cc;
  background: #ffffff;
`;

const FooterInner = styled.div`
  display: grid;
  max-width: 1180px;
  margin: 0 auto;
  gap: 24px;

  @media (min-width: 760px) {
    grid-template-columns: 1fr auto auto;
  }

  a {
    color: #414751;
    text-decoration: none;
  }
`;

const MiniSiteGrid = styled.div`
  display: grid;
  gap: 28px;

  @media (min-width: 980px) {
    grid-template-columns: minmax(0, 0.85fr) minmax(360px, 0.65fr);
    align-items: start;
  }
`;

const InfoPills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const InfoPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 0 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.82);
  color: #2f3540;
  font-weight: 700;
`;

const ConciergeCard = styled(Panel)`
  padding: 0;
  overflow: hidden;
`;

const ConciergeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-bottom: 0.5px solid #d9d6cc;
`;

const BotAvatar = styled.div`
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border-radius: 8px;
  background: #378add;
  color: #ffffff;
  font-size: 26px;
`;

const PublicFooterLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 28px;
  margin-top: 44px;
  color: #414751;
`;



function landingCta() {
  const session = getSession();
  return session?.owner ? ROUTES.dashboard : loginUrl(ROUTES.onboarding);
}

function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [chatStep, setChatStep] = useState(0);
  const chatContainerRef = useRef(null);
  const [heroChatStep, setHeroChatStep] = useState(0);
  const heroChatRef = useRef(null);
  const heroChatStarted = useRef(false);
  const chatMessages = [
    { type: 'user', text: "Salam, bghit na3raf l'menu dialkom svp." },
    { type: 'bot', text: "Wa alaykum salam! Voici notre menu digital du jour. Souhaitez-vous voir nos spécialités ?" },
    { type: 'user', text: "Oui, chnou 3andkom f tagine ?" },
    { type: 'bot', text: "Nous avons aujourd'hui: Tagine d'Agneau aux pruneaux, Tagine de Poulet au citron confit, et notre Tagine Végétarien Berbère. Lequel vous tente ?" }
  ];
  const heroMessages = [
    { type: 'bot', text: 'Bonjour ! Bienvenue sur Sahel.ai. Je suis votre assistant IA. Comment puis-je vous aider ?' },
    { type: 'user', text: 'Salam ! Je cherche un bon restaurant marocain à Marrakech.' },
    { type: 'bot', text: 'Bien sûr ! Je vous recommande le "Restaurant Atlas" — spécialités traditionnelles, noté 4.8 ⭐. Voulez-vous réserver une table ?' },
    { type: 'user', text: 'Oui, pour 2 personnes ce soir à 20h.' },
    { type: 'bot', text: 'Parfait ! Réservation confirmée pour 2 personnes ce soir à 20h au Restaurant Atlas. Un QR code vous sera envoyé. 🎉' }
  ];

  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

    const bentoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.15 }
    );
    const bentoGrid = document.querySelector('.bento-stagger');
    if (bentoGrid) bentoObserver.observe(bentoGrid);

    const nav = document.querySelector('.glass-nav');
    const handleNav = () => {
      if (window.scrollY > 50) {
        nav?.classList.add('scrolled');
      } else {
        nav?.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleNav);

    return () => {
      revealObserver.disconnect();
      bentoObserver.disconnect();
      window.removeEventListener('scroll', handleNav);
    };
  }, []);

  useEffect(() => {
    const handleMouse = (e) => {
      const glow = document.getElementById('cursor-glow');
      if (glow) {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
      }
    };
    document.addEventListener('mousemove', handleMouse);
    return () => document.removeEventListener('mousemove', handleMouse);
  }, []);

  useEffect(() => {
    if (!heroChatRef.current) return;
    const ob = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !heroChatStarted.current) {
          heroChatStarted.current = true;
          const run = async () => {
            for (let i = 1; i <= heroMessages.length; i++) {
              await new Promise((r) => setTimeout(r, 1400));
              setHeroChatStep(i);
            }
          };
          run();
        }
      },
      { threshold: 0.4 }
    );
    ob.observe(heroChatRef.current);
    return () => ob.disconnect();
  }, []);

  useEffect(() => {
    if (chatStep >= chatMessages.length) return;
    const timer = setTimeout(() => {
      setChatStep((s) => s + 1);
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [chatStep]);

  const faqItems = [
    { q: "L'IA comprend-elle vraiment le Darija ?", a: "Oui, nous avons spécifiquement entraîné nos modèles sur des corpus de données incluant les subtilités du Darija (arabe marocain dialectal) écrit en caractères latins ou arabes, pour une interaction authentique avec vos clients locaux." },
    { q: "Puis-je garder mon numéro WhatsApp actuel ?", a: "Absolument. Sahel s'intègre à votre numéro Business actuel via l'API officielle de WhatsApp pour assurer une transition transparente et conserver votre historique client." },
    { q: "Est-ce facile à configurer sans connaissances techniques ?", a: "C'est notre priorité. La plupart de nos clients lancent leur solution en moins de 15 minutes. Notre équipe vous accompagne d'ailleurs gratuitement lors de la première configuration." }
  ];

  return (
    <div className="bg-background text-on-background font-body-md overflow-x-hidden selection:bg-primary/20 page-enter">
      <div className="cursor-glow" id="cursor-glow"></div>

      {/* Background Orbs */}
      <div className="orb w-96 h-96 bg-primary-container top-[-10%] left-[-10%]"></div>
      <div className="orb w-80 h-80 bg-secondary-fixed top-[40%] right-[-5%]"></div>

      <MarketingHeader />

      {/* Hero Section */}
      <header className="relative pt-40 pb-xl overflow-hidden">
        <div className="max-w-7xl mx-auto px-margin text-center">
          <h1 className="font-display-lg text-display-lg mb-md max-w-4xl mx-auto reveal leading-tight">
            L'intelligence artificielle au service de <span className="italic font-light text-primary">l'artisanat marocain</span>.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-lg max-w-2xl mx-auto reveal" style={{ transitionDelay: '0.1s' }}>
            Propulsez votre PME dans l'ère numérique. Sahel automatise vos ventes, analyse vos données et sublime votre relation client en un temps record.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-sm mb-xl reveal" style={{ transitionDelay: '0.2s' }}>
            <a href={landingCta()} className="bg-primary text-on-primary px-lg py-md rounded-xl font-headline-sm text-lg hover:scale-[1.02] transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-sm no-underline">
              Démarrer mon projet <span className="material-symbols-outlined">rocket_launch</span>
            </a>
            <a href={ROUTES.contact} className="bg-white border border-outline-variant px-lg py-md rounded-xl font-headline-sm text-lg hover:bg-neutral-gray transition-colors flex items-center justify-center gap-sm no-underline">
              Demander une démo <span className="material-symbols-outlined">play_circle</span>
            </a>
          </div>

          {/* Interactive Mockup - Chat + Mini-site */}
          <div className="relative max-w-5xl mx-auto reveal" style={{ transitionDelay: '0.3s' }} ref={heroChatRef}>
            <div className="rounded-2xl overflow-hidden border border-hairline-border shadow-[0_32px_64px_-16px_rgba(0,70,124,0.15)] bg-white">
              <div className="bg-neutral-gray px-md py-sm border-b border-hairline-border flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 text-center text-xs text-outline/60">sahel.ai — Assistant IA</div>
              </div>
              <div className="p-md md:p-lg grid grid-cols-1 md:grid-cols-5 gap-md">
                {/* Chat Panel */}
                <div className="md:col-span-3">
                  <div className="bg-slate-50 rounded-xl border border-hairline-border overflow-hidden">
                    <div className="bg-white px-sm py-2 border-b border-hairline-border flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">S</div>
                      <span className="text-xs font-bold text-on-surface">Assistant Sahel</span>
                      <span className="ml-auto text-[10px] text-green-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> En ligne
                      </span>
                    </div>
                    <div className="p-3 min-h-[260px] flex flex-col gap-2 justify-end">
                      {heroMessages.slice(0, heroChatStep).map((msg, i) => (
                        <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                          <div className={`px-3 py-2 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                            msg.type === 'user'
                              ? 'bg-primary text-on-primary rounded-br-sm'
                              : 'bg-white text-on-surface rounded-bl-sm border border-hairline-border shadow-sm'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      {heroChatStep < heroMessages.length && heroChatStep > 0 && (
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[8px] font-bold shrink-0">S</div>
                          <div className="flex gap-1 px-3 py-2.5 bg-white rounded-xl border border-hairline-border">
                            <span className="w-1.5 h-1.5 rounded-full bg-outline/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-outline/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-outline/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mini Website Preview */}
                <div className="md:col-span-2">
                  <div className="rounded-xl border border-hairline-border overflow-hidden bg-white h-full flex flex-col">
                    <div className="h-24 bg-gradient-to-br from-primary to-tertiary-container relative">
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="w-14 h-14 rounded-xl bg-white shadow-md flex items-center justify-center text-primary font-bold text-lg">RA</div>
                      </div>
                    </div>
                    <div className="p-3 pt-10 flex-1 flex flex-col gap-1.5">
                      <h4 className="font-bold text-sm text-on-surface m-0">Restaurant Atlas</h4>
                      <div className="flex items-center gap-1 text-[10px] text-yellow-500">
                        <span className="material-symbols-outlined !text-[12px]">star</span>
                        <span className="material-symbols-outlined !text-[12px]">star</span>
                        <span className="material-symbols-outlined !text-[12px]">star</span>
                        <span className="material-symbols-outlined !text-[12px]">star</span>
                        <span className="material-symbols-outlined !text-[12px]">star</span>
                        <span className="text-outline ml-1">4.8</span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant m-0 leading-relaxed">
                        Cuisine marocaine · Ouvert 12h-23h · Marrakech
                      </p>
                      <div className="mt-auto pt-2 flex items-center gap-1 text-[10px] text-primary">
                        <span className="material-symbols-outlined !text-[12px]">qr_code_scanner</span>
                        Menu digital
                        <span className="ml-auto material-symbols-outlined !text-[12px]">arrow_forward</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Master Your Data (RAG) */}
      <section className="py-xl bg-neutral-gray overflow-hidden">
        <div className="max-w-7xl mx-auto px-margin flex flex-col md:flex-row items-center gap-xl">
          <div className="flex-1 reveal">
            <h2 className="font-headline-md text-headline-md mb-md">Maîtrisez vos données professionnelles.</h2>
            <p className="text-on-surface-variant font-body-lg text-body-lg mb-lg leading-relaxed">
              Sahel utilise la technologie de <strong>Génération Augmentée par Récupération (RAG)</strong>. Nous n'utilisons pas seulement une IA générique ; nous entraînons un modèle privé sur vos propres documents : catalogues PDF, menus, inventaires et historiques clients.
            </p>
            <div className="space-y-md">
              <div className="flex gap-sm">
                <span className="material-symbols-outlined text-primary bg-primary/5 p-2 rounded-lg">security</span>
                <div>
                  <h4 className="font-bold text-on-surface">Confidentialité Totale</h4>
                  <p className="text-on-surface-variant text-sm">Vos données restent dans votre environnement sécurisé au Maroc.</p>
                </div>
              </div>
              <div className="flex gap-sm">
                <span className="material-symbols-outlined text-primary bg-primary/5 p-2 rounded-lg">psychology</span>
                <div>
                  <h4 className="font-bold text-on-surface">IA Contextuelle</h4>
                  <p className="text-on-surface-variant text-sm">Elle répond avec précision aux questions sur vos stocks ou services spécifiques.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-deep-navy rounded-2xl p-lg relative reveal" style={{ transitionDelay: '0.2s' }}>
            <div className="absolute top-4 right-4 flex gap-xs">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="mt-md font-mono text-sm text-green-400 space-y-2">
              <p className="m-0">&gt; Initializing Sahel RAG engine...</p>
              <p className="m-0">&gt; Loading 14 documents (PDF, CSV, JPEG)...</p>
              <p className="m-0">&gt; Vectorizing knowledge base...</p>
              <p className="m-0 text-white">&gt; Query: "Est-ce qu'il reste du Zellige bleu en 10x10?"</p>
              <p className="m-0 text-blue-400">&gt; Result found in Stock_May.pdf: 14 units remaining.</p>
              <p className="m-0 text-primary-fixed">&gt; Sahel: "Oui, il nous reste exactement 14 unités de Zellige bleu 10x10 en stock."</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-xl" id="features">
        <div className="max-w-7xl mx-auto px-margin">
          <div className="text-center mb-xl reveal">
            <h2 className="font-headline-md text-headline-md mb-sm">Tout ce dont vous avez besoin pour briller.</h2>
            <p className="text-on-surface-variant font-body-lg text-body-lg max-w-xl mx-auto">Une suite complète d'outils intelligents pour transformer votre entreprise locale en leader numérique.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-md bento-stagger">
            {/* Large Card - WhatsApp Assistant */}
            <div className="md:col-span-8 bg-white p-lg rounded-2xl border border-hairline-border flex flex-col md:flex-row gap-lg group hover:shadow-2xl transition-all reveal">
              <div className="flex-1">
                <div className="w-12 h-12 bg-surface-blue rounded-xl flex items-center justify-center text-primary mb-md group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">smart_toy</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm mb-xs">Assistant WhatsApp Intelligent</h3>
                <p className="text-on-surface-variant mb-md">Gérez vos réservations, répondez aux questions fréquentes et vendez 24/7 sur WhatsApp avec une IA qui maîtrise le Darija et le Français.</p>
                <ul className="space-y-xs">
                  <li className="flex items-center gap-xs text-sm text-primary">
                    <span className="material-symbols-outlined text-[18px]">verified</span> Réservations automatiques
                  </li>
                  <li className="flex items-center gap-xs text-sm text-primary">
                    <span className="material-symbols-outlined text-[18px]">verified</span> Traduction instantanée des menus
                  </li>
                </ul>
              </div>
              <div className="flex-1 bg-neutral-gray rounded-xl p-md border border-hairline-border overflow-hidden">
                <div className="flex flex-col gap-sm">
                  <div className="bg-white p-sm rounded-lg self-start text-xs max-w-[80%] shadow-sm">Bonjour ! Avez-vous des tables pour ce soir ?</div>
                  <div className="bg-primary text-on-primary p-sm rounded-lg self-end text-xs max-w-[80%]">Salaam ! Oui, il nous reste 3 tables disponibles pour 20h. Voulez-vous réserver ?</div>
                </div>
              </div>
            </div>

            {/* Small Card - Telegram Bot */}
            <div className="md:col-span-4 bg-white p-lg rounded-2xl border border-hairline-border flex flex-col group hover:shadow-2xl transition-all reveal">
              <div>
                <div className="w-12 h-12 bg-surface-blue rounded-xl flex items-center justify-center text-primary mb-md group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">send</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm mb-xs">Assistant Telegram</h3>
                <p className="text-on-surface-variant">Retrouvez le même assistant IA sur Telegram. Gérez commandes et questions depuis l'application que vous préférez.</p>
              </div>
              <ul className="space-y-xs mt-auto pt-md">
                <li className="flex items-center gap-xs text-sm text-primary">
                  <span className="material-symbols-outlined text-[18px]">verified</span> Notifications en temps réel
                </li>
                <li className="flex items-center gap-xs text-sm text-primary">
                  <span className="material-symbols-outlined text-[18px]">verified</span> Multi-plateforme
                </li>
              </ul>
            </div>

            {/* Row 2 - Dashboard */}
            <div className="md:col-span-4 bg-surface-blue p-lg rounded-2xl border border-hairline-border group reveal">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary mb-md shadow-sm group-hover:-translate-y-1 transition-transform">
                <span className="material-symbols-outlined">analytics</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm mb-xs">Dashboard Analytique</h3>
              <p className="text-on-surface-variant">Visualisez vos performances en temps réel : ventes, produits phares et satisfaction client.</p>
            </div>

            {/* Row 2 - Site Web */}
            <div className="md:col-span-8 bg-white p-lg rounded-2xl border border-hairline-border flex flex-col md:flex-row-reverse gap-lg group reveal">
              <div className="flex-1">
                <div className="w-12 h-12 bg-secondary-container rounded-xl flex items-center justify-center text-secondary mb-md group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">language</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm mb-xs">Site Web Auto-généré</h3>
                <p className="text-on-surface-variant">Votre boutique en ligne est créée automatiquement à partir de vos réseaux sociaux. Aucune compétence technique requise.</p>
              </div>
              <div className="flex-1 rounded-xl bg-neutral-gray p-sm border border-hairline-border overflow-hidden">
                <div className="grid grid-cols-2 gap-xs">
                  <div className="h-20 bg-white rounded-lg shadow-sm"></div>
                  <div className="h-20 bg-white rounded-lg shadow-sm"></div>
                  <div className="h-20 bg-white rounded-lg shadow-sm col-span-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Local Impact */}
      <section className="py-xl bg-warm-bg/20" id="local-impact">
        <div className="max-w-7xl mx-auto px-margin">
          <div className="flex flex-col md:flex-row items-center gap-xl">
            <div className="flex-1 reveal">
              <h2 className="font-headline-md text-headline-md mb-md">Inclusion numérique pour <span className="italic font-light">chaque</span> PME.</h2>
              <p className="text-on-surface-variant font-body-lg text-body-lg mb-lg leading-relaxed">
                Au Maroc, des milliers d'artisans et de commerçants locaux sont exclus de l'économie numérique par manque de temps ou de ressources techniques. Sahel brise ces barrières en offrant des outils puissants, abordables et locaux.
              </p>
              <div className="grid grid-cols-2 gap-md">
                <div className="p-md bg-white rounded-xl shadow-sm border border-hairline-border">
                  <p className="text-3xl font-display-lg text-primary mb-1">500+</p>
                  <p className="text-sm font-label-md text-on-surface-variant">PME Accompagnées</p>
                </div>
                <div className="p-md bg-white rounded-xl shadow-sm border border-hairline-border">
                  <p className="text-3xl font-display-lg text-primary mb-1">24/7</p>
                  <p className="text-sm font-label-md text-on-surface-variant">Support Local</p>
                </div>
              </div>
            </div>
            <div className="flex-1 reveal" style={{ transitionDelay: '0.2s' }}>
              <div className="rounded-3xl overflow-hidden shadow-2xl relative group">
                <div className="w-full h-[400px] bg-gradient-to-br from-primary/80 to-tertiary-container flex items-center justify-center text-white font-display-lg text-6xl group-hover:scale-105 transition-transform duration-700">
                  <span className="material-symbols-outlined text-8xl">precision_manufacturing</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-deep-navy/80 to-transparent flex items-end p-lg">
                  <p className="text-white font-headline-sm italic text-xl leading-relaxed">"Sahel nous a permis de toucher des clients partout au monde tout en restant dans notre atelier à Fès."</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Simulation */}
      <section className="py-xl overflow-hidden">
        <div className="max-w-3xl mx-auto px-margin text-center">
          <h2 className="font-headline-md text-headline-md mb-xl reveal">Vivez l'expérience Sahel</h2>
          <div className="bg-white border border-hairline-border rounded-3xl shadow-2xl overflow-hidden reveal" style={{ transitionDelay: '0.2s' }}>
            <div className="bg-neutral-gray px-md py-sm border-b border-hairline-border flex items-center justify-between">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Assistant Sahel</p>
                  <p className="text-[10px] text-green-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> En ligne
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
            </div>
            <div className="p-md h-[300px] overflow-y-auto bg-slate-50 flex flex-col gap-md" ref={chatContainerRef}>
              {chatMessages.slice(0, chatStep).map((msg, i) => (
                <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm max-w-[80%] ${
                    msg.type === 'user'
                      ? 'bg-primary text-on-primary rounded-tr-none'
                      : 'bg-white text-on-surface rounded-tl-none border border-hairline-border'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatStep < chatMessages.length && chatStep > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">S</div>
                  <div className="flex gap-1 px-3 py-3 bg-white rounded-xl border border-hairline-border">
                    <span className="w-2 h-2 rounded-full bg-outline/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-outline/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-outline/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
            <div className="p-md border-t border-hairline-border flex gap-sm bg-white">
              <div className="flex-1 bg-neutral-gray rounded-full px-md py-2 text-left text-on-surface-variant text-sm">Tapez votre message...</div>
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
                <span className="material-symbols-outlined">send</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-xl bg-deep-navy text-white">
        <div className="max-w-7xl mx-auto px-margin">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
            <div className="reveal">
              <span className="material-symbols-outlined text-primary-fixed text-4xl mb-md">lock_person</span>
              <h3 className="font-headline-sm text-headline-sm mb-sm">Protection des données</h3>
              <p className="text-white/60 text-sm leading-relaxed">Vos documents ne sont pas utilisés pour entraîner des modèles publics. Le traitement IA passe par un tiers de confiance (Groq) et vos données restent sous votre contrôle.</p>
            </div>
            <div className="reveal" style={{ transitionDelay: '0.1s' }}>
              <span className="material-symbols-outlined text-primary-fixed text-4xl mb-md">verified_user</span>
              <h3 className="font-headline-sm text-headline-sm mb-sm">Authentification Sécurisée</h3>
              <p className="text-white/60 text-sm leading-relaxed">Connexion protégée par JWT, mots de passe hachés (PBKDF2), et support Google OAuth. Votre tableau de bord est accessible uniquement par vous.</p>
            </div>
            <div className="reveal" style={{ transitionDelay: '0.2s' }}>
              <span className="material-symbols-outlined text-primary-fixed text-4xl mb-md">history</span>
              <h3 className="font-headline-sm text-headline-sm mb-sm">Sauvegarde Intégrée</h3>
              <p className="text-white/60 text-sm leading-relaxed">Le chatbot conserve l'historique de vos conversations. Vous pouvez exporter vos données ou supprimer votre compte à tout moment depuis votre dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-xl" id="pricing">
        <div className="max-w-7xl mx-auto px-margin">
          <div className="text-center mb-xl reveal">
            <h2 className="font-headline-md text-headline-md mb-sm">Un investissement pour votre futur.</h2>
            <p className="text-on-surface-variant font-body-lg text-body-lg">Simple, transparent, sans engagement.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg items-end">
            {/* Free */}
            <div className="p-lg bg-white border border-hairline-border rounded-2xl reveal group hover:shadow-xl transition-all">
              <p className="font-label-sm uppercase text-on-surface-variant mb-md">Gratuit</p>
              <div className="flex items-baseline gap-1 mb-md">
                <span className="text-4xl font-display-lg font-bold">0 DH</span>
                <span className="text-on-surface-variant">/ mois</span>
              </div>
              <p className="text-sm text-on-surface-variant mb-lg">Idéal pour découvrir Sahel sans engagement.</p>
              <ul className="space-y-sm mb-lg pl-0">
                <li className="flex items-center gap-sm text-sm">
                  <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Site vitrine standard
                </li>
                <li className="flex items-center gap-sm text-sm">
                  <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> 50 commandes/mois
                </li>
                <li className="flex items-center gap-sm text-sm">
                  <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> QR Code basique
                </li>
              </ul>
              <a href={landingCta()} className="w-full block text-center py-3 rounded-xl bg-primary text-on-primary font-label-md shadow-sm hover:shadow-md hover:scale-[1.02] transition-all no-underline">
                Commencer gratuit
              </a>
            </div>

            {/* Pro */}
            <div className="p-lg bg-white border-2 border-primary rounded-2xl reveal relative scale-105 shadow-2xl shadow-primary/10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-4 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest">Recommandé</div>
              <p className="font-label-sm uppercase text-primary mb-md font-bold">Business Pro</p>
              <div className="flex items-baseline gap-1 mb-md">
                <span className="text-5xl font-display-lg font-bold">850</span>
                <span className="text-on-surface-variant">DH/mois</span>
              </div>
              <p className="text-sm text-on-surface-variant mb-lg">La solution complète pour les commerçants ambitieux.</p>
              <ul className="space-y-sm mb-lg pl-0">
                <li className="flex items-center gap-sm text-sm"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Assistant IA WhatsApp &amp; Web</li>
                <li className="flex items-center gap-sm text-sm"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Menu QR Interactif</li>
                <li className="flex items-center gap-sm text-sm"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Commandes illimitées</li>
                <li className="flex items-center gap-sm text-sm"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Dashboard analytique</li>
              </ul>
              <a href={landingCta()} className="w-full block text-center py-4 rounded-xl bg-primary text-on-primary font-label-md shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all no-underline">
                Essayer 7 jours gratuit
              </a>
            </div>

            {/* Enterprise */}
            <div className="p-lg bg-white border border-hairline-border rounded-2xl reveal group hover:shadow-xl transition-all">
              <p className="font-label-sm uppercase text-on-surface-variant mb-md">Enterprise</p>
              <div className="flex items-baseline gap-1 mb-md">
                <span className="text-4xl font-display-lg font-bold">Sur</span>
                <span className="text-on-surface-variant">mesure</span>
              </div>
              <p className="text-sm text-on-surface-variant mb-lg">Pour les franchises et les grandes entreprises.</p>
              <ul className="space-y-sm mb-lg pl-0">
                <li className="flex items-center gap-sm text-sm"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Gestion multi-boutiques</li>
                <li className="flex items-center gap-sm text-sm"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> API Intégration sur mesure</li>
                <li className="flex items-center gap-sm text-sm"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> Support dédié 24/7</li>
              </ul>
              <a href={ROUTES.contact} className="w-full block text-center py-3 rounded-xl border border-outline-variant font-label-md hover:bg-neutral-gray transition-colors no-underline text-on-surface">
                Nous contacter
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-xl bg-neutral-gray" id="faq">
        <div className="max-w-3xl mx-auto px-margin">
          <h2 className="font-headline-md text-headline-md text-center mb-xl reveal">Questions fréquentes</h2>
          <div className="space-y-md reveal">
            {faqItems.map((item, i) => (
              <div key={i} className="border border-hairline-border rounded-xl bg-white overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-lg py-md flex items-center justify-between text-left focus:outline-none transition-colors hover:bg-slate-50 cursor-pointer border-0 bg-transparent"
                >
                  <span className="font-bold text-on-surface">{item.q}</span>
                  <span className={`material-symbols-outlined transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>
                    {openFaq === i ? 'remove' : 'add'}
                  </span>
                </button>
                <div className={`px-lg pb-md text-on-surface-variant text-sm leading-relaxed ${openFaq === i ? 'block' : 'hidden'}`}>
                  {item.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-xl px-margin bg-primary text-on-primary">
        <div className="max-w-7xl mx-auto text-center reveal">
          <h2 className="font-headline-md text-headline-md mb-md text-white">Rejoignez la révolution de l'e-commerce local.</h2>
          <p className="font-body-lg text-body-lg opacity-80 mb-lg max-w-2xl mx-auto text-white">Plus de 500 commerces marocains utilisent déjà Sahel.ai pour booster leurs ventes.</p>
          <a href={landingCta()} className="inline-block bg-white text-primary px-xl py-md rounded-xl font-headline-sm text-headline-sm hover:bg-surface-blue transition-all no-underline font-semibold">
            Lancer mon commerce
          </a>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}


function Section({ number, title, children }) {
  return (
    <div>
      <h2 className="font-headline-md text-headline-md text-on-surface mt-0 mb-sm">
        <span className="text-primary mr-xs">{number}.</span>{title}
      </h2>
      <div className="text-body-md text-on-surface-variant leading-relaxed m-0 space-y-sm">
        {children}
      </div>
    </div>
  );
}

function LegalPage({ title }) {
  const isPrivacy = title === "Politique de confidentialité";
  const isTerms = title === "Conditions d'utilisation";
  const isCookies = title === "Politique cookies";

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col justify-between page-enter">
      <div>
        <MarketingHeader />
        <section className="py-xl px-margin">
          <div className="max-w-3xl mx-auto bg-white rounded-xl border border-hairline-border p-lg md:p-xl text-left">
            <a href={ROUTES.home} className="inline-flex items-center gap-xs text-on-surface-variant font-label-md no-underline hover:text-primary mb-md">
              <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
              Retour à l&apos;accueil
            </a>
            <h1 className="font-display-lg text-display-lg mt-md mb-md">{title}</h1>

            {isPrivacy ? (
              <>
                <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed space-y-lg">
                  <p className="m-0 text-sm text-outline">Dernière mise à jour : avril 2026 — Sahel.ai, développé dans le cadre d&apos;un stage PFE à Minnova Consulting, Tinghir, Maroc.</p>

                  <Section number="1" title="Données collectées">
                    <p>Sahel.ai collecte uniquement les données nécessaires au fonctionnement de la plateforme :</p>
                    <ul>
                      <li>Nom complet et adresse email lors de l&apos;inscription</li>
                      <li>Informations du commerce (nom, type, description, horaires) saisies dans le formulaire</li>
                      <li>Documents uploadés (PDF, Word) contenant les informations du commerce</li>
                      <li>Logs de conversations du chatbot (questions posées par les visiteurs — anonymisées)</li>
                      <li>Adresse IP et navigateur à des fins de sécurité uniquement</li>
                    </ul>
                  </Section>

                  <Section number="2" title="Utilisation des données">
                    <p>Vos données sont utilisées exclusivement pour faire fonctionner votre chatbot, vous envoyer des notifications de service, améliorer les réponses de l&apos;IA, et vous contacter en cas de problème technique. Sahel.ai ne vend jamais vos données à des tiers et n&apos;utilise pas vos documents pour entraîner des modèles globaux.</p>
                  </Section>

                  <Section number="3" title="Hébergement et sécurité">
                    <p>Toutes les données sont stockées sur Supabase (serveurs en Europe) avec chiffrement en transit (HTTPS) et au repos. Les documents uploadés sont traités localement dans notre pipeline RAG et ne sont jamais transmis à des services tiers sans votre consentement. Votre clé API Groq n&apos;est jamais exposée côté client.</p>
                  </Section>

                  <Section number="4" title="Durée de conservation">
                    <p>Vos données de commerce sont conservées tant que votre compte est actif. Les logs de conversations sont conservés 90 jours glissants. Après suppression de votre compte, toutes vos données sont définitivement effacées sous 30 jours.</p>
                  </Section>

                  <Section number="5" title="Vos droits">
                    <p>Conformément au RGPD et à la loi marocaine 09-08 sur la protection des données, vous avez le droit d&apos;accéder à vos données, de les corriger, de les exporter ou de les supprimer à tout moment depuis votre dashboard ou en nous contactant à : <a href="mailto:contact@sahel.ai" className="text-primary underline">contact@sahel.ai</a></p>
                  </Section>
                </div>
              </>
            ) : isTerms ? (
              <>
                <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed space-y-lg">
                  <p className="m-0 text-sm text-outline">Dernière mise à jour : avril 2026 — Sahel.ai, Minnova Consulting, Tinghir.</p>

                  <Section number="1" title="Objet et acceptation">
                    <p>Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et l&apos;utilisation de la plateforme Sahel.ai, développée par MOUHAMED dans le cadre d&apos;un stage PFE à Minnova Consulting, Tinghir. En utilisant Sahel.ai, vous acceptez sans réserve les présentes conditions.</p>
                  </Section>

                  <Section number="2" title="Description du service">
                    <p>Sahel.ai est une plateforme SaaS permettant aux commerces marocains de créer un chatbot IA personnalisé et un mini-site web à partir de leurs documents. Le service comprend : la création et l&apos;hébergement d&apos;un chatbot, la génération d&apos;un mini-site public, un QR code téléchargeable et un tableau de bord analytique.</p>
                  </Section>

                  <Section number="3" title="Obligations de l'utilisateur">
                    <p>En utilisant Sahel.ai, vous vous engagez à :</p>
                    <ul>
                      <li>Fournir des informations exactes et légales sur votre commerce</li>
                      <li>Ne pas uploader de contenu illégal, diffamatoire ou trompeur</li>
                      <li>Ne pas tenter de contourner les limites du plan gratuit</li>
                      <li>Ne pas utiliser Sahel.ai à des fins frauduleuses ou commercialement abusives</li>
                      <li>Être responsable du contenu de votre chatbot vis-à-vis de vos clients</li>
                    </ul>
                  </Section>

                  <Section number="4" title="Limitation de responsabilité">
                    <p>Sahel.ai est fourni &laquo; en l&apos;état &raquo; dans le cadre d&apos;un projet étudiant. Nous ne garantissons pas une disponibilité 24h/24 ni l&apos;exactitude absolue des réponses du chatbot. L&apos;utilisateur est seul responsable des informations fournies dans ses documents et des réponses générées par son chatbot.</p>
                  </Section>

                  <Section number="5" title="Propriété intellectuelle">
                    <p>Le code source, le design et la marque Sahel.ai sont la propriété de leur auteur. Le contenu uploadé par les utilisateurs (documents, descriptions) reste leur propriété exclusive. Sahel.ai n&apos;acquiert aucun droit sur vos données métier.</p>
                  </Section>

                  <Section number="6" title="Résiliation et suppression">
                    <p>Vous pouvez supprimer votre compte et tous vos commerces à tout moment depuis votre dashboard. Sahel.ai se réserve le droit de suspendre un compte en cas de violation des présentes conditions, sans préavis.</p>
                  </Section>

                  <Section number="7" title="Droit applicable">
                    <p>Les présentes CGU sont soumises au droit marocain. En cas de litige, les tribunaux compétents sont ceux de Tinghir, Maroc.</p>
                  </Section>
                </div>
              </>
            ) : isCookies ? (
              <>
                <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed space-y-lg">
                  <p className="m-0 text-sm text-outline">Dernière mise à jour : avril 2026 — Sahel.ai.</p>

                  <Section number="1" title="Qu'est-ce qu'un cookie ?">
                    <p>Un cookie est un petit fichier texte stocké sur votre navigateur lors de votre visite. Sahel.ai utilise un nombre minimal de cookies, listés ci-dessous avec leur fonction exacte.</p>
                  </Section>

                  <Section number="2" title="Cookies utilisés par Sahel.ai">
                    <ul className="space-y-md">
                      <li><strong>Session d&apos;authentification</strong> &mdash; <em>Obligatoire</em><br/>Géré par Supabase Auth. Permet de vous maintenir connecté à votre dashboard sans ressaisir votre mot de passe à chaque visite. Expire après 7 jours d&apos;inactivité. Impossible à désactiver sans perdre l&apos;accès au dashboard.</li>
                      <li><strong>Préférences RGPD</strong> &mdash; <em>Obligatoire</em><br/>Mémorise votre choix de consentement aux cookies (accepté / refusé) afin de ne pas vous redemander à chaque visite. Stocké dans localStorage. Expire après 1 an.</li>
                      <li><strong>Analytics internes</strong> &mdash; <em>Fonctionnel</em><br/>Compte le nombre de conversations sur votre chatbot, les langues utilisées, les questions les plus fréquentes. Données 100% anonymes, stockées dans Supabase, jamais partagées. Nécessaire pour alimenter votre dashboard analytique.</li>
                      <li><strong>Aucun cookie publicitaire</strong> &mdash; <em>Non utilisé</em><br/>Sahel.ai ne contient aucun tracker publicitaire (Google Ads, Facebook Pixel, etc.). Aucune de vos données de navigation n&apos;est vendue ou transmise à des régies publicitaires. Jamais.</li>
                    </ul>
                  </Section>
                </div>
              </>
            ) : (
              <>
                <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                  Cette page est en cours de finalisation. Pour toute question officielle,
                  contactez l&apos;équipe Sahel.ai et nous vous répondrons avec les informations
                  adaptées à votre commerce.
                </p>
              </>
            )}

            <div className="flex flex-wrap gap-sm mt-lg">
              <a href={ROUTES.contact} className="bg-primary text-on-primary px-md py-xs rounded-lg no-underline font-label-md text-label-md">
                Contacter l&apos;équipe
              </a>
              <a href={ROUTES.home} className="bg-white border border-outline-variant text-on-surface px-md py-xs rounded-lg no-underline font-label-md text-label-md">
                Retour accueil
              </a>
            </div>
          </div>
        </section>
      </div>
      <MarketingFooter />
    </div>
  );
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function cleanPhone(value) {
  return (value || '').replace(/[^\d+]/g, '').replace(/^\+/, '');
}

function whatsappUrl(phone, message) {
  const cleanedPhone = cleanPhone(phone);
  if (!cleanedPhone) return '';
  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
}

function emailFromContact(value) {
  return (value || '').match(/[^\s@]+@[^\s@]+\.[^\s@]+/)?.[0] || '';
}

function phoneFromContact(value) {
  const cleanedPhone = cleanPhone(value);
  return cleanedPhone.replace(/\D/g, '').length >= 8 ? cleanedPhone : '';
}

function mailtoUrl(email, subject, body) {
  if (!email) return '';
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function embedSnippet(origin, businessSlug) {
  return `<script src="${origin}/embed.js" data-business="${businessSlug}" defer></script>`;
}

function languageLabel(language) {
  return {
    ar: 'Arabic',
    fr: 'French',
    en: 'English',
    unknown: 'Unknown',
  }[language] || 'Unknown';
}

function InquiryForm({ business, conversationId }) {
  const [form, setForm] = useState({ name: '', contact: '', message: '' });
  const [status, setStatus] = useState('');
  const [sentMessage, setSentMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const submitInquiry = async (event) => {
    event.preventDefault();
    setIsSending(true);
    setStatus('');
    setSentMessage(form.message.trim());

    try {
      const response = await fetch(`${API_URL}/businesses/${business.id}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, conversation_id: conversationId || null }),
      });

      if (!response.ok) {
        throw new Error('Could not send inquiry');
      }

      setForm({ name: '', contact: '', message: '' });
      setStatus('Request sent.');
    } catch {
      setSentMessage('');
      setStatus('Could not send your request. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Form onSubmit={submitInquiry}>
      <Label>
        Name
        <Input
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Your name"
        />
      </Label>
      <Label>
        Phone or email
        <Input
          required
          value={form.contact}
          onChange={(event) => setForm({ ...form, contact: event.target.value })}
          placeholder="+212 6... or email@example.com"
        />
      </Label>
      <Label>
        Request
        <TextArea
          required
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          placeholder="Reservation, quote, availability..."
        />
      </Label>
      <Button disabled={isSending || !form.name.trim() || !form.contact.trim() || !form.message.trim()}>
        {isSending ? 'Sending...' : 'Send request'}
      </Button>
      {status ? <StatusText $error={status.startsWith('Could')}>{status}</StatusText> : null}
      {status === 'Request sent.' && business.owner_phone ? (
        <SecondaryLink
          href={whatsappUrl(
            business.owner_phone,
            `Hello ${business.name}, I just sent a request: ${sentMessage}`,
          )}
          target="_blank"
          rel="noreferrer"
        >
          Contact on WhatsApp
        </SecondaryLink>
      ) : null}
    </Form>
  );
}

function PublicBusinessPage({ slug }) {
  const [business, setBusiness] = useState(null);
  const [status, setStatus] = useState('loading');
  const [conversationId, setConversationId] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/businesses/${slug}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Business not found');
        }
        return response.json();
      })
      .then((data) => {
        setBusiness(data);
        setStatus('ready');
      })
      .catch(() => setStatus('not-found'));
  }, [slug]);

  if (status === 'loading') {
    return <PublicShell>Loading business...</PublicShell>;
  }

  if (status === 'not-found') {
    return <PublicShell>Business not found.</PublicShell>;
  }

  return (
    <AppContainer>
      <Header>
        <Brand><SahelLogo size={22} showText={false} /></Brand>
        <HeaderNav>
          <a href="#assistant">Assistant</a>
          <a href="#contact">Contact</a>
        </HeaderNav>
      </Header>
      <PageTransition>
      <PublicShell>
        <PublicHero>
          <PublicTitle>{business.name}</PublicTitle>
          <InfoPills>
            <InfoPill>Maroc</InfoPill>
            <InfoPill>Ouvert 24h/24</InfoPill>
            <InfoPill style={{ color: '#0f6e56', background: '#e1f5ee' }}>4.8 Rating</InfoPill>
          </InfoPills>
          <p style={{ maxWidth: '680px', color: '#e6f1fb', lineHeight: 1.75 }}>
            {business.description || 'Bienvenue. Posez une question a notre assistant IA pour obtenir des informations, disponibilites ou recommandations.'}
          </p>
          <PublicActions>
            <LinkButton href={`/chat/${business.slug}`}>Ouvrir le chatbot</LinkButton>
            {business.owner_phone ? (
              <SecondaryLink
                href={whatsappUrl(
                  business.owner_phone,
                  `Bonjour ${business.name}, je souhaite plus d'informations.`,
                )}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </SecondaryLink>
            ) : null}
            {business.owner_email ? (
              <SecondaryLink href={`mailto:${business.owner_email}`}>Email</SecondaryLink>
            ) : null}
          </PublicActions>
        </PublicHero>
        <MiniSiteGrid>
          <div>
            <SectionTitle style={{ fontSize: 'clamp(34px, 6vw, 64px)' }}>A propos</SectionTitle>
            <SectionLead>
              Notre assistant connait vos documents et repond aux visiteurs avec le ton
              de votre commerce. Il peut orienter vers WhatsApp, email ou une demande
              de reservation.
            </SectionLead>
            <FeatureGrid>
              <FeatureCard>
                <IconBox>RC</IconBox>
                <h3>Recommandations</h3>
                <p>Des suggestions claires a partir de vos documents.</p>
              </FeatureCard>
              <FeatureCard>
                <IconBox>DM</IconBox>
                <h3>Demandes clients</h3>
                <p>Les demandes sont enregistrees dans votre espace proprietaire.</p>
              </FeatureCard>
            </FeatureGrid>
          </div>
          <ConciergeCard id="assistant">
            <ConciergeHeader>
              <BotAvatar>AI</BotAvatar>
              <div>
                <h2 style={{ margin: 0 }}>Assistant IA {business.name}</h2>
                <Muted style={{ color: '#0f6e56' }}>En ligne</Muted>
              </div>
            </ConciergeHeader>
            <div style={{ padding: '18px' }}>
              <ChatInterface business={business} onConversationChange={setConversationId} compact />
            </div>
          </ConciergeCard>
        </MiniSiteGrid>
        <Panel id="contact" style={{ marginTop: '28px' }}>
          <PanelTitle>Reservation ou demande</PanelTitle>
          <InquiryForm business={business} conversationId={conversationId} />
        </Panel>
        <PublicFooterLinks>
          <span>Politique de confidentialite</span>
          <span>Contact</span>
          <InfoPill>Propulsé par <SahelLogo size={16} showText={false} className="inline-flex" /> Sahel.ai</InfoPill>
        </PublicFooterLinks>
      </PublicShell>
      </PageTransition>
    </AppContainer>
  );
}

function PublicChatPage({ slug }) {
  const [business, setBusiness] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    fetch(`${API_URL}/businesses/${slug}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Business not found');
        }
        return response.json();
      })
      .then((data) => {
        setBusiness(data);
        setStatus('ready');
      })
      .catch(() => setStatus('not-found'));
  }, [slug]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col bg-background text-on-surface">
        <MarketingHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white border border-hairline-border shadow-sm">
            <span className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="font-body-md text-body-md text-on-surface-variant">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="min-h-screen flex flex-col bg-background text-on-surface">
        <MarketingHeader />
        <div className="flex-1 flex items-center justify-center">
          <p className="font-body-md text-body-md text-on-surface-variant">Commerce introuvable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col page-enter">
      <MarketingHeader />

      <main className="flex-1 px-margin py-lg">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <a
            href={ROUTES.miniSite(business.slug)}
            className="inline-flex items-center gap-1.5 text-outline font-label-md text-label-md no-underline hover:text-primary transition-colors mb-md"
          >
            <span className="material-symbols-outlined !text-[16px]">arrow_back</span>
            Retour au mini-site
          </a>

          {/* Chat card header */}
          <div className="flex items-center gap-4 px-md py-4 rounded-t-xl border border-hairline-border border-b-0 bg-white shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
              AI
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-headline-sm text-headline-sm text-on-surface m-0 truncate">
                Assistant IA {business.name}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-label-sm font-label-sm text-secondary font-semibold">En ligne</span>
              </div>
            </div>
            <a
              href={ROUTES.home}
              className="hidden sm:inline-flex items-center gap-1.5 text-outline font-label-md text-label-md no-underline hover:text-primary transition-colors shrink-0"
            >
              <SahelLogo size={16} showText={false} />
              Sahel.ai
            </a>
          </div>

          {/* Chat interface */}
          <ChatInterface business={business} />

          {/* Mobile back link */}
          <div className="flex sm:hidden justify-center mt-md">
            <a
              href={ROUTES.home}
              className="inline-flex items-center gap-1.5 text-outline font-label-md text-label-md no-underline hover:text-primary transition-colors"
            >
              <SahelLogo size={16} showText={false} />
              Propulsé par Sahel.ai
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

function AppRedirect({ to }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return null;
}

function App() {
  const path = window.location.pathname;
  const miniSiteMatch = path.match(/^\/(?:b|business)\/([^/]+)/);
  const chatMatch = path.match(/^\/chat\/([^/]+)/);

  if (miniSiteMatch) {
    return <BusinessShowcasePage slug={miniSiteMatch[1]} />;
  }

  if (chatMatch) {
    return <PublicChatPage slug={chatMatch[1]} />;
  }

  if (path === '/' || path === '') {
    return <LandingPage />;
  }

  if (path === '/about') {
    return <AboutPage />;
  }

  if (path === '/showcase') {
    return <ShowcasePage />;
  }

  if (path === '/faq') {
    return <FaqPage />;
  }

  if (path === '/blog') {
    return <BlogPage />;
  }

  if (path === '/contact') {
    return <ContactPage />;
  }

  if (path === '/privacy') {
    return <LegalPage title="Politique de confidentialité" />;
  }

  if (path === '/terms') {
    return <LegalPage title="Conditions d'utilisation" />;
  }

  if (path === '/cookies') {
    return <LegalPage title="Politique cookies" />;
  }

  if (path === '/verify-email') {
    return <VerifyEmailPage />;
  }

  if (path === '/login') {
    return <LoginPage initialMode="login" />;
  }

  if (path === '/register' || path === '/signup') {
    return <LoginPage initialMode="register" />;
  }

  if (path === '/onboarding') {
    return <OnboardingFlow />;
  }

  if (path === '/success') {
    return <SuccessPage />;
  }

  if (path === '/dashboard') {
    return <DashboardPage />;
  }

  if (path === '/app') {
    return <AppRedirect to={loginUrl(ROUTES.onboarding)} />;
  }

  return <AppRedirect to={ROUTES.home} />;
}

export default App;
