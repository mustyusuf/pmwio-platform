// ---------------------------------------------------------------------------
// Prepared transactional email templates for PMWIO.
//
// Each function returns a ready-to-send { subject, html, text } Mail built on
// the branded layout() helper. Actions/webhooks call these and pass the result
// to send()/sendEmail(). Keeping them here keeps email.ts a pure transport.
//
// Row numbers refer to docs/PMWIO email notification spec.
// ---------------------------------------------------------------------------

import { layout, link, type Mail } from "@/lib/email";
import { ROLE_LABEL } from "@/lib/roles";

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

const CATEGORY_LABEL: Record<string, string> = {
  ORPHANAGE: "Orphanage support",
  SCHOLARSHIP: "Scholarship",
  EMPOWERMENT: "Empowerment",
};
const categoryLabel = (c: string) => CATEGORY_LABEL[c] ?? c;

const roleLabel = (r: string) => ROLE_LABEL[r] ?? r;

/** First name for a friendly greeting; falls back to "there". */
const firstName = (name?: string | null) => name?.trim().split(/\s+/)[0] || "there";

const DASHBOARD = () => link("/dashboard");

// ===========================================================================
// 1. Account lifecycle
// ===========================================================================

// #1 — new member, once their email address is confirmed (access is immediate)
export function memberRegistrationPending(name: string): Mail {
  return layout({
    subject: "Your membership is active",
    heading: "Welcome to PMWIO",
    intro: `Hi ${firstName(name)},`,
    body: [
      "Thank you for registering with the Pious Muslim Women International Organization.",
      "Your email address is confirmed and your account is ready — you can log in to your dashboard now.",
    ],
    cta: { label: "Go to your dashboard", url: DASHBOARD() },
  });
}

// #2 — admins & executives, prompt to validate a newly confirmed member
export function memberRegistrationAlert(name: string, email: string): Mail {
  return layout({
    subject: `New member to validate — ${name}`,
    heading: "New member registration",
    body: [`${escapeText(name)} has registered and confirmed their email address.`],
    facts: [
      { label: "Name", value: name },
      { label: "Email", value: email },
    ],
    cta: { label: "Review members", url: link("/dashboard/users") },
  });
}

// #3 — new member, confirm email ownership before an admin reviews
export function verifyEmail(name: string, verifyUrl: string): Mail {
  return layout({
    subject: "Confirm your email — PMWIO",
    heading: "Confirm your email address",
    intro: `Hi ${firstName(name)},`,
    body: [
      "Thanks for registering with the Pious Muslim Women International Organization. Please confirm your email address by clicking the button below.",
      "Once confirmed, an administrator will review your membership and you'll be notified when your account is approved.",
      "This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.",
    ],
    cta: { label: "Confirm email", url: verifyUrl },
    footnote: "For your security, never share this link with anyone.",
  });
}

// #4 — member, account activated by an admin
export function memberApproved(name: string, userId: string): Mail {
  return layout({
    subject: "Your account is activated 🎉",
    heading: "Your account is activated",
    intro: `Hi ${firstName(name)},`,
    body: ["Good news — your membership has been approved. You can now log in using the User ID below or your email address."],
    facts: [{ label: "Your User ID", value: userId }],
    cta: { label: "Log in", url: link("/login") },
  });
}

// #5 — applicant, registration declined
export function memberDeclined(name: string): Mail {
  return layout({
    subject: "Update on your registration",
    heading: "Registration not approved",
    intro: `Hi ${firstName(name)},`,
    body: [
      "Thank you for your interest in the Pious Muslim Women International Organization. Unfortunately we were unable to approve your registration at this time.",
      "If you believe this is a mistake, please contact us and we'll be glad to help.",
    ],
  });
}

// #6 — new staff user created by an admin
export function staffAccountCreated(name: string, userId: string, role: string, tempPassword: string): Mail {
  return layout({
    subject: "Your PMWIO account has been created",
    heading: "An account has been created for you",
    intro: `Hi ${firstName(name)},`,
    body: [
      `An administrator has created a ${roleLabel(role)} account for you at the Pious Muslim Women International Organization.`,
      "Log in with the details below, then change your password from your profile as soon as you're in.",
    ],
    facts: [
      { label: "Your User ID", value: userId },
      { label: "Role", value: roleLabel(role) },
      { label: "Temporary password", value: tempPassword },
    ],
    cta: { label: "Log in", url: link("/login") },
    footnote: "For your security, please change this password immediately after logging in. If you weren't expecting this, contact the organization.",
  });
}

