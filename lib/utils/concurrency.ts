export type ConcurrencyTask<T> = () => Promise<T>;

export function createConcurrencyLimiter(maxConcurrency: number) {
  let activeCount = 0;
  const queue: Array<() => void> = [];

  const runNext = () => {
    if (activeCount >= maxConcurrency || queue.length === 0) {
      return;
    }

    activeCount += 1;
    const next = queue.shift();
    if (next) {
      next();
    }
  };

  return function limit<T>(task: ConcurrencyTask<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const runTask = () => {
        task()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            activeCount -= 1;
            runNext();
          });
      };

      queue.push(runTask);
      runNext();
    });
  };
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  maxConcurrency: number,
  task: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const limit = createConcurrencyLimiter(maxConcurrency);
  return Promise.all(items.map((item, index) => limit(() => task(item, index))));
}