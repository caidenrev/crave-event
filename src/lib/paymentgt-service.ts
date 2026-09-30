/**
 * ============================================================================
 * PAYMENTGT CLIENT SERVICE ADAPTER
 * ============================================================================
 * Menghubungkan Crave Event dengan gateway QRIS dinamis & settlement daemon
 * PaymentGT (ShopeePay Partner / Go).
 *
 * Default endpoint daemon: http://localhost:8085 (dapat diatur lewat VITE_PAYMENTGT_URL)
 */

export const PAYMENTGT_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.["VITE_PAYMENTGT_URL"]) ||
  "http://localhost:8085";

export type PaymentGTHalthResponse = {
  status: string;
  merchant?: string;
  store_id?: string;
  timestamp?: number;
};

export type PaymentGTCreateResponse = {
  success: boolean;
  payment_id: string;
  order_id: string;
  amount: number;
  unique_amount: number;
  unique_offset: number;
  status: "PENDING" | "PAID" | "EXPIRED" | "pending" | "paid" | "expired" | string;
  qris_string: string;
  qris_image_base64: string;
  expires_at: string;
  created_at: string;
};

export type PaymentGTStatusResponse = {
  success: boolean;
  payment_id: string;
  order_id: string;
  unique_amount: number;
  status: "PENDING" | "PAID" | "EXPIRED" | "pending" | "paid" | "expired" | string;
  expires_at: string;
  paid_at?: string;
  transaction_id?: string;
  payment_type?: string;
};

/**
 * Memeriksa apakah daemon server PaymentGT aktif dan terhubung dengan merchant
 */
export async function checkPaymentGTHealth(): Promise<{
  active: boolean;
  merchant?: string;
  storeId?: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
    const res = await fetch(`${PAYMENTGT_BASE_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data: PaymentGTHalthResponse = await res.json();
      return {
        active: true,
        ...(data.merchant !== undefined && { merchant: data.merchant }),
        ...(data.store_id !== undefined && { storeId: data.store_id }),
      };
    }
  } catch {
    // Daemon offline atau belum dijalankan
  }
  return { active: false };
}

/**
 * Membuat invoice tagihan QRIS dinamis dengan nominal pas
 */
export async function createPaymentGTInvoice(params: {
  orderId: string;
  amount: number;
  expiresInMinutes?: number;
  callbackUrl?: string;
}): Promise<PaymentGTCreateResponse> {
  const res = await fetch(`${PAYMENTGT_BASE_URL}/api/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      order_id: params.orderId,
      amount: params.amount,
      expires_in_minutes: params.expiresInMinutes || 10,
      callback_url: params.callbackUrl || "",
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal membuat QRIS PaymentGT: ${errorText}`);
  }

  const data: PaymentGTCreateResponse = await res.json();
  return data;
}

/**
 * Mengecek status pembayaran terkini berdasarkan payment_id
 */
export async function getPaymentGTStatus(
  paymentId: string,
): Promise<PaymentGTStatusResponse> {
  const res = await fetch(`${PAYMENTGT_BASE_URL}/api/payments/${paymentId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Gagal mengecek status pembayaran ${paymentId}`);
  }

  const data: PaymentGTStatusResponse = await res.json();
  return data;
}
