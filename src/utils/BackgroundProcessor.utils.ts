import Logger from "$pkg/logger";

// Background processing utilities for better performance
export class BackgroundProcessor {
  private static queue: Array<() => Promise<void>> = [];
  private static processing = false;

  static async addTask(task: () => Promise<void>) {
    this.queue.push(task);
    if (!this.processing) {
      this.processQueue();
    }
  }

  private static async processQueue() {
    this.processing = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch (error) {
          Logger.error("Background task failed:", error);
        }
      }
    }
    this.processing = false;
  }
}
