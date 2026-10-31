import type { Subscription } from 'rxjs';
import { Observable } from 'rxjs';
import { Store, type BaseState } from './store';

type Name = 'A' | 'B';
interface ColdState extends BaseState {
  starts: number;
  teardowns: number;
  active: number;
  A: number[];
  B: number[];
  activeA: boolean;
  activeB: boolean;
}

export class ColdObservable extends Store<ColdState> {
  readonly observable: Observable<number>;
  private subscriptions: Partial<Record<Name, Subscription>> = {};
  constructor() {
    super({
      logs: [],
      starts: 0,
      teardowns: 0,
      active: 0,
      A: [],
      B: [],
      activeA: false,
      activeB: false,
    });
    // BREAKPOINT 1: конструктор сохраняет функцию источника, но пока не выполняет её.
    this.observable = new Observable<number>((subscriber) => {
      const producerId = this.snapshot.starts + 1;
      let value = 0; // У каждого вызова subscribe свои счётчик и таймер.
      this.patch({ starts: producerId, active: this.snapshot.active + 1 });
      this.log(`Producer #${producerId}`, 'Запущен новый producer');
      const timer = setInterval(() => {
        // next() передаёт значение только подписчику этого экземпляра источника.
        subscriber.next(++value);
      }, 1000);
      return () => {
        // BREAKPOINT 8: при отписке вызывается очистка и удаляется таймер этой подписки.
        clearInterval(timer);
        this.patch({ teardowns: this.snapshot.teardowns + 1, active: this.snapshot.active - 1 });
        this.log(`Producer #${producerId}`, 'teardown: clearInterval()', 'teardown');
      };
    });
    this.log('Observable', 'new Observable(): producer не запущен');
  }

  subscribe(name: Name): void {
    if (this.subscriptions[name] && !this.subscriptions[name]?.closed) {
      return;
    }
    this.patch({ [name]: [], [name === 'A' ? 'activeA' : 'activeB']: true });
    this.log(`Subscriber ${name}`, 'subscribe()');
    // BREAKPOINT 2: этот вызов запускает отдельный источник для подписчика A или B.
    this.subscriptions[name] = this.observable.subscribe((value) => {
      this.patch({ [name]: [...this.snapshot[name].slice(-19), value] });
      this.log(`Subscriber ${name}`, `next(${value})`, 'next');
    });
  }

  unsubscribe(name: Name): void {
    const subscription = this.subscriptions[name];
    if (!subscription || subscription.closed) {
      return;
    }
    this.log(`Subscriber ${name}`, 'unsubscribe()');
    subscription.unsubscribe();
    this.patch({ [name === 'A' ? 'activeA' : 'activeB']: false });
  }

  reset(): void {
    this.unsubscribe('A');
    this.unsubscribe('B');
    this.patch({ logs: [], starts: 0, teardowns: 0, active: 0, A: [], B: [] });
    this.log('Observable', 'Готов к новым подпискам; producer не запущен');
  }

  dispose(): void {
    this.unsubscribe('A');
    this.unsubscribe('B');
    this.closeStore();
  }
}
