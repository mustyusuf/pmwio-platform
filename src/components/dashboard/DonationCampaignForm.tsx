import { createDonationCampaign } from "@/app/actions/donations";

const label = "block text-sm font-medium text-brand-900";
const input = "mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export function DonationCampaignForm() {
  return (
    <form action={createDonationCampaign} className="space-y-4">
      <div>
        <label htmlFor="campaign-title" className={label}>Campaign or event title</label>
        <input id="campaign-title" name="title" required className={input} placeholder="e.g. Ramadan Food Drive 2026" />
      </div>
      <div>
        <label htmlFor="campaign-description" className={label}>Description</label>
        <textarea id="campaign-description" name="description" required rows={4} className={input} placeholder="Explain the purpose of this appeal and how donations will be used." />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="goalAmount" className={label}>Fundraising goal (₦)</label>
          <input id="goalAmount" name="goalAmount" type="number" min="1" step="100" className={input} />
        </div>
        <div>
          <label htmlFor="suggestedAmount" className={label}>Suggested donation (₦)</label>
          <input id="suggestedAmount" name="suggestedAmount" type="number" min="100" step="100" className={input} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startsAt" className={label}>Starts <span className="text-brand-900/40">(optional)</span></label>
          <input id="startsAt" name="startsAt" type="datetime-local" className={input} />
        </div>
        <div>
          <label htmlFor="endsAt" className={label}>Ends <span className="text-brand-900/40">(optional)</span></label>
          <input id="endsAt" name="endsAt" type="datetime-local" className={input} />
        </div>
      </div>
      <button className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">Create donation campaign</button>
    </form>
  );
}
