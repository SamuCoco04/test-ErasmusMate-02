import { redirect } from 'next/navigation';

export default function SocialHomePage() {
  redirect('/social/profile?userId=student-1');
}
