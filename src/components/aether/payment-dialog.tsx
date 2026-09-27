import { CreditCard, Landmark, ShieldCheck, Wallet, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./primitives";
import { formatPrice, type EventItem } from "@/lib/mock-data";

const methods = [
  { id: "qris", label: "QRIS", hint: "Semua e-wallet", icon: Wallet },
  { id: "va", label: "Virtual Account", hint: "BCA · Mandiri · BNI", icon: Landmark },
  { id: "card", label: "Kartu Kredit/Debit", hint: "Visa · Mastercard", icon: CreditCard },
];

export function PaymentDialog({
  event,
  open,
  onClose,
  onPaid,
}: {
  event: EventItem;
  open: boolean;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [method, setMethod] = useState("qris");
  const [processing, setProcessing] = useState(false);

  if (!open) return null;

  const fee = 2500;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(15,23,42,0.28)] p-4 backdrop-blur-sm sm:items-center">
      <div
        className="glass w-full max-w-md rounded-xl p-6"
        style={{ animation: "aether-pop 220ms var(--ease-spring)" }}
        role="dialog"
        aria-modal="true"
        aria-label="Pembayaran event"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="aether-meta text-accent">Selesaikan pembayaran</p>
            <h2 className="mt-2 text-[17px] font-semibold text-ink">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-pill p-2 text-ink-tertiary hover:bg-white/70 hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors ${
                method === m.id
                  ? "border-accent bg-accent-tint"
                  : "border-hairline bg-white/70 hover:border-accent-soft"
              }`}
            >
              <m.icon
                className={`size-5 ${method === m.id ? "text-accent" : "text-ink-secondary"}`}
                strokeWidth={1.9}
              />
              <span className="flex-1">
                <span className="block text-[15px] font-medium text-ink">{m.label}</span>
                <span className="block text-[13px] text-ink-tertiary">{m.hint}</span>
              </span>
              <span
                className={`size-4 rounded-pill border-2 ${
                  method === m.id ? "border-accent bg-accent" : "border-hairline"
                }`}
              />
            </button>
          ))}
        </div>

        <dl className="mt-5 space-y-2 rounded-md bg-white/70 p-4 text-[13px]">
          <div className="flex justify-between">
            <dt className="text-ink-secondary">Tiket event</dt>
            <dd className="font-medium text-ink">{formatPrice(event.price)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-secondary">Biaya layanan</dt>
            <dd className="font-medium text-ink">{formatPrice(fee)}</dd>
          </div>
          <div className="flex justify-between border-t border-hairline pt-2 text-[15px]">
            <dt className="font-semibold text-ink">Total</dt>
            <dd className="font-semibold text-accent-strong">{formatPrice(event.price + fee)}</dd>
          </div>
        </dl>

        <Button
          className="mt-5 w-full"
          disabled={processing}
          onClick={() => {
            setProcessing(true);
            setTimeout(() => {
              setProcessing(false);
              onPaid();
            }, 900);
          }}
        >
          {processing ? "Memproses..." : `Bayar ${formatPrice(event.price + fee)}`}
        </Button>

        <p className="mt-3 flex items-center justify-center gap-2 text-[11px] text-ink-tertiary">
          <ShieldCheck className="size-3.5" strokeWidth={1.9} />
          Simulasi pembayaran — siap disambungkan ke payment gateway.
        </p>
      </div>
    </div>
  );
}
