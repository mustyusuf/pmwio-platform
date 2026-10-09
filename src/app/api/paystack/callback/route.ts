import { NextRequest, NextResponse } from "next/server";
import { appUrl, settleTransaction } from "@/lib/paystack";

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  if (!reference) {
    return NextResponse.redirect(`${appUrl()}/donate?payment=invalid`);
  }

  const destination = reference.startsWith("MEM-") ? "/dashboard/contributions" : "/donate";
  try {
    // Verifies with Paystack and records the outcome: a real payment is saved
    // as SUCCESS, a declined/cancelled one is marked FAILED (and the donor is
    // told), and anything still in flight stays PENDING.
    const outcome = await settleTransaction(reference);
    return NextResponse.redirect(`${appUrl()}${destination}?payment=${outcome === "success" ? "success" : outcome}`);
  } catch {
    return NextResponse.redirect(`${appUrl()}${destination}?payment=failed`);
  }
}
