import type { Subscription } from 'rxjs';
import { filter, map, Subject, tap } from 'rxjs';
import { Store, type BaseState } from './store';

export type OperatorOrder = 'filter-map' | 'map-filter';

export interface PipelineConfig {
  threshold: number;
  multiplier: number;
  order: OperatorOrder;
}

export interface StageValue {
  input: number;
  output: number | null;
}
interface PipelineState extends BaseState, PipelineConfig {
  created: boolean;
  subscribed: boolean;
  input: number | null;
  filterValue: StageValue | null;
  mapValue: StageValue | null;
  results: number[];
  rejected: number[];
}

export class Pipeline extends Store<PipelineState> {
  private source: Subject<number> | null = null;
  private subscription: Subscription | null = null;
  constructor() {
    super({
      logs: [],
      threshold: 5,
      multiplier: 10,
      order: 'filter-map',
      created: false,
      subscribed: false,
      input: null,
      filterValue: null,
      mapValue: null,
      results: [],
      rejected: [],
    });
  }

  create(): void {
    this.stop();
    this.source?.complete();
    // BREAKPOINT 1: Subject позволяет и подписываться на значения, и отправлять их вручную.
    this.source = new Subject<number>();
    this.patch({
      created: true,
      input: null,
      filterValue: null,
      mapValue: null,
      results: [],
      rejected: [],
    });
    this.log('Observable', 'Создан Subject<number>. Подписки ещё нет.');
  }

  configure(config: PipelineConfig): void {
    const wasSubscribed = this.snapshot.subscribed;
    this.stop();
    const { threshold, multiplier, order } = config;
    this.patch({ threshold, multiplier, order, input: null, filterValue: null, mapValue: null });
    this.log('pipe', 'Конфигурация обновлена. Следующие значения используют новую цепочку.');
    if (wasSubscribed) {
      this.subscribe();
    }
  }

  subscribe(): void {
    if (!this.source || this.snapshot.subscribed) {
      return;
    }
    const { threshold, multiplier, order } = this.snapshot;
    const filterOperator = filter((value: number) => {
      // BREAKPOINT 4: условие filter; отклонённые значения не проходят к следующим операторам.
      const accepted = value >= threshold;
      this.patch({
        filterValue: { input: value, output: accepted ? value : null },
        rejected: accepted ? this.snapshot.rejected : [...this.snapshot.rejected.slice(-19), value],
      });
      this.log(
        'filter',
        `${value} ≥ ${threshold} → ${accepted ? `пропущено: ${value}` : 'отклонено'}`,
        accepted ? 'next' : 'reject',
      );
      return accepted;
    });
    const mapOperator = map((value: number) => {
      // BREAKPOINT 5: преобразование значения оператором map.
      const result = value * multiplier;
      this.patch({ mapValue: { input: value, output: result } });
      this.log('map', `${value} × ${multiplier} → ${result}`, 'next');
      return result;
    });
    // pipe() объединяет операторы в цепочку; подписка при этом не создаётся.
    const stream =
      order === 'filter-map'
        ? this.source.pipe(filterOperator, mapOperator)
        : this.source.pipe(mapOperator, filterOperator);
    this.log(
      'pipe',
      order === 'filter-map' ? 'filter → map: цепочка собрана' : 'map → filter: цепочка собрана',
    );
    // BREAKPOINT 2: subscribe() подключает конечного подписчика к источнику через цепочку операторов.
    this.subscription = stream
      .pipe(tap((value) => this.log('tap', `Перед Subscriber: ${value}`, 'next')))
      .subscribe((value) => {
        // BREAKPOINT 6: обработчик next конечного подписчика.
        this.patch({ results: [...this.snapshot.results.slice(-19), value] });
        this.log('Subscriber', `next(${value})`, 'next');
      });
    this.patch({ subscribed: true });
    this.log('subscribe', 'Подписка активна');
  }

  next(value: number): void {
    if (!this.source || !Number.isFinite(value)) {
      return;
    }
    this.patch({ input: value, filterValue: null, mapValue: null });
    this.log(
      'Subject',
      `next(${value})${this.snapshot.subscribed ? '' : ' — нет активной подписки'}`,
      'next',
    );
    // BREAKPOINT 3: значение синхронно проходит всю цепочку операторов.
    this.source.next(value);
  }

  stop(): void {
    if (!this.subscription || this.subscription.closed) {
      return;
    }
    // BREAKPOINT 7: unsubscribe закрывает эту подписку; Subject остаётся активным.
    this.subscription.unsubscribe();
    this.patch({ subscribed: false });
    this.log('unsubscribe', 'Подписка закрыта');
  }

  dispose(): void {
    this.stop();
    this.source?.complete();
    this.closeStore();
  }
}
