import { Briefcase, FileCheck2, GraduationCap, Landmark, ShieldCheck, User } from 'lucide-react';
import { AVATAR_COLORS, isSafeRasterDataUrl } from '../lib/authStorage';

const ICON_MAP = {
  shield: ShieldCheck,
  landmark: Landmark,
  graduation: GraduationCap,
  briefcase: Briefcase,
  file: FileCheck2,
  user: User
};

export default function UserAvatar({ avatar = {}, name = 'User', size = 'md' }) {
  const palette = AVATAR_COLORS.find(c => c.id === avatar.color) || AVATAR_COLORS[0];
  const Icon = ICON_MAP[avatar.icon] || User;
  const dims = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl'
  }[size] || 'h-10 w-10 text-sm';

  if (avatar.style === 'image' && isSafeRasterDataUrl(avatar.imageUrl)) {
    return (
      <img
        src={avatar.imageUrl}
        alt={name}
        className={`${dims} shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-slate-800`}
      />
    );
  }

  const initials = (avatar.initials || name.slice(0, 2) || 'U').toUpperCase().slice(0, 2);
  return (
    <span
      className={`${dims} inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${palette.bg} font-semibold text-white shadow-xs`}
      aria-hidden="true"
    >
      {avatar.style === 'initials' ? initials : <Icon size={size === 'lg' ? 26 : size === 'sm' ? 14 : 18} />}
    </span>
  );
}
