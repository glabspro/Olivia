
export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface ExtractedData {
  items: QuotationItem[];
  clientName?: string;
}

export enum MarginType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  AMOUNT = 'amount',
}

export enum Template {
  MODERN = 'modern',
  CLASSIC = 'classic',
  MINIMALIST = 'minimalist',
  ELEGANT = 'elegant',
  BOLD = 'bold',
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export enum TaxType {
  INCLUDED = 'included',
  ADDED = 'added',
}

export interface PaymentOption {
  id: string;
  name: string;
  details: string;
}

export interface Settings {
  companyName: string;
  companyLogo: string | null;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyDocumentType?: 'RUC' | 'DNI' | '';
  companyDocumentNumber?: string;
  currencySymbol: string;
  defaultMarginType: MarginType;
  defaultMarginValue: number;
  defaultTemplate: Template;
  paymentTerms: PaymentOption[];
  paymentMethods: PaymentOption[];
  quotationPrefix: string;
  quotationNextNumber: number;
  quotationPadding?: number; 
  themeColor: string;
  headerImage: string | null;
  taxType: TaxType;
  taxRate: number;
  calComLink?: string; 
}

// Landing Page specific configuration
export interface LandingConfig {
    // Domain Settings
    appUrl?: string; // URL where the "Login/Start" buttons redirect (e.g., https://app.olivia.com)

    // Socials
    facebookUrl?: string;
    instagramUrl?: string;
    tiktokUrl?: string;
    youtubeUrl?: string;
    contactEmail?: string;
    mainVideoUrl?: string; // URL for the main demo video button
    
    // Side Tutorials
    tutorial1Url?: string;
    tutorial1Thumbnail?: string; // URL to image (Postimages, etc)
    tutorial2Url?: string;
    tutorial2Thumbnail?: string;
}

// System Wide Configuration (Managed by Super Admin)
export interface SystemConfig {
    salesPhoneNumber: string;
    paymentPhoneNumber: string;
    mercadoPagoPublicKey?: string;
    mercadoPagoAccessToken?: string;
    isMaintenanceMode?: boolean;
    landing?: LandingConfig; // New field for landing page dynamic data
}

// Admin & Permissions Types
export interface UserPermissions {
    can_use_ai: boolean;
    can_download_pdf: boolean;
    plan: 'free' | 'pro' | 'enterprise';
    is_active: boolean;
    trial_ends_at?: string; // ISO String date for trial expiration
}

export interface User {
  id: string;
  fullName: string;
  companyName: string;
  phone: string;
  email?: string;
  is_admin?: boolean;
  is_onboarded?: boolean;
  permissions?: UserPermissions;
  verify_token?: string;
  is_verified?: boolean;
  ai_usage_count?: number;
  settings?: Settings; 
  system_config?: SystemConfig; // Only present if user is Super Admin (mock)
}

// Database Types
export interface DbClient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  document?: string; 
}

export interface DbProduct {
  id: string;
  name: string;
  unit_price: number;
  currency: string;
}

export interface DbTask {
  id: string;
  user_id: string;
  description: string;
  due_date?: string;
  is_completed: boolean;
  is_important?: boolean; 
  reminder_sent?: boolean;
  created_at: string;
}

export interface CrmMeta {
    next_followup?: string; 
    notes?: string;
}

export interface SavedQuotation {
  id: string;
  quotation_number: string;
  client: DbClient;
  total_amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'negotiation' | 'accepted' | 'rejected';
  created_at: string;
  items?: QuotationItem[];
  discount?: number;
  discount_type?: 'amount' | 'percentage';
  tags?: string[];
  crm_meta?: CrmMeta;
}
