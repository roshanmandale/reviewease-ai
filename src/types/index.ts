export type Plan = 'free' | 'starter' | 'pro' | 'agency';
export type UserRole = 'owner' | 'admin';

export interface User {
  uid: string;
  name: string;
  email: string;
  plan: Plan;
  role: UserRole;
  businessLimit: number;   // max businesses this user can create
  disabled: boolean;       // admin can disable accounts
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
  about: string;
  speciality: string;
  logoUrl: string;
  brandColor: string;
  active: boolean;
  // Data retention fields
  lastReportGeneratedAt?: string;
  nextDeletionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessReport {
  id: string;
  businessId: string;
  businessName: string;
  ownerUid: string;
  periodStart: string;
  periodEnd: string;
  totalScans: number;
  totalClicks: number;
  conversionRate: number;
  pdfUrl: string;
  generatedAt: string;
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
