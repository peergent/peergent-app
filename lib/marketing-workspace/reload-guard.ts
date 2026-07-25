/** Prevents overlapping understanding reload requests. */
export function createReloadGuard() {
  let inFlight = false;

  return {
    isInFlight(): boolean {
      return inFlight;
    },
    async run(task: () => Promise<void>): Promise<boolean> {
      if (inFlight) return false;
      inFlight = true;
      try {
        await task();
        return true;
      } finally {
        inFlight = false;
      }
    },
  };
}

export type ReloadGuard = ReturnType<typeof createReloadGuard>;
