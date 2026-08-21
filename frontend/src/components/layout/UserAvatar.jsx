import { cn } from '@/lib/utils';
import { getUserInitials } from '@/lib/userDisplay';

export function UserAvatar({ user, className, imageClassName }) {
  const initials = getUserInitials(user);
  const picture = user?.profilePicture;

  if (picture) {
    return (
      <img
        src={picture}
        alt=""
        className={cn('rounded-full object-cover', className, imageClassName)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground',
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
