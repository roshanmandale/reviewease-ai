export type Plan = 'free' | 'starter' | 'pro' | 'agency';

export interface User {
  uid: string;
  name: string;
  email: string;
  plan: Plan;
  createdAt: string;
}

export type BusinessCategory =
  | 'Restaurant'
  | 'Cafe'
  | 'Salon'
  | 'Gym'
  | 'Clinic'
  | 'Dentist'
  | 'Hotel'
  | 'Repair Shop'
  | 'Makeup Artist'
  | 'Bakery'
  | 'Pharmacy'
  | 'Retail Store'
  | 'Other';

export interface Business {
  id: string;
  ownerUid: string;
  name: string;
  slug: string;
  category: BusinessCategory;
  placeId: string;
  phone: string;
  city: string;
  address: string;
  logoUrl: string;
  brandColor: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ReviewTone = 'Professional' | 'Friendly' | 'Hindi' | 'Hinglish' | 'Short';

export interface ScanLog {
  id: string;
  businessId: string;
  slug: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userAgent: string;
  timestamp: string;
}

export interface ReviewClick {
  id: string;
  businessId: string;
  rating: number;
  tone: ReviewTone;
  reviewText: string;
  redirected: boolean;
  timestamp: string;
}

export interface AILog {
  id: string;
  businessId: string;
  provider: string;
  model: string;
  tokensUsed: number;
  timestamp: string;
}

export interface Subscription {
  uid: string;
  plan: Plan;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startedAt: string;
  expiresAt: string;
}

export interface AnalyticsData {
  date: string;
  scans: number;
  clicks: number;
}

export interface PricingPlan {
  id: Plan;
  name: string;
  price: number;
  description: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}
