// Tiny per-key async mutex. The app is a single Node process, so serialising by
// key in memory is enough to stop two simultaneous requests from both passing a
// "has this already happened?" check before either one has recorded itself
// (e.g. one reviewer casting several votes in parallel to reach quorum alone).

const tails = new Map<string, Promise<unknown>>();

export async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = tails.get(key) ?? Promise.resolve();
  const run = previous.catch(() => undefined).then(fn);
  const tail = run.catch(() => undefined);
  tails.set(key, tail);
  try {
    return await run;
  } finally {
    if (tails.get(key) === tail) tails.delete(key);
  }
}
