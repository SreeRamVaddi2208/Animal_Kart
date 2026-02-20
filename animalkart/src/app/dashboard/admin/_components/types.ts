export type KycStatus = 'pending' | 'approved' | 'rejected';
export type PayStatus = 'pending' | 'approved' | 'rejected';

export interface KycRecord {
  id: string;
  name: string;
  email: string;
  pan: string;
  aadhaar: string;
  role: string;
  submitted: string;
  status: KycStatus;
}

export interface PaymentRecord {
  id: string;
  investor: string;
  email: string;
  amount: number;
  units: number;
  method: string;
  date: string;
  status: PayStatus;
  ref: string;
}

export interface WarehouseRecord {
  id: number;
  name: string;
  location: string;
  total: number;
  sold: number;
  available: number;
}
