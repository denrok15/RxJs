import type { Subscription } from 'rxjs';
import { Subject } from 'rxjs';
import { Store, type BaseState } from './store';

type SourceStatus = 'active' | 'complete' | 'error';
interface LifecycleState extends BaseState {
  sourceStatus: SourceStatus;
  closed: boolean | null;
  active: number;
  lastValue: number | null;
  reason: string;
  total: number;
}

export class Lifecycle extends Store<LifecycleState> {
  private source = new Subject<number>();
  // Приложение само учитывает подписки, не обращаясь к внутренним полям RxJS.
  private subscriptions = new Map<number, Subscription>();
  private lastSubscription: Subscription | null = null;
  private nextId = 0;
  constructor() {
    super({
      logs: [],
      sourceStatus: 'active',
      closed: null,
      active: 0,
      lastValue: null,
      reason: '—',
      total: 0,
    });
  }

  subscribe(): void {
    const id = ++this.nextId;
    this.log('subscribe', `Подписчик #${id}: вызов subscribe()`);
    // При подписке на завершённый Subject обработчик сразу получает complete или error.
    const subscription = this.source.subscribe({
      next: (value) => {
        this.patch({ lastValue: value });
        this.log(`Subscriber #${id}`, `next(${value})`, 'next');
      },
      complete: () => {
        this.patch({ reason: 'complete', closed: true });
        this.log(`Subscriber #${id}`, 'complete()', 'complete');
      },
      error: (error: Error) => {
        this.patch({ reason: 'error', closed: true });
        this.log(`Subscriber #${id}`, `error: ${error.message}`, 'error');
      },
    });
    this.lastSubscription = subscription;
    if (!subscription.closed) {
      this.subscriptions.set(id, subscription);
    }
    // Если подписка уже закрыта, add() сразу выполняет переданную функцию очистки.
    subscription.add(() => {
      this.subscriptions.delete(id);
      this.patch({
        active: this.subscriptions.size,
        closed: this.lastSubscription?.closed ?? true,
      });
      this.log(`Subscription #${id}`, 'teardown: подписка освобождена', 'teardown');
    });
    this.patch({ active: this.subscriptions.size, closed: subscription.closed, total: id });
  }

  next(value: number): void {
    if (!Number.isFinite(value)) {
      return;
    }
    this.log(
      'Subject',
      `next(${value})${this.snapshot.sourceStatus !== 'active' ? ' — источник завершён, значение игнорируется' : ''}`,
      'next',
    );
    // После завершения источника next() больше не передаёт значения подписчикам.
    this.source.next(value);
  }

  unsubscribe(): void {
    if (!this.subscriptions.size) {
      return;
    }
    this.patch({ reason: 'unsubscribe' });
    this.log('unsubscribe', 'Отмена всех активных подписок; complete handler не вызывается');
    // unsubscribe() отменяет подписки, оставляя источник активным.
    for (const subscription of [...this.subscriptions.values()]) {
      subscription.unsubscribe();
    }
    this.patch({ closed: this.lastSubscription?.closed ?? null });
  }

  complete(): void {
    if (this.snapshot.sourceStatus !== 'active') {
      return;
    }
    this.patch({ sourceStatus: 'complete', reason: 'complete' });
    this.log('Subject', 'complete(): источник завершён', 'complete');
    // complete() уведомляет наблюдателей о завершении, затем освобождает подписки.
    this.source.complete();
  }

  error(): void {
    if (this.snapshot.sourceStatus !== 'active') {
      return;
    }
    this.patch({ sourceStatus: 'error', reason: 'error' });
    this.log('Subject', 'error(): источник завершён с ошибкой', 'error');
    // error() завершает поток уведомлением об ошибке; обработчик complete не вызывается.
    this.source.error(new Error('Демонстрационная ошибка'));
  }

  reset(): void {
    this.unsubscribe();
    this.source.complete();
    this.source = new Subject<number>();
    this.lastSubscription = null;
    this.nextId = 0;
    this.patch({
      sourceStatus: 'active',
      closed: null,
      active: 0,
      lastValue: null,
      reason: '—',
      total: 0,
      logs: [],
    });
    this.log('Reset', 'Создан новый Subject. Можно подписаться заново.');
  }

  dispose(): void {
    this.unsubscribe();
    this.source.complete();
    this.closeStore();
  }
}
