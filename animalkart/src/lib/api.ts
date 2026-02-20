export type LiveWarehouseStock = {
  warehouse_id: number;
  warehouse_name: string;
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: number;
  qty_available: number;
};

export type AuthPayload = {
  full_name: string;
  email: string;
  phone?: string;
  whatsapp_number?: string;
  address?: string;
  pan_card?: string;
  aadhaar_number?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  role: 'agent' | 'investor';
};

export type AuthResponse = {
  success: boolean;
  message: string;
  token: string;
  partner_id: number;
  full_name?: string | null;
  email?: string | null;
  role?: 'agent' | 'investor' | 'admin' | string;
  phone?: string | null;
  whatsapp_number?: string | null;
  address?: string | null;
  pan_card?: string | null;
  aadhaar_number?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  account_holder_name?: string | null;
  referral_code?: string | null;
  kyc_status?: 'pending' | 'approved' | 'rejected' | string;
  registration_date?: string | null;
  units_owned?: number | null;
};

export type CheckoutLine = {
  warehouse_id: number;
  product_id?: number;
  sku?: string;
  quantity: number;
};

export type CheckoutResponse = {
  success: boolean;
  order_id: number;
  order_number: string;
  invoice_id?: number | null;
  invoice_number?: string | null;
  status: string;
};

export type LiveOrder = {
  order_id: number;
  order_reference: string;
  total_amount: number;
  payment_method: string;
  status: string;
  warehouse_id?: number | null;
  warehouse_name?: string | null;
  created_at: string;
};

export type LiveInvoice = {
  invoice_id: number;
  invoice_number: string;
  invoice_date: string;
  amount: number;
  order_reference?: string | null;
  payment_state?: string | null;
};

export type LiveWalletTransaction = {
  transaction_id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
};

export type LiveWallet = {
  balance: number;
  total_earned: number;
  total_spent: number;
  transactions: LiveWalletTransaction[];
};

export type LiveReferral = {
  referral_id: string;
  name: string;
  level: number;
  units_purchased: number;
  commission_earned: number;
  date: string;
  email?: string | null;
};

export type LiveReferralsData = {
  referral_code: string;
  total_referrals: number;
  direct_referrals: number;
  indirect_referrals: number;
  items: LiveReferral[];
};

export type LivePurchaseReward = {
  id: string;
  type: string;
  label: string;
  threshold: number;
  claimed: boolean;
  eligible: boolean;
};

export type LiveReferralReward = {
  investor_name: string;
  investor_id: string;
  total_units: number;
  checkpoints: Record<string, { reached: boolean; claimed: boolean; reward_chosen?: string | null }>;
};

export type LiveRewards = {
  total_units: number;
  purchase_rewards: LivePurchaseReward[];
  referral_rewards: LiveReferralReward[];
};

export type LiveOwnedUnit = {
  unit_id: string;
  warehouse_name?: string | null;
  purchased_date: string;
};

export type LiveTransfer = {
  transfer_id: string;
  unit_id: string;
  investor_email?: string | null;
  investor_name?: string | null;
  transfer_date: string;
  transfer_status: string;
  notes?: string | null;
};

