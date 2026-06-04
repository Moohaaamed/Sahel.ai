export default function SahelLogo({ size = 28, showText = true, textClass = '' }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
        <path d="M30 65C30 50 45 40 50 40C55 40 70 50 70 65C70 80 55 90 50 90C45 90 30 80 30 65Z" fill="none" stroke="#378ADD" strokeWidth="8" strokeLinecap="round"/>
        <path d="M70 35C70 50 55 60 50 60C45 60 30 50 30 35C30 20 45 10 50 10C55 10 70 20 70 35Z" fill="none" stroke="#378ADD" strokeWidth="8" strokeLinecap="round" opacity="0.6"/>
        <circle cx="50" cy="50" r="4" fill="#378ADD"/>
      </svg>
      {showText && <span className={textClass || 'font-headline-sm text-headline-sm font-bold'}>Sahel.ai</span>}
    </span>
  );
}
