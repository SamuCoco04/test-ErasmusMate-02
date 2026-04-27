import { redirect } from 'next/navigation';

export default function CoordinatorHomePage() {
  redirect('/coordinator/dashboard?userId=coordinator-1');
}
