import { startPublicDonation } from "@/app/actions/donations";
import { SubmitButton } from "@/components/forms/SubmitButton";

const label = "block text-sm font-medium text-brand-900";
const input =
  "mt-1.5 w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-brand-950 outline-none transition placeholder:text-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export function DonationForm({
  campaign,
  returnPath,
  error,
}: {
  campaign?: { id: string; title: string; suggestedAmount: number | null };
  returnPath: string;
  error?: string;
}) {
  return (
    <form action={startPublicDonation} className="space-y-4">
      {campaign && <input type="hidden" name="campaignId" value={campaign.id} />}
      <input type="hidden" name="returnPath" value={returnPath} />
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`name-${campaign?.id ?? "general"}`} className={label}>Full name</label>
          <input id={`name-${campaign?.id ?? "general"}`} name="name" required className={input} autoComplete="name" />
        </div>
        <div>
          <label htmlFor={`email-${campaign?.id ?? "general"}`} className={label}>Email address</label>
          <input id={`email-${campaign?.id ?? "general"}`} name="email" type="email" required className={input} autoComplete="email" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`phone-${campaign?.id ?? "general"}`} className={label}>Phone <span className="text-brand-900/40">(optional)</span></label>
          <input id={`phone-${campaign?.id ?? "general"}`} name="phone" className={input} autoComplete="tel" />
        </div>
        <div>
          <label htmlFor={`amount-${campaign?.id ?? "general"}`} className={label}>Amount (₦)</label>
          <input
            id={`amount-${campaign?.id ?? "general"}`}
            name="amount"
            type="number"
            min="100"
            step="100"
            required
            defaultValue={campaign?.suggestedAmount ?? 5000}
            className={input}
          />
        </div>
      </div>
      <div>
        <label htmlFor={`message-${campaign?.id ?? "general"}`} className={label}>Message <span className="text-brand-900/40">(optional)</span></label>
        <textarea id={`message-${campaign?.id ?? "general"}`} name="message" rows={3} maxLength={500} className={input} />
      </div>
      <label className="flex items-center gap-2 text-sm text-brand-900/70">
        <input name="anonymous" type="checkbox" className="h-4 w-4 rounded border-brand-300 text-brand-700" />
        Show this donation as anonymous publicly
      </label>
      <SubmitButton pendingText="Opening secure payment…">
        Donate securely with Paystack
      </SubmitButton>
      <p className="text-center text-xs text-brand-900/50">
        You will be redirected to Paystack to complete your payment.
      </p>
    </form>
  );
}
