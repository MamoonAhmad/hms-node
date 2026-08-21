export function getUserDisplayName(user) {
  if (!user) return 'User';
  const fromParts = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (fromParts) return fromParts;
  if (user.name?.trim()) return user.name.trim();
  if (user.username?.trim()) return user.username.trim();
  if (user.email) return user.email.split('@')[0];
  return 'User';
}

export function getUserInitials(user) {
  if (!user) return 'U';
  const first = user.firstName?.trim();
  const last = user.lastName?.trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  if (user.name?.trim()) {
    const parts = user.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0]?.[0]?.toUpperCase() || 'U';
  }
  return user.email?.[0]?.toUpperCase() || 'U';
}

export function getUserSubtitle(user) {
  if (!user) return '';
  if (user.username?.trim()) return `@${user.username.trim()}`;
  return user.email || '';
}
