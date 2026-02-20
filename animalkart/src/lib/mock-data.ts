import type {
  User, Warehouse, Order, Payment, Invoice, Wallet,
  ReferralData, Reward, ReferralReward, UnitTransfer, Bank, Notification
} from './types';

export const MOCK_BANKS: Bank[] = [
  { id: 1, name: 'State Bank of India', code: 'SBI' },
  { id: 2, name: 'HDFC Bank', code: 'HDFC' },
  { id: 3, name: 'ICICI Bank', code: 'ICICI' },
  { id: 4, name: 'Axis Bank', code: 'AXIS' },
  { id: 5, name: 'Punjab National Bank', code: 'PNB' },
  { id: 6, name: 'Bank of Baroda', code: 'BOB' },
  { id: 7, name: 'Canara Bank', code: 'CANARA' },
  { id: 8, name: 'Union Bank of India', code: 'UNION' },
  { id: 9, name: 'Kotak Mahindra Bank', code: 'KOTAK' },
  { id: 10, name: 'IndusInd Bank', code: 'INDUSIND' },
  { id: 11, name: 'Yes Bank', code: 'YES' },
  { id: 12, name: 'Federal Bank', code: 'FEDERAL' },
  { id: 13, name: 'Indian Bank', code: 'INDIAN' },
  { id: 14, name: 'Bank of India', code: 'BOI' },
  { id: 15, name: 'Andhra Bank', code: 'ANDHRA' },
];

export const MOCK_WAREHOUSES: Warehouse[] = [
  {
    id: 1,
    name: 'Kurnool Farm',
    location: 'Kurnool, Andhra Pradesh',
    total_capacity: 25000,
    available_units: 18450,
    contact_details: '+91 98765 43210',
    address: 'Survey No. 123, Kurnool - Hyderabad Highway, Kurnool, AP 518001',
  },
  {
    id: 2,
    name: 'Vijayawada Farm',
    location: 'Vijayawada, Andhra Pradesh',
    total_capacity: 25000,
    available_units: 21200,
    contact_details: '+91 98765 43211',
    address: 'Plot No. 45, Krishna District, Vijayawada, AP 520001',
  },
  {
    id: 3,
    name: 'Guntur Farm',
    location: 'Guntur, Andhra Pradesh',
    total_capacity: 25000,
    available_units: 19800,
    contact_details: '+91 98765 43212',
    address: 'Survey No. 78, Guntur - Tenali Road, Guntur, AP 522001',
  },
  {
    id: 4,
    name: 'Kakinada Farm',
    location: 'Kakinada, Andhra Pradesh',
    total_capacity: 25000,
    available_units: 22100,
    contact_details: '+91 98765 43213',
    address: 'Plot No. 90, East Godavari District, Kakinada, AP 533001',
  },
];

export const MOCK_INVESTOR: User = {
  id: 'inv_001',
  full_name: 'Rajesh Kumar',
  email: 'rajesh.kumar@example.com',
  phone: '9876543210',
  whatsapp_number: '9876543210',
  address: '123, MG Road, Hyderabad, Telangana 500001',
  pan_card: 'ABCDE1234F',
  aadhaar_number: '123456789012',
  bank_name: 'HDFC Bank',
  account_number: '50100123456789',
  ifsc_code: 'HDFC0001234',
  account_holder_name: 'Rajesh Kumar',
  role: 'investor',
  referral_code: 'RAJ2024',
  referred_by: 'AGT001',
  kyc_status: 'approved',
  is_active: true,
  registration_date: '2024-01-15',
  units_owned: 8,
};

export const MOCK_AGENT: User = {
  id: 'agt_001',
  full_name: 'Suresh Reddy',
  email: 'suresh.reddy@example.com',
  phone: '9876543220',
  whatsapp_number: '9876543220',
  address: '456, Jubilee Hills, Hyderabad, Telangana 500033',
  pan_card: 'FGHIJ5678K',
  aadhaar_number: '234567890123',
  bank_name: 'State Bank of India',
  account_number: '30123456789',
  ifsc_code: 'SBIN0001234',
  account_holder_name: 'Suresh Reddy',
  role: 'agent',
  referral_code: 'SUR2024',
  kyc_status: 'approved',
  is_active: true,
  registration_date: '2023-11-10',
  units_owned: 2,
};

