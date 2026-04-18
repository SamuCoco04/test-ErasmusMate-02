import { redirect } from 'next/navigation';

export default function CoordinatorHomePage() {
  redirect('/coordinator/review-queue?userId=coordinator-1');
}
