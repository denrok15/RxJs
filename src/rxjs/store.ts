import { BehaviorSubject } from 'rxjs';

export type LogKind = 'info' | 'next' | 'reject' | 'complete' | 'error' | 'teardown';

export interface LogEntry {
  id: number;
  time: string;
  stage: string;
  message: string;
  kind: LogKind;
}

export interface BaseState {
  logs: LogEntry[];
}

/** Здесь хранится только состояние интерфейса. Генерация и преобразование данных выполняются потоками RxJS. */

export class Store<S extends BaseState> {
  private sequence = 0;
  private readonly stateSubject: BehaviorSubject<S>;
  readonly state$;
  constructor(initial: S) {
    this.stateSubject = new BehaviorSubject(initial);
    this.state$ = this.stateSubject.asObservable();
  }

  get snapshot(): S {
    return this.stateSubject.value;
  }

  protected patch(patch: Partial<S>): void {
    this.stateSubject.next({ ...this.snapshot, ...patch });
  }

  protected log(stage: string, message: string, kind: LogKind = 'info'): void {
    const entry = {
      id: ++this.sequence,
      time: new Date().toLocaleTimeString('ru-RU', { hour12: false }),
      stage,
      message,
      kind,
    };
    this.stateSubject.next({ ...this.snapshot, logs: [...this.snapshot.logs.slice(-199), entry] });
  }

  clearLog(): void {
    this.stateSubject.next({ ...this.snapshot, logs: [] });
  }

  protected closeStore(): void {
    this.stateSubject.complete();
  }
}
