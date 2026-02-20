export type UserRole = 'agent' | 'investor' | 'admin';

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  address: string;
  pan_card: string;
  aadhaar_number: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  account_holder_name: string;
  role: UserRole;
  referral_code: string;
  referred_by?: string;
  kyc_status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  registration_date: string;
  units_owned: number;
}

export interface Warehouse {
  id: number;
  name: string;
  location: string;
  total_capacity: number;
  available_units: number;
  contact_details: string;
  address: string;
}

export interface CartItem {
  warehouse_id: number;
  warehouse_name: string;
  product_id?: number;
  sku?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Order {
  order_id: string;
  order_reference: string;
  total_amount: number;
  payment_method: 'bank_transfer' | 'cheque' | 'cash';
  status: 'draft' | 'confirmed' | 'cancelled';
  warehouse_id: number;
  warehouse_name: string;
  quantity: number;
  created_at: string;
}

export interface Payment {
  payment_id: string;
  order_id: string;
  payment_status: 'pending' | 'confirmed' | 'rejected';
  payment_date: string;
  admin_remarks?: string;
  amount: number;
  payment_method: string;
}

export interface Invoice {
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  pdf_url: string;
  whatsapp_sent: boolean;
  email_sent: boolean;
  order_id: string;
  amount: number;
}

export interface WalletTransaction {
  transaction_id: string;
  type: 'commission_earned' | 'unit_purchased' | 'reward_credited';
  amount: number;
  description: string;
  date: string;
}

export interface Wallet {
  balance: number;
  total_earned: number;
  total_spent: number;
  transactions: WalletTransaction[];
}

export interface Referral {
  referral_id: string;
  name: string;
  level: 1 | 2;
  units_purchased: number;
  commission_earned: number;
  date: string;
  email: string;
}

export interface ReferralData {
  referral_code: string;
  total_referrals: number;
  direct_referrals: number;
  indirect_referrals: number;
  referral_tree: Referral[];
}

export interface Reward {
  id: string;
  type: 'thailand_1' | 'thailand_2' | 'silver_thailand' | 'thar';
  label: string;
  threshold: number;
  claimed: boolean;
  eligible: boolean;
}

export interface ReferralReward {
  investor_name: string;
  investor_id: string;
  total_units: number;
  checkpoints: {
    checkpoint_30: { reached: boolean; claimed: boolean; reward_chosen?: string };
    checkpoint_50: { reached: boolean; claimed: boolean; reward_chosen?: string };
    checkpoint_100: { reached: boolean; claimed: boolean; reward_chosen?: string };
  };
}

export interface UnitTransfer {
  transfer_id: string;
  agent_id: string;
  unit_id: string;
  investor_id: string;
  investor_name: string;
  transfer_date: string;
  transfer_status: 'pending' | 'completed' | 'rejected';
  notes?: string;
}

export interface Bank {
  id: number;
  name: string;
  code: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'purchase' | 'payment' | 'commission' | 'reward' | 'transfer' | 'general';
  read: boolean;
  date: string;
}
