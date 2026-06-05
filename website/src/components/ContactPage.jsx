import { useState } from 'react';
import { ROUTES } from '../lib/routes';
import MarketingHeader from './layout/MarketingHeader';
import MarketingFooter from './layout/MarketingFooter';
import InteractiveDots from './InteractiveDots';

export default function ContactPage() {
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
    <div className="text-on-surface min-h-screen flex flex-col page-enter relative">
      <InteractiveDots
        color="rgba(0, 94, 164, 0.4)"
        count={350}
      />
      <div className="relative z-10 flex flex-col min-h-screen">
        <MarketingHeader />
        
        <section className="flex-1 flex items-center justify-center py-xl px-margin">
          <div className="max-w-xl w-full mx-auto bg-white/95 backdrop-blur-sm rounded-2xl border border-hairline-border p-md md:p-lg shadow-2xl hover:border-primary/30 transition-colors relative">
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
                    />
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

        <MarketingFooter />
      </div>
    </div>
  );
}