// #7 — password reset link
export function passwordReset(name: string | null | undefined, resetUrl: string): Mail {
  return layout({
    subject: "Reset your PMWIO password",
    heading: "Reset your password",
    intro: `Hi ${firstName(name)},`,
    body: [
      "We received a request to reset the password for your account. Click the button below to choose a new one.",
      "This link expires in 30 minutes and can be used once. If you didn't request this, you can safely ignore this email — your password will not change.",
    ],
    cta: { label: "Reset password", url: resetUrl },
    footnote: "For your security, never share this link with anyone.",
  });
}

// #8 — password changed / reset confirmation
export function passwordChanged(name: string | null | undefined): Mail {
  return layout({
    subject: "Your password was changed",
    heading: "Your password was changed",
    intro: `Hi ${firstName(name)},`,
    body: [
      "This is a confirmation that the password for your PMWIO account was just changed.",
      "If this was you, no action is needed. If you did not make this change, please reset your password immediately and contact us.",
    ],
    cta: { label: "Reset password", url: link("/forgot-password") },
  });
}

// ===========================================================================
// 2. Application workflow
// ===========================================================================

// #9 — applicant, application submitted
export function applicationSubmitted(name: string, category: string, reference: string): Mail {
  return layout({
    subject: "Your application has been submitted",
    heading: "Application received",
    intro: `Hi ${firstName(name)},`,
    body: [
      `We've received your ${categoryLabel(category)} application. It is now awaiting confirmation from the referee you named.`,
      "You can track its progress from your dashboard, and we'll email you as it moves through each review stage.",
    ],
    facts: [
      { label: "Program", value: categoryLabel(category) },
      { label: "Reference", value: reference },
    ],
    cta: { label: "Track application", url: DASHBOARD() },
  });
}

// #10 — referee / coordinator named on an application
export function refereeReferral(refereeName: string, applicantName: string, category: string): Mail {
  return layout({
    subject: "A new referral needs your confirmation",
    heading: "You've been named as a referee",
    intro: `Hi ${firstName(refereeName)},`,
    body: [
      `${escapeText(applicantName)} has submitted a ${categoryLabel(category)} application and named you as their referee.`,
      "Please log in to confirm whether you know this applicant so their application can proceed to review.",
    ],
    cta: { label: "Review referral", url: DASHBOARD() },
  });
}

// #11 — member, empowerment application submitted (skips referee gate)
export function empowermentSubmitted(name: string, reference: string): Mail {
  return layout({
    subject: "Your empowerment application has been submitted",
    heading: "Empowerment application received",
    intro: `Hi ${firstName(name)},`,
    body: ["We've received your empowerment application. It is now with the Board for review, and we'll keep you updated at each stage."],
    facts: [{ label: "Reference", value: reference }],
    cta: { label: "Track application", url: DASHBOARD() },
  });
}

// #12 — beneficiary, referral confirmed
export function referralConfirmed(name: string, reference: string): Mail {
  return layout({
    subject: "Your referral has been confirmed",
    heading: "Referral confirmed",
    intro: `Hi ${firstName(name)},`,
    body: ["Your referee has confirmed your application. It has now moved to the Board for review."],
    facts: [{ label: "Reference", value: reference }],
    cta: { label: "Track application", url: DASHBOARD() },
  });
}

// #13 — board members, a new application is ready to review
export function boardNewApplication(applicantName: string, category: string, reference: string): Mail {
  return layout({
    subject: "New application awaiting board review",
    heading: "New application to review",
    body: [`A ${categoryLabel(category)} application from ${escapeText(applicantName)} has been confirmed and is awaiting board review.`],
    facts: [
      { label: "Applicant", value: applicantName },
      { label: "Reference", value: reference },
    ],
    cta: { label: "Review now", url: DASHBOARD() },
  });
}

// #14 — beneficiary, referral not confirmed
export function referralRejected(name: string, reference: string): Mail {
  return layout({
    subject: "Update on your application",
    heading: "Referral not confirmed",
    intro: `Hi ${firstName(name)},`,
    body: [
      "Unfortunately, the referee you named was not able to confirm your application, so it cannot proceed at this time.",
      "If you believe this is a mistake, please contact us or submit a new application with a valid referee.",
    ],
    facts: [{ label: "Reference", value: reference }],
  });
}

// #15a — beneficiary, passed board review
export function applicationPassedBoard(name: string, reference: string): Mail {
  return layout({
    subject: "Your application passed board review",
    heading: "Recommended by the Board",
    intro: `Hi ${firstName(name)},`,
    body: ["Your application has been recommended by the Board and is now with the Executive for a final decision."],
    facts: [{ label: "Reference", value: reference }],
    cta: { label: "Track application", url: DASHBOARD() },
  });
}

