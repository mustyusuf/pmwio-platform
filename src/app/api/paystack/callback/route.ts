import { NextRequest, NextResponse } from "next/server";
import { appUrl, recordSuccessfulCharge, verifyPaystackTransaction } from "@/lib/paystack";

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  if (!reference) {
    return NextResponse.redirect(`${appUrl()}/donate?payment=invalid`);
  }

  try {
    const transaction = await verifyPaystackTransaction(reference);
    const recorded = await recordSuccessfulCharge(transaction);
    const destination = reference.startsWith("MEM-") ? "/dashboard/contributions" : "/donate";
    return NextResponse.redirect(`${appUrl()}${destination}?payment=${recorded ? "success" : "pending"}`);
  } catch {
    return NextResponse.redirect(`${appUrl()}/donate?payment=failed`);
  }
}
