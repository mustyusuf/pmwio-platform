import { Calendar } from "lucide-react";

/**
 * A date input with an always-visible calendar icon. iOS Safari renders
 * native <input type="date"> fields with no icon at all (unlike Chrome),
 * so the field looks like it isn't tappable. The native Chromium icon is
 * hidden (but kept as the clickable hit target — see globals.css) and
 * this icon is drawn in its place, so both browsers show one consistent,
 * visible icon.
 */
export function DateInput({
  className,
  type = "date",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { type?: "date" | "month" }) {
  return (
    <div className="relative">
      <input type={type} {...props} className={`${className ?? ""} pr-9`} />
      <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700/60" aria-hidden />
    </div>
  );
}