export type LiveTransfersPayload = {
  owned_units: LiveOwnedUnit[];
  transfers: LiveTransfer[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchWarehouseStock(): Promise<LiveWarehouseStock[]> {
  const data = await apiRequest<{
    success: boolean;
    count: number;
    items: Array<{
      id: number;
      name: string;
      sku: string;
      price: number;
      stock_available: number;
      warehouse: string;
      warehouse_id: number;
    }>;
  }>('/api/products');

  return data.items.map((row) => ({
    warehouse_id: row.warehouse_id,
    warehouse_name: row.warehouse,
    product_id: row.id,
    product_name: row.name,
    sku: row.sku,
    unit_price: row.price,
    qty_available: row.stock_available,
  }));
}

export async function registerUser(payload: AuthPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginUser(email: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function submitCheckout(payload: {
  customer_id: number;
  payment_method: string;
  lines: CheckoutLine[];
}): Promise<CheckoutResponse> {
  if (!payload.lines.length) {
    throw new Error('Cart is empty.');
  }

  const warehouseId = payload.lines[0].warehouse_id;
  const hasMixedWarehouses = payload.lines.some((line) => line.warehouse_id !== warehouseId);
  if (hasMixedWarehouses) {
    throw new Error('All cart items must be from the same warehouse for checkout.');
  }

  return apiRequest<CheckoutResponse>('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      customer_id: payload.customer_id,
      warehouse_id: warehouseId,
      items: payload.lines.map((line) => {
        if (!line.product_id) {
          throw new Error('Missing product id in cart line.');
        }
        return {
          product_id: line.product_id,
          quantity: line.quantity,
        };
      }),
      payment_method: payload.payment_method,
    }),
  });
}

export async function fetchOrders(customerId: number): Promise<LiveOrder[]> {
  const data = await apiRequest<{
    success: boolean;
    count: number;
    items: Array<{
      order_id: number;
      order_number: string;
      total_amount: number;
      status: string;
    }>;
  }>(
    `/api/orders?customer_id=${encodeURIComponent(String(customerId))}`
  );
  return data.items.map((row) => ({
    order_id: row.order_id,
    order_reference: row.order_number,
    total_amount: row.total_amount,
    payment_method: 'unknown',
    status: row.status,
    warehouse_id: null,
    warehouse_name: null,
    created_at: '',
  }));
}

export async function fetchInvoices(params: { customerId?: number; email?: string }): Promise<LiveInvoice[]> {
  const queryParams = new URLSearchParams();
  if (params.customerId) {
    queryParams.set('customer_id', String(params.customerId));
  }
  if (params.email) {
    queryParams.set('email', params.email);
  }
  const query = queryParams.toString() ? `/api/invoices?${queryParams.toString()}` : null;

  if (!query) {
    throw new Error('Missing customer id or email for invoice lookup.');
  }

  const data = await apiRequest<{ success: boolean; count: number; items: LiveInvoice[] }>(
    query
  );
  return data.items;
}

export async function fetchWallet(email: string): Promise<LiveWallet> {
  const data = await apiRequest<{ success: boolean } & LiveWallet>(`/api/wallet?email=${encodeURIComponent(email)}`);
  return {
    balance: data.balance,
    total_earned: data.total_earned,
    total_spent: data.total_spent,
    transactions: data.transactions,
  };
}

export async function fetchReferrals(email: string): Promise<LiveReferralsData> {
  const data = await apiRequest<{ success: boolean } & LiveReferralsData>(`/api/referrals?email=${encodeURIComponent(email)}`);
  return {
    referral_code: data.referral_code,
    total_referrals: data.total_referrals,
    direct_referrals: data.direct_referrals,
    indirect_referrals: data.indirect_referrals,
    items: data.items,
  };
}

export async function fetchRewards(email: string): Promise<LiveRewards> {
  const data = await apiRequest<{ success: boolean } & LiveRewards>(`/api/rewards?email=${encodeURIComponent(email)}`);
  return {
    total_units: data.total_units,
    purchase_rewards: data.purchase_rewards,
    referral_rewards: data.referral_rewards,
  };
}

export async function fetchTransfers(email: string): Promise<LiveTransfersPayload> {
  const data = await apiRequest<{ success: boolean } & LiveTransfersPayload>(`/api/transfers?email=${encodeURIComponent(email)}`);
  return {
    owned_units: data.owned_units,
    transfers: data.transfers,
  };
}

export async function createTransferRequest(payload: {
  agent_email: string;
  investor_email: string;
  unit_id: string;
  notes?: string;
}): Promise<LiveTransfer> {
  const data = await apiRequest<{ success: boolean; item: LiveTransfer }>('/api/transfers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.item;
}
