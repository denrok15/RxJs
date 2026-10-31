import { afterEach, describe, expect, it } from 'vitest';
import { Pipeline } from '../rxjs/pipeline';

const models: Pipeline[] = [];
function setup(order: 'filter-map' | 'map-filter' = 'filter-map') {
  const model = new Pipeline();
  models.push(model);
  model.create();
  model.configure({ threshold: 5, multiplier: 10, order });
  model.subscribe();
  return model;
}
afterEach(() => models.splice(0).forEach((model) => model.dispose()));
describe('real filter and map pipeline', () => {
  it('rejects below threshold, includes boundary and maps accepted inputs', () => {
    const model = setup();
    [3, 5, 7].forEach((value) => model.next(value));
    expect(model.snapshot.results).toEqual([50, 70]);
    expect(model.snapshot.rejected).toEqual([3]);
    expect(model.snapshot.filterValue).toEqual({ input: 7, output: 7 });
    expect(model.snapshot.mapValue).toEqual({ input: 7, output: 70 });
  });

  it('changes actual results when operators are reordered', () => {
    const first = setup();
    const second = setup('map-filter');
    first.next(3);
    second.next(3);
    expect(first.snapshot.results).toEqual([]);
    expect(first.snapshot.mapValue).toBeNull();
    expect(second.snapshot.results).toEqual([30]);
    expect(second.snapshot.filterValue).toEqual({ input: 30, output: 30 });
  });

  it('logs source, filter, map, tap, subscriber in execution order', () => {
    const model = setup();
    model.clearLog();
    model.next(7);
    expect(model.snapshot.logs.map((entry) => entry.stage)).toEqual([
      'Subject',
      'filter',
      'map',
      'tap',
      'Subscriber',
    ]);
  });

  it('uses new settings without duplicate subscribers and cleans up on stop', () => {
    const model = setup();
    model.configure({ ...model.snapshot, threshold: 2, multiplier: 3, order: 'filter-map' });
    model.next(3);
    expect(model.snapshot.results).toEqual([9]);
    model.stop();
    model.next(10);
    expect(model.snapshot.results).toEqual([9]);
    model.subscribe();
    model.next(4);
    expect(model.snapshot.results).toEqual([9, 12]);
  });

  it('does not replay Subject emissions made without a subscription', () => {
    const model = new Pipeline();
    models.push(model);
    model.create();
    model.next(9);
    model.subscribe();
    expect(model.snapshot.results).toEqual([]);
    model.create();
    expect(model.snapshot.subscribed).toBe(false);
    expect(model.snapshot.results).toEqual([]);
  });
});
