import { SocialShell } from '@/components/shell/social-shell';

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return <SocialShell>{children}</SocialShell>;
}
