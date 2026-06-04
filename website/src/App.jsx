import { useCallback, useEffect, useState } from 'react';
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
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }
        });
      },
      { threshold: 0.05 }
    );

    const sections = document.querySelectorAll('.reveal-section');
    sections.forEach((section) => {
      section.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-8');
      observer.observe(section);
    });

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  return (
    <div className="bg-background text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed page-enter">
      <MarketingHeader />
      
      {/* Hero Section */}
      <section className="reveal-section relative pt-xl pb-lg px-margin overflow-hidden bg-warm-bg/30">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="font-display-lg text-display-lg max-w-4xl mx-auto mb-md leading-tight">
            Votre commerce en ligne en <span className="italic text-primary">moins de 5 minutes</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-lg">
            Transformez votre boutique locale en une puissance digitale. Gérez vos ventes avec l'IA, des mini-sites rapides et des QR codes intelligents.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-sm mb-xl">
            <a href={landingCta()} className="bg-primary text-on-primary px-lg py-sm rounded-xl font-label-md text-label-md hover:brightness-95 hover:shadow-lg hover:shadow-primary/20 transition-all text-center no-underline">
              Commencer maintenant
            </a>
            <a href="/contact" className="bg-white border border-outline-variant text-on-surface px-lg py-sm rounded-xl font-label-md text-label-md hover:bg-surface-container-low transition-all text-center no-underline">
              Demander une démo
            </a>
          </div>
          
          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md max-w-5xl mx-auto mt-lg">
            <div className="p-md rounded-xl bg-white/60 hairline border-hairline-border text-center hover:shadow-md transition-shadow">
              <span className="block font-headline-md text-headline-md text-primary">5 min</span>
              <span className="text-label-md font-label-md text-outline uppercase tracking-wider">Mise en ligne</span>
            </div>
            <div className="p-md rounded-xl bg-white/60 hairline border-hairline-border text-center hover:shadow-md transition-shadow">
              <span className="block font-headline-md text-headline-md text-primary">3 langues</span>
              <span className="text-label-md font-label-md text-outline uppercase tracking-wider">Ar, Fr, Eng</span>
            </div>
            <div className="p-md rounded-xl bg-white/60 hairline border-hairline-border text-center hover:shadow-md transition-shadow">
              <span className="block font-headline-md text-headline-md text-primary">0 DH</span>
              <span className="text-label-md font-label-md text-outline uppercase tracking-wider">Frais d'inscription</span>
            </div>
          </div>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-primary-fixed/20 blur-[100px] -z-10 rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-fixed/20 blur-[120px] -z-10 rounded-full"></div>
      </section>

      {/* Product Preview — Live Chat Demo */}
      <section id="produit" className="reveal-section py-xl px-margin bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-xl items-center">
            {/* Chat Mockup */}
            <div className="lg:col-span-3">
              <div className="rounded-xl overflow-hidden hairline border-hairline-border bg-white shadow-2xl transition-shadow hover:shadow-3xl duration-300">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-[10px] bg-warm-bg border-b border-hairline-border">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex-1 text-center">
                    <div className="inline-flex items-center gap-1.5 bg-white/70 px-3 py-1 rounded-full text-xs text-outline font-medium">
                      <span className="material-symbols-outlined !text-[14px]">smart_toy</span>
                      chat.sahel.ai — Assistant IA • En ligne
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Conversation */}
                <div className="p-4 space-y-3 bg-[#f1efe8] min-h-[480px] flex flex-col justify-end">
                  {/* Context label */}
                  <div className="text-center mb-1">
                    <span className="inline-flex items-center gap-1 text-[11px] text-outline font-medium bg-white/60 px-3 py-1 rounded-full border border-hairline-border">
                      <span className="material-symbols-outlined !text-[12px]">store</span>
                      Épicerie Atlas — Tinghir
                    </span>
                  </div>

                  {/* User message 1 */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] px-4 py-2.5 rounded-xl rounded-br-sm bg-primary text-on-primary text-sm leading-relaxed shadow-sm"
                      style={{ direction: 'rtl' }}>
                      السلام عليكم، شنو كاين عندكم فالحلويات؟
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <span className="text-[10px] text-outline/60 mt-0.5">15:32</span>
                  </div>

                  {/* AI typing indicator */}
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm">S</div>
                    <div className="flex gap-1 px-3 py-3 bg-white rounded-xl rounded-bl-sm border border-hairline-border">
                      <span className="w-2 h-2 rounded-full bg-outline/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-outline/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-outline/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>

                  {/* AI response 1 */}
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm">S</div>
                    <div className="max-w-[80%] px-4 py-2.5 rounded-xl rounded-bl-sm bg-white text-on-surface text-sm leading-relaxed border border-hairline-border shadow-sm"
                      style={{ direction: 'rtl' }}>
                      وعليكم السلام! 😊 عندنا فهاد الأسبوع:<br />
                      • الجبن البلدي — 35 درهم للكيلو<br />
                      • الكوك بطريقة تقليدية — 25 درهم<br />
                      • الشباكية بالعسل — 40 درهم<br />
                      شنو تحب تأمر؟
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-outline/60 ml-9">15:32</span>
                  </div>

                  {/* User message 2 */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] px-4 py-2.5 rounded-xl rounded-br-sm bg-primary text-on-primary text-sm leading-relaxed shadow-sm">
                      بغيت 2 كيلو جبن وجريدة دالشباكية. واش عندكم توصيل؟
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <span className="text-[10px] text-outline/60 mt-0.5">15:34</span>
                  </div>

                  {/* AI response 2 */}
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm">S</div>
                    <div className="max-w-[80%] px-4 py-2.5 rounded-xl rounded-bl-sm bg-white text-on-surface text-sm leading-relaxed border border-hairline-border shadow-sm">
                      Bien sûr ! ✅ Voici votre commande :<br />
                      • 2 kg Jben — 70 DH<br />
                      • 1 lot Chebakia — 40 DH<br />
                      <strong>Total : 110 DH</strong><br /><br />
                      Oui, on livre à Tinghir sans frais supplémentaires 🚚<br />
                      Vous passez la commande ?
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-outline/60 ml-9">15:34</span>
                  </div>

                  {/* Input bar mockup */}
                  <div className="pt-2">
                    <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-hairline-border shadow-sm">
                      <span className="text-outline/40 text-sm">Écrivez votre message...</span>
                      <div className="ml-auto w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="material-symbols-outlined !text-[16px] text-white">send</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Value Props */}
            <div className="lg:col-span-2 space-y-5">
              <div>
                <span className="text-primary font-label-md text-label-md uppercase tracking-widest">Démo en direct</span>
                <h2 className="font-headline-md text-headline-md mt-sm mb-2">Votre assistant IA parle la langue de vos clients.</h2>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Le chatbot RAG de Sahel.ai répond en Darija, Arabe, Français ou Anglais — avec une connaissance précise de votre inventaire et de vos prix.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/50 border border-hairline-border hover:bg-white/80 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary !text-[20px]">database</span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md font-semibold text-on-surface">RAG sur vos documents</h4>
                    <p className="text-body-sm text-on-surface-variant leading-relaxed mt-0.5">Importez vos catalogues, menus ou fiches produits — l'IA apprend et répond avec vos vraies données.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/50 border border-hairline-border hover:bg-white/80 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-secondary !text-[20px]">translate</span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md font-semibold text-on-surface">Multilingue naturel</h4>
                    <p className="text-body-sm text-on-surface-variant leading-relaxed mt-0.5">Darija, Arabe, Français — le client parle sa langue, l'IA comprend et répond.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/50 border border-hairline-border hover:bg-white/80 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-tertiary !text-[20px]">qr_code_2</span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md font-semibold text-on-surface">QR Code → Chat → Vente</h4>
                    <p className="text-body-sm text-on-surface-variant leading-relaxed mt-0.5">Un scan, une question, une commande. Le parcours client le plus court du Maroc.</p>
                  </div>
                </div>
              </div>

              <a href={landingCta()} className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-label-md text-label-md hover:brightness-95 hover:shadow-lg transition-all no-underline font-semibold">
                Essayer gratuitement
                <span className="material-symbols-outlined !text-[18px]">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="fonctionnalites" className="reveal-section py-xl px-margin bg-warm-bg/20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-lg">
            <span className="text-primary font-label-md text-label-md uppercase tracking-widest">Fonctionnalités</span>
            <h2 className="font-headline-md text-headline-md mt-sm font-bold">Une technologie de pointe pour<br/>les PME marocaines.</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-md">
            {/* RAG AI Card */}
            <div className="md:col-span-8 group relative overflow-hidden bg-white rounded-xl hairline border-hairline-border p-md flex flex-col justify-between hover:border-primary/50 transition-colors shadow-sm hover:shadow-md">
              <div>
                <span className="material-symbols-outlined text-primary mb-sm text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                <h3 className="font-headline-sm text-headline-sm mb-xs">Chatbot IA RAG</h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md">L'IA qui connaît votre inventaire. Elle répond aux clients sur WhatsApp et sur votre site 24/7 avec une précision humaine.</p>
              </div>
              
              <div className="mt-md rounded-lg overflow-hidden h-48 bg-surface-container-low border border-hairline-border relative p-sm flex flex-col justify-end gap-xs">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"></div>
                {/* Chat Mockup */}
                <div className="flex gap-xs items-start max-w-[80%] z-10">
                  <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-[10px] font-bold text-outline shrink-0">C</div>
                  <div className="bg-white px-xs py-[6px] rounded-r-lg rounded-bl-lg border border-hairline-border text-[11px] shadow-sm">
                    Avez-vous des tables dispo ce soir ?
                  </div>
                </div>
                <div className="flex gap-xs items-start max-w-[85%] self-end flex-row-reverse z-10">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white shrink-0">S</div>
                  <div className="bg-primary text-white px-xs py-[6px] rounded-l-lg rounded-br-lg text-[11px] shadow-sm text-left">
                    Oui ! Nous avons 3 tables libres en terrasse pour ce soir. Vous souhaitez que je réserve au nom de qui ? 😊
                  </div>
                </div>
              </div>
            </div>

            {/* Mini-sites Card */}
            <div className="md:col-span-4 bg-primary text-on-primary rounded-xl p-md flex flex-col justify-between overflow-hidden relative shadow-sm hover:shadow-lg transition-all group">
              <div>
                <span className="material-symbols-outlined mb-sm text-3xl">language</span>
                <h3 className="font-headline-sm text-headline-sm mb-xs text-white">Mini-sites Ultra-rapides</h3>
                <p className="font-body-md text-body-md opacity-80">Votre catalogue digital optimisé pour le mobile et le SEO local.</p>
              </div>
              
              <div className="mt-md -mr-md relative">
                {/* Visual Store Catalogue Mockup */}
                <div className="w-full h-32 bg-white/10 rounded-tl-xl border-l border-t border-white/20 p-xs flex flex-col gap-xs transition-transform group-hover:translate-x-1 group-hover:translate-y-1">
                  <div className="w-16 h-3 bg-white/30 rounded-full"></div>
                  <div className="grid grid-cols-2 gap-xs">
                    <div className="bg-white/5 border border-white/10 rounded p-xs flex flex-col gap-1 text-left">
                      <div className="w-full h-10 bg-white/10 rounded"></div>
                      <div className="w-10 h-2 bg-white/30 rounded-full"></div>
                      <div className="w-6 h-2 bg-white/45 rounded-full"></div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded p-xs flex flex-col gap-1 text-left">
                      <div className="w-full h-10 bg-white/10 rounded"></div>
                      <div className="w-8 h-2 bg-white/30 rounded-full"></div>
                      <div className="w-5 h-2 bg-white/45 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Codes */}
            <div className="md:col-span-4 bg-white rounded-xl hairline border-hairline-border p-md flex flex-col justify-between hover:border-primary/50 transition-colors shadow-sm hover:shadow-md">
              <div>
                <span className="material-symbols-outlined text-tertiary mb-sm text-3xl">qr_code_2</span>
                <h3 className="font-headline-sm text-headline-sm mb-xs">QR Codes Dynamiques</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Lien direct entre votre boutique physique et votre inventaire digital.</p>
              </div>
              <div className="flex justify-center items-center mt-md bg-surface-container-low border border-hairline-border rounded-lg p-sm h-32">
                <span className="material-symbols-outlined text-6xl text-outline-variant animate-pulse">qr_code_2</span>
              </div>
            </div>

            {/* Analytics */}
            <div className="md:col-span-8 bg-surface-blue rounded-xl p-md flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <span className="material-symbols-outlined text-primary mb-sm text-3xl">insights</span>
                  <h3 className="font-headline-sm text-headline-sm mb-xs">Analyses en temps réel</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Comprenez ce que vos clients achètent et pourquoi.</p>
                </div>
                <div className="bg-white px-sm py-xs rounded-full hairline border-hairline-border flex items-center gap-xs shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
                  <span className="text-label-sm font-label-sm font-semibold">Live data</span>
                </div>
              </div>
              
              <div className="mt-md flex gap-xs items-end h-24">
                <div className="w-full bg-primary/20 rounded-t h-[60%] hover:bg-primary/30 transition-colors duration-150"></div>
                <div className="w-full bg-primary/40 rounded-t h-[80%] hover:bg-primary/50 transition-colors duration-150"></div>
                <div className="w-full bg-primary rounded-t h-[100%] hover:bg-primary/90 transition-colors duration-150"></div>
                <div className="w-full bg-primary/30 rounded-t h-[50%] hover:bg-primary/45 transition-colors duration-150"></div>
                <div className="w-full bg-primary/60 rounded-t h-[90%] hover:bg-primary/70 transition-colors duration-150"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Timeline */}
      <section className="reveal-section py-xl px-margin bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-xl">
            <h2 className="font-headline-md text-headline-md">Prêt en 3 étapes simples</h2>
          </div>
          
          <div className="relative space-y-lg">
            {/* Vertical Line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-hairline-border"></div>
            
            {/* Step 1 */}
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-md md:gap-lg">
              <div className="md:w-1/2 text-right hidden md:block">
                <h3 className="font-headline-sm text-headline-sm">Connectez votre stock</h3>
                <p className="text-on-surface-variant font-body-md">Importez vos produits via Excel ou simplement en prenant des photos.</p>
              </div>
              <div className="z-10 w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-sm text-headline-sm shadow-lg shadow-primary/20 shrink-0">
                1
              </div>
              <div className="md:w-1/2 md:hidden pl-10">
                <h3 className="font-headline-sm text-headline-sm">Connectez votre stock</h3>
                <p className="text-on-surface-variant font-body-md">Importez vos produits via Excel ou simplement en prenant des photos.</p>
              </div>
              <div className="md:w-1/2 hidden md:block"></div>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-md md:gap-lg">
              <div className="md:w-1/2 hidden md:block"></div>
              <div className="z-10 w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-sm text-headline-sm shadow-lg shadow-primary/20 shrink-0">
                2
              </div>
              <div className="md:w-1/2 pl-10 md:pl-0 text-left">
                <h3 className="font-headline-sm text-headline-sm">Activez l'IA Sahel</h3>
                <p className="text-on-surface-variant font-body-md">L'IA apprend vos prix et vos stocks pour répondre aux clients instantanément.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-md md:gap-lg">
              <div className="md:w-1/2 text-right hidden md:block">
                <h3 className="font-headline-sm text-headline-sm">Vendez partout</h3>
                <p className="text-on-surface-variant font-body-md">Partagez votre lien sur WhatsApp, Instagram ou affichez vos QR codes en magasin.</p>
              </div>
              <div className="z-10 w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-sm text-headline-sm shadow-lg shadow-primary/20 shrink-0">
                3
              </div>
              <div className="md:w-1/2 md:hidden pl-10">
                <h3 className="font-headline-sm text-headline-sm">Vendez partout</h3>
                <p className="text-on-surface-variant font-body-md">Partagez votre lien sur WhatsApp, Instagram ou affichez vos QR codes en magasin.</p>
              </div>
              <div className="md:w-1/2 hidden md:block"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="tarifs" className="reveal-section py-xl px-margin bg-surface-container-low border-t border-hairline-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-xl">
            <h2 className="font-headline-md text-headline-md">Tarification transparente</h2>
            <p className="text-on-surface-variant mt-sm">Pas de frais cachés. Annulez à tout moment.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="bg-white rounded-xl hairline border-hairline-border p-lg flex flex-col justify-between hover:shadow-xl hover:border-outline-variant transition-all duration-300">
              <div>
                <span className="text-label-md font-label-md text-outline uppercase tracking-widest">Essentiel</span>
                <div className="flex items-baseline gap-xs mt-sm text-left">
                  <span className="font-headline-md text-headline-md">0 DH</span>
                  <span className="text-on-surface-variant font-label-md">/ mois</span>
                </div>
                <p className="text-on-surface-variant font-body-md mt-md text-left">Parfait pour démarrer votre digitalisation.</p>
                
                <ul className="mt-lg space-y-sm pl-0">
                  <li className="flex items-center gap-sm font-label-md text-left">
                    <span className="material-symbols-outlined text-secondary text-lg">check_circle</span>
                    Mini-site catalogue
                  </li>
                  <li className="flex items-center gap-sm font-label-md text-left">
                    <span className="material-symbols-outlined text-secondary text-lg">check_circle</span>
                    Jusqu'à 50 produits
                  </li>
                  <li className="flex items-center gap-sm font-label-md text-left">
                    <span className="material-symbols-outlined text-secondary text-lg">check_circle</span>
                    QR Codes basiques
                  </li>
                </ul>
              </div>
              <a href={landingCta()} className="w-full mt-xl bg-white border border-outline-variant text-on-surface py-sm rounded-xl font-label-md hover:bg-surface-container-low transition-all text-center no-underline font-semibold block">
                Commencer gratuitement
              </a>
            </div>

            {/* Pro Tier */}
            <div className="bg-white rounded-xl border-2 border-primary p-lg flex flex-col justify-between relative shadow-2xl shadow-primary/5 hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute -top-4 right-8 bg-primary text-on-primary text-label-sm font-label-sm px-sm py-1 rounded-full font-bold">
                RECOMMANDÉ
              </div>
              <div>
                <span className="text-primary font-label-md text-label-md uppercase tracking-widest font-bold block text-left">Croissance Pro</span>
                <div className="flex items-baseline gap-xs mt-sm text-primary text-left">
                  <span className="font-headline-md text-headline-md font-bold">290 DH</span>
                  <span className="text-on-surface-variant font-label-md">/ mois</span>
                </div>
                <p className="text-on-surface-variant font-body-md mt-md text-left">La solution complète pour les PME ambitieuses.</p>
                
                <ul className="mt-lg space-y-sm pl-0">
                  <li className="flex items-center gap-sm font-label-md text-left">
                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                    Chatbot IA RAG (WhatsApp + Web)
                  </li>
                  <li className="flex items-center gap-sm font-label-md text-left">
                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                    Produits illimités
                  </li>
                  <li className="flex items-center gap-sm font-label-md text-left">
                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                    Analyses avancées &amp; CRM
                  </li>
                  <li className="flex items-center gap-sm font-label-md text-left">
                    <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                    Support prioritaire 24/7
                  </li>
                </ul>
              </div>
              <a href={landingCta()} className="w-full mt-xl bg-primary text-on-primary py-sm rounded-xl font-label-md hover:brightness-95 hover:shadow-lg transition-all text-center no-underline font-semibold block">
                Essai gratuit de 14 jours
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="reveal-section py-xl px-margin bg-primary text-on-primary">
        <div className="max-w-7xl mx-auto text-center">
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

