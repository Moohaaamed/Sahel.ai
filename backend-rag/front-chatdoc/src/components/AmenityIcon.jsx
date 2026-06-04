import { isEmojiIcon } from '../lib/businessSite';

export default function AmenityIcon({ icon, className = 'text-[18px]', filled = true, onPrimary = false }) {
  if (!icon) return null;

  if (isEmojiIcon(icon) || icon.startsWith('e:')) {
    const emoji = icon.startsWith('e:') ? icon.slice(2) : icon;
    return <span className={`text-lg leading-none ${className}`}>{emoji}</span>;
  }

  return (
    <span
      className={`material-symbols-outlined ${onPrimary ? 'text-on-primary' : 'text-primary'} ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {icon}
    </span>
  );
}