export const MOCK_ORDERS: Order[] = [
  {
    order_id: 'SO0001',
    order_reference: 'AK-2024-001',
    total_amount: 1750000,
    payment_method: 'bank_transfer',
    status: 'confirmed',
    warehouse_id: 1,
    warehouse_name: 'Kurnool Farm',
    quantity: 5,
    created_at: '2024-01-20T10:30:00Z',
  },
  {
    order_id: 'SO0002',
    order_reference: 'AK-2024-002',
    total_amount: 1050000,
    payment_method: 'cheque',
    status: 'confirmed',
    warehouse_id: 2,
    warehouse_name: 'Vijayawada Farm',
    quantity: 3,
    created_at: '2024-02-05T14:00:00Z',
  },
];

export const MOCK_PAYMENTS: Payment[] = [
  {
    payment_id: 'PAY001',
    order_id: 'SO0001',
    payment_status: 'confirmed',
    payment_date: '2024-01-21T09:00:00Z',
    amount: 1750000,
    payment_method: 'bank_transfer',
  },
  {
    payment_id: 'PAY002',
    order_id: 'SO0002',
    payment_status: 'confirmed',
    payment_date: '2024-02-06T11:00:00Z',
    amount: 1050000,
    payment_method: 'cheque',
  },
];

export const MOCK_INVOICES: Invoice[] = [
  {
    invoice_id: 'INV/2024/0001',
    invoice_number: 'AK-INV-2024-001',
    invoice_date: '2024-01-21',
    pdf_url: '/invoices/AK-INV-2024-001.pdf',
    whatsapp_sent: true,
    email_sent: true,
    order_id: 'SO0001',
    amount: 1750000,
  },
  {
    invoice_id: 'INV/2024/0002',
    invoice_number: 'AK-INV-2024-002',
    invoice_date: '2024-02-06',
    pdf_url: '/invoices/AK-INV-2024-002.pdf',
    whatsapp_sent: true,
    email_sent: true,
    order_id: 'SO0002',
    amount: 1050000,
  },
];

export const MOCK_WALLET: Wallet = {
  balance: 245000,
  total_earned: 350000,
  total_spent: 105000,
  transactions: [
    {
      transaction_id: 'TXN001',
      type: 'commission_earned',
      amount: 17500,
      description: 'Commission from Investor Priya Sharma - 1 unit (Direct)',
      date: '2024-02-10T10:00:00Z',
    },
    {
      transaction_id: 'TXN002',
      type: 'commission_earned',
      amount: 35000,
      description: 'Commission from Investor Amit Singh - 2 units (Direct)',
      date: '2024-02-08T14:30:00Z',
    },
    {
      transaction_id: 'TXN003',
      type: 'commission_earned',
      amount: 1750,
      description: 'Commission from Investor Deepak Rao - 1 unit (Indirect)',
      date: '2024-02-05T09:15:00Z',
    },
    {
      transaction_id: 'TXN004',
      type: 'unit_purchased',
      amount: -350000,
      description: 'Unit purchased at Kurnool Farm using wallet balance',
      date: '2024-01-25T16:00:00Z',
    },
    {
      transaction_id: 'TXN005',
      type: 'commission_earned',
      amount: 87500,
      description: 'Commission from Investor Kavya Reddy - 5 units (Direct)',
      date: '2024-01-20T11:00:00Z',
    },
  ],
};

export const MOCK_REFERRAL_DATA: ReferralData = {
  referral_code: 'RAJ2024',
  total_referrals: 12,
  direct_referrals: 8,
  indirect_referrals: 4,
  referral_tree: [
    {
      referral_id: 'ref_001',
      name: 'Priya Sharma',
      level: 1,
      units_purchased: 5,
      commission_earned: 87500,
      date: '2024-01-15',
      email: 'priya.sharma@example.com',
    },
    {
      referral_id: 'ref_002',
      name: 'Amit Singh',
      level: 1,
      units_purchased: 3,
      commission_earned: 52500,
      date: '2024-01-20',
      email: 'amit.singh@example.com',
    },
    {
      referral_id: 'ref_003',
      name: 'Kavya Reddy',
      level: 1,
      units_purchased: 10,
      commission_earned: 175000,
      date: '2024-01-22',
      email: 'kavya.reddy@example.com',
    },
    {
      referral_id: 'ref_004',
      name: 'Deepak Rao',
      level: 2,
      units_purchased: 2,
      commission_earned: 3500,
      date: '2024-02-01',
      email: 'deepak.rao@example.com',
    },
    {
      referral_id: 'ref_005',
      name: 'Sunita Patel',
      level: 1,
      units_purchased: 1,
      commission_earned: 17500,
      date: '2024-02-05',
      email: 'sunita.patel@example.com',
    },
  ],
};

