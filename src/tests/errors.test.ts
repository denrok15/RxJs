import { afterEach, describe, expect, it } from 'vitest';
import { ErrorHandling } from '../rxjs/error-handling';
const models: ErrorHandling[] = [];
function setup() {
  const model = new ErrorHandling();
  models.push(model);
  return model;
}
afterEach(() => models.splice(0).forEach((model) => model.dispose()));
describe('error handling scenarios', () => {
  it('delivers throwError to error handler, never calls complete, then finalizes', () => {
    const model = setup();
    model.run('unhandled');
    expect(model.snapshot.values).toEqual([1, 2]);
    expect(model.snapshot.terminal).toBe('error');
    expect(model.snapshot.finalized).toBe(true);
    expect(model.snapshot.closed).toBe(true);
    expect(model.snapshot.logs.some((entry) => entry.stage === 'Subscriber.complete')).toBe(false);
    expect(model.snapshot.logs.at(-2)?.stage).toBe('Subscriber.error');
    expect(model.snapshot.logs.at(-1)?.stage).toBe('finalize');
  });

  it('catchError switches to fallback, completes and finalizes', () => {
    const model = setup();
    model.run('caught');
    expect(model.snapshot.values).toEqual([1, 2, 99]);
    expect(model.snapshot.terminal).toBe('complete');
    expect(model.snapshot.logs.some((entry) => entry.stage === 'Subscriber.error')).toBe(false);
    expect(model.snapshot.logs.map((entry) => entry.stage)).toEqual([
      'subscribe',
      'Subscriber',
      'Subscriber',
      'catchError',
      'Subscriber',
      'Subscriber.complete',
      'finalize',
    ]);
    expect(model.snapshot.finalized).toBe(true);
    expect(model.snapshot.closed).toBe(true);
  });

  it('successful stream completes and scenarios are repeatable', () => {
    const model = setup();
    model.run('unhandled');
    model.run('complete');
    expect(model.snapshot.values).toEqual([1, 2, 3]);
    expect(model.snapshot.terminal).toBe('complete');
    expect(model.snapshot.logs.filter((entry) => entry.stage === 'finalize')).toHaveLength(1);
    expect(model.snapshot.finalized).toBe(true);
    expect(model.snapshot.closed).toBe(true);
    model.reset();
    expect(model.snapshot.values).toEqual([]);
    expect(model.snapshot.closed).toBeNull();
  });
});
