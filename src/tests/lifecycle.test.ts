import { afterEach, describe, expect, it } from 'vitest';
import { Lifecycle } from '../rxjs/lifecycle';
const models: Lifecycle[] = [];
function setup() {
  const model = new Lifecycle();
  models.push(model);
  return model;
}
afterEach(() => models.splice(0).forEach((model) => model.dispose()));
describe('Subscription lifecycle', () => {
  it('tracks subscriptions without RxJS internals, unsubscribes without complete and allows resubscription', () => {
    const model = setup();
    model.subscribe();
    model.subscribe();
    expect(model.snapshot.active).toBe(2);
    model.next(42);
    expect(model.snapshot.lastValue).toBe(42);
    expect(
      model.snapshot.logs.filter(
        (entry) => entry.message === 'next(42)' && entry.stage.startsWith('Subscriber'),
      ),
    ).toHaveLength(2);
    model.unsubscribe();
    expect(model.snapshot.active).toBe(0);
    expect(model.snapshot.closed).toBe(true);
    expect(model.snapshot.sourceStatus).toBe('active');
    expect(model.snapshot.reason).toBe('unsubscribe');
    expect(model.snapshot.logs.some((entry) => entry.kind === 'complete')).toBe(false);
    model.next(99);
    expect(model.snapshot.lastValue).toBe(42);
    model.subscribe();
    model.next(7);
    expect(model.snapshot.lastValue).toBe(7);
  });
  it.each(['complete', 'error'] as const)(
    '%s terminates, cleans up, ignores next and notifies late subscribers',
    (terminal) => {
      const model = setup();
      model.subscribe();
      model.subscribe();
      model.next(5);
      model[terminal]();
      expect(model.snapshot.sourceStatus).toBe(terminal);
      expect(model.snapshot.active).toBe(0);
      expect(model.snapshot.closed).toBe(true);
      expect(model.snapshot.reason).toBe(terminal);
      expect(model.snapshot.logs.filter((entry) => entry.kind === 'teardown')).toHaveLength(2);
      model.next(100);
      expect(model.snapshot.lastValue).toBe(5);
      model.subscribe();
      expect(model.snapshot.closed).toBe(true);
      expect(model.snapshot.active).toBe(0);
      const handlers = model.snapshot.logs.filter(
        (entry) => entry.stage.startsWith('Subscriber') && entry.kind === terminal,
      );
      expect(handlers).toHaveLength(3);
      expect(
        model.snapshot.logs.some(
          (entry) => entry.kind === (terminal === 'error' ? 'complete' : 'error'),
        ),
      ).toBe(false);
      model.reset();
      model.subscribe();
      model.next(8);
      expect(model.snapshot.lastValue).toBe(8);
      expect(model.snapshot.closed).toBe(false);
    },
  );
  it('keeps closed null until a Subscription exists', () => {
    const model = setup();
    model.complete();
    expect(model.snapshot.closed).toBeNull();
    model.subscribe();
    expect(model.snapshot.closed).toBe(true);
  });
});