export const MOCK_PURCHASE_REWARDS: Reward[] = [
  {
    id: 'rew_001',
    type: 'thailand_1',
    label: 'Thailand Trip for 1 Person',
    threshold: 5,
    claimed: true,
    eligible: true,
  },
  {
    id: 'rew_002',
    type: 'thailand_2',
    label: 'Thailand Trip for 2 Persons',
    threshold: 10,
    claimed: false,
    eligible: false,
  },
  {
    id: 'rew_003',
    type: 'silver_thailand',
    label: '1kg Silver + Thailand Trip for 2',
    threshold: 50,
    claimed: false,
    eligible: false,
  },
  {
    id: 'rew_004',
    type: 'thar',
    label: 'Mahindra Thar Roxx 4x4',
    threshold: 100,
    claimed: false,
    eligible: false,
  },
];

export const MOCK_REFERRAL_REWARDS: ReferralReward[] = [
  {
    investor_name: 'Kavya Reddy',
    investor_id: 'ref_003',
    total_units: 35,
    checkpoints: {
      checkpoint_30: { reached: true, claimed: true, reward_chosen: 'thailand_trip' },
      checkpoint_50: { reached: false, claimed: false },
      checkpoint_100: { reached: false, claimed: false },
    },
  },
  {
    investor_name: 'Priya Sharma',
    investor_id: 'ref_001',
    total_units: 5,
    checkpoints: {
      checkpoint_30: { reached: false, claimed: false },
      checkpoint_50: { reached: false, claimed: false },
      checkpoint_100: { reached: false, claimed: false },
    },
  },
];

export const MOCK_UNIT_TRANSFERS: UnitTransfer[] = [
  {
    transfer_id: 'TRF001',
    agent_id: 'agt_001',
    unit_id: 'UNIT_KNL_001',
    investor_id: 'inv_005',
    investor_name: 'Ravi Teja',
    transfer_date: '2024-02-10T10:00:00Z',
    transfer_status: 'completed',
    notes: 'Transfer as per agreement',
  },
  {
    transfer_id: 'TRF002',
    agent_id: 'agt_001',
    unit_id: 'UNIT_VJA_002',
    investor_id: 'inv_008',
    investor_name: 'Lakshmi Devi',
    transfer_date: '2024-02-15T14:00:00Z',
    transfer_status: 'pending',
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_001',
    title: 'Payment Confirmed',
    message: 'Your payment of ₹1,75,000 for Order AK-2024-001 has been confirmed.',
    type: 'payment',
    read: false,
    date: '2024-02-10T10:00:00Z',
  },
  {
    id: 'notif_002',
    title: 'Commission Credited',
    message: '₹17,500 commission credited to your wallet from Priya Sharma\'s purchase.',
    type: 'commission',
    read: false,
    date: '2024-02-10T10:05:00Z',
  },
  {
    id: 'notif_003',
    title: 'Reward Eligible!',
    message: 'Kavya Reddy has reached 30 units! You are eligible for a Thailand Trip reward.',
    type: 'reward',
    read: true,
    date: '2024-02-08T14:00:00Z',
  },
  {
    id: 'notif_004',
    title: 'Invoice Generated',
    message: 'Invoice AK-INV-2024-002 has been generated and sent to your WhatsApp and Email.',
    type: 'purchase',
    read: true,
    date: '2024-02-06T11:30:00Z',
  },
  {
    id: 'notif_005',
    title: 'Unit Transfer Completed',
    message: 'Unit UNIT_KNL_001 has been successfully transferred to Ravi Teja.',
    type: 'transfer',
    read: true,
    date: '2024-02-10T10:30:00Z',
  },
];

export const UNIT_PRICE = 350000;
export const COINS_PER_RUPEE = 1;
export const DIRECT_COMMISSION_RATE = 0.05;
export const INDIRECT_COMMISSION_RATE = 0.005;
export const WALLET_THRESHOLD_FOR_PURCHASE = 350000;
