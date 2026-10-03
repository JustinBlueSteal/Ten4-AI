/**
 * Runs jobs one at a time and spaces LLM-bound work out so the free-tier rate limit isn't blown.
 * A job that waits longer than maxQueue positions is rejected instead of piling up forever.
 */
export class SerialQueue {
  private tail: Promise<unknown> = Promise.resolve();
  private lastStart = 0;
  private waiting = 0;

  constructor(private readonly minIntervalMs: number, private readonly maxWaiting = 5) {}

  get depth() {
    return this.waiting;
  }

  run<T>(job: () => Promise<T>): Promise<T> {
    if (this.waiting >= this.maxWaiting) {
      return Promise.reject(new Error("QUEUE_FULL"));
    }
    this.waiting++;
    const next = this.tail.then(async () => {
      const wait = this.lastStart + this.minIntervalMs - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      this.lastStart = Date.now();
      try {
        return await job();
      } finally {
        this.waiting--;
      }
    });
    this.tail = next.catch(() => undefined);
    return next;
  }
}
