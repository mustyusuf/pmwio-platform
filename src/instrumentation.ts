// The Node.js-only scheduler is loaded behind this runtime check and a
// dynamic import so Next.js doesn't try to bundle Prisma/node builtins into
// the Edge Instrumentation build (which would fail — see
// https://nextjs.org/docs/app/guides/instrumentation#importing-runtime-specific-code).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startQuranDailyJobs } = await import("@/lib/quran-scheduler");
    startQuranDailyJobs();
  }
}