function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      alert("Veuillez remplir tous les champs.");
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col justify-between page-enter">
      <div>
        <MarketingHeader />
        
        <section className="py-xl px-margin">
          <div className="max-w-xl mx-auto bg-white rounded-2xl hairline border-hairline-border p-md md:p-lg shadow-2xl hover:border-primary/30 transition-colors">
            <a href={ROUTES.home} className="inline-flex items-center gap-xs text-on-surface-variant font-label-md no-underline hover:text-primary mb-md">
              <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
              Retour à l'accueil
            </a>
            
            {submitted ? (
              <div className="text-center py-lg animate-fade-in flex flex-col items-center gap-md">
                <div className="w-16 h-16 bg-surface-blue rounded-full flex items-center justify-center text-primary mb-xs">
                  <span className="material-symbols-outlined !text-[36px]">check_circle</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface m-0">Merci pour votre intérêt !</h2>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed max-w-sm m-0">
                  Votre demande de démonstration pour Sahel.ai a bien été reçue. Notre équipe vous contactera par email à <strong>{email}</strong> dans les plus brefs délais.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setName('');
                    setEmail('');
                    setMessage('');
                  }}
                  className="mt-md bg-primary hover:bg-primary-container text-on-primary font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-95 text-center font-label-md text-label-md border-0 cursor-pointer"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <>
                <h1 className="font-display-lg text-display-lg mt-md mb-md">Parlons de votre commerce</h1>
                <p className="font-body-md text-body-md text-on-surface-variant mb-lg leading-relaxed text-left">
                  Pour une mise en place, une question commerciale ou un accompagnement personnalisé, n'hésitez pas à contacter l'équipe Sahel.ai.
                </p>
                
                <form onSubmit={handleSubmit} className="grid gap-md">
                  <label className="grid gap-xs text-on-surface font-semibold text-label-md text-left">
                    Nom complet
                    <input 
                      type="text" 
                      placeholder="Votre nom" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-body-md bg-transparent"
                    />
                  </label>
                  <label className="grid gap-xs text-on-surface font-semibold text-label-md text-left">
                    Adresse email
                    <input 
                      type="email" 
                      placeholder="vous@example.com" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-body-md bg-transparent"
                    />
                  </label>
                  <label className="grid gap-xs text-on-surface font-semibold text-label-md text-left">
                    Message
                    <textarea 
                      rows="4" 
                      placeholder="Expliquez votre besoin" 
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-body-md bg-transparent resize-y text-left"
                    ></textarea>
                  </label>
                  <button 
                    type="submit" 
                    className="bg-primary hover:bg-primary-container text-on-primary font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-95 text-center font-label-md text-label-md border-0 cursor-pointer"
                  >
                    Envoyer la demande
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      </div>

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
            <span className="bg-surface-blue text-primary text-label-md font-label-md px-sm py-1 rounded-full border border-primary/20">
              Sahel.ai
            </span>
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
