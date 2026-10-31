import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { Observable } from 'rxjs';
import type { BaseState } from '../rxjs/store';

interface ObservableModel {
  readonly snapshot: BaseState;
  readonly state$: Observable<unknown>;
  dispose(): void;
}

export function useModel<Model extends ObservableModel>(
  factory: () => Model,
): [Model, Model['snapshot']] {
  const [model] = useState(factory);
  const listen = useCallback(
    (notify: () => void) => {
      const subscription = model.state$.subscribe(notify);
      return () => subscription.unsubscribe();
    },
    [model],
  );
  const snapshot = useSyncExternalStore<Model['snapshot']>(listen, () => model.snapshot);
  useEffect(() => () => model.dispose(), [model]);
  return [model, snapshot];
}
