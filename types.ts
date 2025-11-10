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
  themeColor: string;
  headerImage: string | null;
  taxType: TaxType;
  taxRate: number;
}

export interface User {
  id: string;
  fullName: string;
  companyName: string;
  phone: string;
  email?: string;
  is_admin?: boolean;
}