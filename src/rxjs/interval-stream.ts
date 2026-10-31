import type { Subscription } from 'rxjs';
import { Observable } from 'rxjs';
import { Store, type BaseState } from './store';

interface IntervalState extends BaseState {
  running: boolean;
  intervalMs: number;
  values: number[];
  ticks: number;
  timerActive: boolean;
  teardowns: number;
  closed: boolean | null;
}

export class IntervalStream extends Store<IntervalState> {
  private subscription: Subscription | null = null;
  constructor() {
    super({
      logs: [],
      running: false,
      intervalMs: 750,
      values: [],
      ticks: 0,
      timerActive: false,
      teardowns: 0,
      closed: null,
    });
  }

  setIntervalMs(intervalMs: number): void {
    if (!this.snapshot.running && Number.isFinite(intervalMs)) {
      this.patch({ intervalMs: Math.max(100, Math.min(5000, intervalMs)) });
    }
  }

  start(): void {
    if (this.snapshot.running) {
      return;
    }
    const intervalMs = this.snapshot.intervalMs;
    // new Observable() задаёт создание ресурсов, которое начнётся только при subscribe().
    const stream = new Observable<number>((subscriber) => {
      let counter = 0;
      this.patch({ timerActive: true });
      this.log('Producer', `setInterval(${intervalMs} мс)`);
      const timer = setInterval(() => {
        this.patch({ ticks: this.snapshot.ticks + 1 });
        subscriber.next(++counter);
      }, intervalMs);
      return () => {
        // BREAKPOINT 8: удаляем сам таймер, чтобы прекратить генерацию значений.
        clearInterval(timer);
        this.patch({
          timerActive: false,
          running: false,
          teardowns: this.snapshot.teardowns + 1,
          closed: true,
        });
        this.log('teardown', 'clearInterval(): таймер удалён', 'teardown');
      };
    });
    this.patch({ values: [], running: true, closed: false });
    this.log('subscribe', 'Запуск новой подписки; счётчик начнётся с 1');
    this.subscription = stream.subscribe((value) => {
      this.patch({ values: [...this.snapshot.values.slice(-19), value] });
      this.log('Subscriber', `next(${value})`, 'next');
    });
  }

  stop(): void {
    if (!this.subscription || this.subscription.closed) {
      return;
    }
    this.log('unsubscribe', 'Остановка подписки');
    // unsubscribe() сразу вызывает функцию очистки, возвращённую источником выше.
    this.subscription.unsubscribe();
  }

  reset(): void {
    this.stop();
    this.subscription = null;
    this.patch({ logs: [], values: [], ticks: 0, teardowns: 0, closed: null });
  }

  dispose(): void {
    this.stop();
    this.closeStore();
  }
}
