export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'AUD' | 'CAD';

export interface SheetItem {
  id: string;
  name: string;
  description: string;
  unit: string;
  price: number | null;
}

export interface RequestSheet {
  version: 1;
  businessName: string;
  heading: string;
  intro: string;
  email: string;
  currency: Currency;
  validityNote: string;
  items: SheetItem[];
  customClosing?: string;
  referenceLabel?: string;
  hideCredit?: boolean;
}

export interface RequestLine extends SheetItem {
  quantity: number;
}

export interface ClientRequest {
  reference: string;
  createdAt: string;
  clientName: string;
  contact: string;
  requestedBy: string;
  clientReference: string;
  notes: string;
  lines: RequestLine[];
}

export interface RequestPacket {
  type: 'request-sheet-packet';
  version: 1;
  sheet: RequestSheet;
  request: ClientRequest;
}
