'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

type ContextualLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
  fallbackUserId?: string;
  forceUserId?: string;
  onClick?: () => void;
};

export function ContextualLink({ href, className, children, fallbackUserId, forceUserId, onClick }: ContextualLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentUserId = searchParams.get('userId') ?? fallbackUserId;
  const [basePath, baseQuery = ''] = href.split('?');
  const targetParams = new URLSearchParams(baseQuery);

  if (forceUserId) {
    targetParams.set('userId', forceUserId);
  } else if (currentUserId && !targetParams.get('userId')) {
    targetParams.set('userId', currentUserId);
  }

  const resolvedHref = targetParams.toString() ? `${basePath}?${targetParams.toString()}` : basePath;
  const isActive = pathname === basePath;

  return (
    <Link href={resolvedHref} className={className} aria-current={isActive ? 'page' : undefined} onClick={onClick}>
      {children}
    </Link>
  );
}
