import type { Subscription } from 'rxjs';
import { catchError, concat, finalize, of, throwError } from 'rxjs';
import { Store, type BaseState } from './store';

export type ErrorScenario = 'unhandled' | 'caught' | 'complete';
interface ErrorState extends BaseState {
  values: number[];
  terminal: '—' | 'complete' | 'error';
  finalized: boolean;
  closed: boolean | null;
}

export class ErrorHandling extends Store<ErrorState> {
  private subscription: Subscription | null = null;
  constructor() {
    super({ logs: [], values: [], terminal: '—', finalized: false, closed: null });
  }

  run(scenario: ErrorScenario): void {
    this.subscription?.unsubscribe();
    this.patch({ values: [], terminal: '—', finalized: false, closed: null, logs: [] });
    this.log('subscribe', `Сценарий: ${scenario}`);
    // throwError отправляет уведомление об ошибке при подписке, а не выбрасывает исключение наружу.
    const source =
      scenario === 'complete'
        ? of(1, 2, 3)
        : concat(
            of(1, 2),
            throwError(() => new Error('Ошибка producer')),
          );
    // catchError заменяет поток с ошибкой резервным Observable.
    const handled =
      scenario === 'caught'
        ? source.pipe(
            catchError((error: Error) => {
              this.log('catchError', `${error.message} → замена потоком of(99)`, 'error');
              return of(99);
            }),
          )
        : source;
    this.subscription = handled
      .pipe(
        finalize(() => {
          // finalize вызывается при complete, error и unsubscribe.
          this.patch({ finalized: true });
          this.log('finalize', 'Финальная очистка выполнена', 'teardown');
        }),
      )
      .subscribe({
        next: (value) => {
          this.patch({ values: [...this.snapshot.values, value] });
          this.log('Subscriber', `next(${value})`, 'next');
        },
        error: (error: Error) => {
          this.patch({ terminal: 'error' });
          this.log('Subscriber.error', error.message, 'error');
        },
        complete: () => {
          this.patch({ terminal: 'complete' });
          this.log('Subscriber.complete', 'Поток завершён успешно', 'complete');
        },
      });
    // Синхронный поток может завершиться ещё до возврата из subscribe().
    this.patch({ closed: this.subscription.closed });
  }

  reset(): void {
    this.subscription?.unsubscribe();
    this.patch({ logs: [], values: [], terminal: '—', finalized: false, closed: null });
  }

  dispose(): void {
    this.subscription?.unsubscribe();
    this.closeStore();
  }
}