// #15b — executives, an application is ready for their decision
export function executiveDecisionReady(applicantName: string, reference: string): Mail {
  return layout({
    subject: "Application ready for executive decision",
    heading: "Ready for executive decision",
    body: [`An application from ${escapeText(applicantName)} has passed board review and is awaiting the Executive's decision.`],
    facts: [
      { label: "Applicant", value: applicantName },
      { label: "Reference", value: reference },
    ],
    cta: { label: "Review now", url: DASHBOARD() },
  });
}

// #16 & #18 — beneficiary, application not approved
export function applicationRejected(name: string, reference: string, stage: "board review" | "final review" = "final review"): Mail {
  return layout({
    subject: "Update on your application",
    heading: "Application decision",
    intro: `Hi ${firstName(name)},`,
    body: [
      `After careful ${stage}, we're sorry to let you know that your application was not approved on this occasion.`,
      "We appreciate the time you took to apply and encourage you to reach out if you have any questions.",
    ],
    facts: [{ label: "Reference", value: reference }],
  });
}

// #17a — beneficiary, application approved
export function applicationApproved(name: string, reference: string): Mail {
  return layout({
    subject: "Your application has been approved 🎉",
    heading: "Application approved",
    intro: `Hi ${firstName(name)},`,
    body: ["Congratulations — your application has been approved! Our finance team will arrange a disbursement, and you'll receive a further email once it's on its way."],
    facts: [{ label: "Reference", value: reference }],
    cta: { label: "View details", url: DASHBOARD() },
  });
}

// #17b — finance, an approved application is ready for payment entry
export function financePaymentEntryReady(applicantName: string, reference: string): Mail {
  return layout({
    subject: "Approved application ready for payment",
    heading: "Ready for payment entry",
    body: [`An application from ${escapeText(applicantName)} has been approved by the Executive and is ready for you to enter a payment.`],
    facts: [
      { label: "Applicant", value: applicantName },
      { label: "Reference", value: reference },
    ],
    cta: { label: "Enter payment", url: DASHBOARD() },
  });
}

// ===========================================================================
// 3. Payments / finance chain
// ===========================================================================

// #19 — board, a payment awaits their approval
export function paymentAwaitingBoard(reference: string, amount: number): Mail {
  return layout({
    subject: "Payment awaiting board approval",
    heading: "Payment awaiting board approval",
    body: [`A payment of ${naira(amount)} has been entered and is awaiting board approval.`],
    facts: [
      { label: "Amount", value: naira(amount) },
      { label: "Reference", value: reference },
    ],
    cta: { label: "Review payment", url: DASHBOARD() },
  });
}

// #20 — executives, a payment awaits final approval
export function paymentAwaitingExecutive(reference: string, amount: number): Mail {
  return layout({
    subject: "Payment awaiting final executive approval",
    heading: "Payment awaiting final approval",
    body: [`A payment of ${naira(amount)} has passed board approval and awaits final executive approval.`],
    facts: [
      { label: "Amount", value: naira(amount) },
      { label: "Reference", value: reference },
    ],
    cta: { label: "Review payment", url: DASHBOARD() },
  });
}

// #21 — finance, a payment is cleared for disbursement
export function paymentClearedForFinance(reference: string, amount: number): Mail {
  return layout({
    subject: "Payment cleared for disbursement",
    heading: "Payment cleared for disbursement",
    body: [`A payment of ${naira(amount)} has received final executive approval and is cleared for disbursement.`],
    facts: [
      { label: "Amount", value: naira(amount) },
      { label: "Reference", value: reference },
    ],
    cta: { label: "View payment", url: DASHBOARD() },
  });
}

// #22 — beneficiary, payment disbursed
export function paymentDisbursed(name: string, amount: number, reference: string): Mail {
  return layout({
    subject: "A payment has been disbursed to you 🎉",
    heading: "Payment disbursed",
    intro: `Hi ${firstName(name)},`,
    body: [`A payment of ${naira(amount)} has been disbursed for your approved application.`],
    facts: [
      { label: "Amount", value: naira(amount) },
      { label: "Reference", value: reference },
    ],
    cta: { label: "View details", url: DASHBOARD() },
  });
}

// #23 — finance, a payment was rejected at some level
export function paymentRejected(reference: string, amount: number, level: string): Mail {
  return layout({
    subject: "A payment was rejected",
    heading: "Payment rejected",
    body: [`A payment of ${naira(amount)} was rejected at ${level.toLowerCase()} level.`],
    facts: [
      { label: "Amount", value: naira(amount) },
      { label: "Reference", value: reference },
      { label: "Rejected at", value: roleLabel(level) },
    ],
    cta: { label: "View payment", url: DASHBOARD() },
  });
}

