"use client";

import { useActionState } from "react";
import { Save, Upload, Trash2 } from "lucide-react";
import { saveSiteContent, uploadContentImage, removeContentImage, type ContentState } from "@/app/actions/siteContent";
import { Panel } from "@/components/dashboard/ui";

const label = "block text-sm font-medium text-brand-900";
const input = "mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export type ContentFieldView = {
  key: string;
  label: string;
  type: "text" | "textarea" | "image";
  section: string;
  help?: string;
  value: string;
  imageUrl: string | null;
};

function ImageField({ field }: { field: ContentFieldView }) {
  const [state, action, pending] = useActionState<ContentState, FormData>(uploadContentImage, null);
  return (
    <div className="rounded-xl border border-brand-100 p-4">
      <p className="text-sm font-medium text-brand-900">{field.label}</p>
      {field.help && <p className="mt-0.5 text-xs text-brand-900/50">{field.help}</p>}
      {state?.error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{state.error}</p>}
      {state?.ok && <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">Image updated.</p>}

      {field.imageUrl && (
        <div className="mt-3 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={field.imageUrl} alt="" className="h-16 w-28 rounded-lg border border-brand-100 object-cover" />
          <form action={removeContentImage}>
            <input type="hidden" name="key" value={field.key} />
            <button className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800"><Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove</button>
          </form>
        </div>
      )}

      <form action={action} className="mt-3 flex flex-wrap items-center gap-3">
        <input type="hidden" name="key" value={field.key} />
        <input name="image" type="file" accept="image/*" required className="block text-sm text-brand-900/70 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-700" />
        <button disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
          <Upload className="h-4 w-4" aria-hidden /> {pending ? "Uploading…" : field.imageUrl ? "Replace" : "Upload"}
        </button>
      </form>
    </div>
  );
}

export function SiteContentForm({ fields }: { fields: ContentFieldView[] }) {
  const [state, action, pending] = useActionState<ContentState, FormData>(saveSiteContent, null);

  const textFields = fields.filter((f) => f.type !== "image");
  const imageFields = fields.filter((f) => f.type === "image");
  const sections = [...new Set(textFields.map((f) => f.section))];

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-6">
        {state?.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{state.error}</p>}
        {state?.ok && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">Content saved. Your changes are now live on the website.</p>}

        {sections.map((section) => (
          <Panel key={section} title={section}>
            <div className="grid gap-4 sm:grid-cols-2">
              {textFields.filter((f) => f.section === section).map((f) => (
                <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                  <label htmlFor={`c-${f.key}`} className={label}>{f.label}</label>
                  {f.type === "textarea" ? (
                    <textarea id={`c-${f.key}`} name={f.key} rows={3} defaultValue={f.value} className={input} />
                  ) : (
                    <input id={`c-${f.key}`} name={f.key} defaultValue={f.value} className={input} />
                  )}
                  {f.help && <p className="mt-1 text-xs text-brand-900/50">{f.help}</p>}
                </div>
              ))}
            </div>
          </Panel>
        ))}

        <div className="sticky bottom-4 flex justify-end">
          <button disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-brand-800 disabled:opacity-50">
            <Save className="h-4 w-4" aria-hidden /> {pending ? "Saving…" : "Save all changes"}
          </button>
        </div>
      </form>

      {imageFields.length > 0 && (
        <Panel title="Images">
          <p className="-mt-2 mb-4 text-sm text-brand-900/60">Upload images used on the public site. Leave empty to use the default styling.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {imageFields.map((f) => <ImageField key={f.key} field={f} />)}
          </div>
        </Panel>
      )}
    </div>
  );
}
