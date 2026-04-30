import { redirect } from 'next/navigation';

// Pricing page removed — admin manages accounts directly
export default function PricingPage() {
  redirect('/login');
}