// ===========================================================================
// 4. Scholarship / State Coordinator
// ===========================================================================

// #24a — beneficiary, scholarship renewal submitted
export function scholarshipRenewalSubmitted(name: string, reference: string): Mail {
  return layout({
    subject: "Your scholarship renewal has been submitted",
    heading: "Renewal submitted",
    intro: `Hi ${firstName(name)},`,
    body: ["We've received your scholarship renewal. It is now awaiting confirmation from your nominating coordinator."],
    facts: [{ label: "Reference", value: reference }],
    cta: { label: "Track renewal", url: DASHBOARD() },
  });
}

// #24b — coordinator, a renewal needs their confirmation
export function scholarshipRenewalToConfirm(coordinatorName: string, studentName: string, reference: string): Mail {
  return layout({
    subject: "A scholarship renewal needs your confirmation",
    heading: "Renewal to confirm",
    intro: `Hi ${firstName(coordinatorName)},`,
    body: [`${escapeText(studentName)} is renewing their scholarship and named you as their coordinator. Please log in to confirm the renewal.`],
    facts: [{ label: "Reference", value: reference }],
    cta: { label: "Review renewal", url: DASHBOARD() },
  });
}

// #25 — board & executives, a new term report was filed
export function termReportAlert(coordinatorName: string, studentName: string, term: string, session: string): Mail {
  return layout({
    subject: `New term report — ${studentName}`,
    heading: "New term report",
    body: [`${escapeText(coordinatorName)} filed a term report for ${escapeText(studentName)}.`],
    facts: [
      { label: "Student", value: studentName },
      { label: "Term", value: `${term} ${session}` },
    ],
    cta: { label: "View report", url: link("/dashboard/scholarships") },
  });
}

// ===========================================================================
// 5. Donations & contact
// ===========================================================================

// #28 & #30 — donor / contributing member, receipt
export function donationReceipt(d: { name: string; amount: number; reference: string; recurring?: boolean }): Mail {
  return layout({
    subject: d.recurring ? "Your monthly contribution — receipt" : "Thank you for your donation",
    heading: d.recurring ? "Contribution received" : "Your donation was received",
    intro: `Dear ${firstName(d.name)},`,
    body: [
      d.recurring
        ? `Thank you for your monthly contribution to the Pious Muslim Women International Organization. Your support of ${naira(d.amount)} has been received.`
        : `Thank you for your generous donation to the Pious Muslim Women International Organization. Your gift of ${naira(d.amount)} has been received.`,
      "May Allah reward your generosity. This email serves as your receipt.",
    ],
    facts: [
      { label: "Amount", value: naira(d.amount) },
      { label: "Reference", value: d.reference },
    ],
  });
}

// #29 — admins & executives, a donation was received
export function donationAlert(donorName: string, amount: number, reference: string): Mail {
  return layout({
    subject: `New donation received — ${naira(amount)}`,
    heading: "New donation received",
    body: [`A donation of ${naira(amount)} was received from ${escapeText(donorName)}.`],
    facts: [
      { label: "Amount", value: naira(amount) },
      { label: "Donor", value: donorName },
      { label: "Reference", value: reference },
    ],
    cta: { label: "View donations", url: link("/dashboard/donations") },
  });
}

// #31 — admins & executives, a contact message arrived
export function contactAlert(d: { name: string; email: string; subject?: string; message: string }): Mail {
  return layout({
    subject: `New contact message${d.subject ? `: ${d.subject}` : ""}`,
    heading: "New contact message",
    body: [escapeText(d.message).replace(/\n/g, "<br/>")],
    facts: [
      { label: "From", value: d.name },
      { label: "Email", value: d.email },
      ...(d.subject ? [{ label: "Subject", value: d.subject }] : []),
    ],
    cta: { label: "Open dashboard", url: DASHBOARD() },
    footnote: `Reply directly to ${escapeText(d.email)} to respond.`,
  });
}

// #32 — sender, contact acknowledgement
export function contactReceived(name: string): Mail {
  return layout({
    subject: "We've received your message",
    heading: "Thanks for reaching out",
    intro: `Hi ${firstName(name)},`,
    body: ["Thank you for contacting the Pious Muslim Women International Organization. We've received your message and a member of our team will get back to you as soon as possible."],
  });
}

// ---------------------------------------------------------------------------
// Escape user-provided text before it lands in a `body` paragraph (which is
// rendered as raw HTML by layout()). Facts are escaped by layout itself.
// ---------------------------------------------------------------------------
function escapeText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
