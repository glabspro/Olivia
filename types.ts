export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
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

export interface Settings {
  companyName: string;
  companyLogo: string | null;
  currencySymbol: string;
  defaultMarginType: MarginType;
  defaultMarginValue: number;
}

export interface User {
  id: string;
  fullName: string;
  companyName: string;
  phone: string;
  email?: string;
}