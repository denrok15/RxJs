import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ColdObservable } from '../rxjs/cold-observable';
import { IntervalStream } from '../rxjs/interval-stream';
const models: { dispose(): void }[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  models.splice(0).forEach((model) => model.dispose());
  expect(vi.getTimerCount()).toBe(0);
  vi.useRealTimers();
});
describe('Cold Observable', () => {
  it('is lazy and starts an independent producer per subscriber', () => {
    const model = new ColdObservable();
    models.push(model);
    expect(model.snapshot.starts).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(3000);
    expect(model.snapshot.starts).toBe(0);
    model.subscribe('A');
    vi.advanceTimersByTime(2000);
    model.subscribe('B');
    vi.advanceTimersByTime(1000);
    expect(model.snapshot.A).toEqual([1, 2, 3]);
    expect(model.snapshot.B).toEqual([1]);
    expect(model.snapshot.starts).toBe(2);
    expect(model.snapshot.active).toBe(2);
    model.unsubscribe('A');
    vi.advanceTimersByTime(2000);
    expect(model.snapshot.A).toEqual([1, 2, 3]);
    expect(model.snapshot.B).toEqual([1, 2, 3]);
    expect(model.snapshot.teardowns).toBe(1);
    expect(vi.getTimerCount()).toBe(1);
    model.unsubscribe('B');
    expect(vi.getTimerCount()).toBe(0);
    expect(model.snapshot.active).toBe(0);
  });

  it('guards duplicate subscriptions and restarts a local sequence', () => {
    const model = new ColdObservable();
    models.push(model);
    model.subscribe('A');
    model.subscribe('A');
    expect(model.snapshot.starts).toBe(1);
    vi.advanceTimersByTime(2000);
    model.unsubscribe('A');
    model.unsubscribe('A');
    expect(model.snapshot.teardowns).toBe(1);
    model.subscribe('A');
    vi.advanceTimersByTime(1000);
    expect(model.snapshot.A).toEqual([1]);
    model.reset();
    expect(model.snapshot.active).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('disposes both producers when leaving the page', () => {
    const model = new ColdObservable();
    models.push(model);
    model.subscribe('A');
    model.subscribe('B');
    model.dispose();
    expect(vi.getTimerCount()).toBe(0);
    expect(model.snapshot.teardowns).toBe(2);
  });
});
describe('setInterval teardown', () => {
  it('stops real producer ticks after unsubscribe and can subscribe again', () => {
    const model = new IntervalStream();
    models.push(model);
    model.setIntervalMs(200);
    model.start();
    model.start();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(600);
    expect(model.snapshot.values).toEqual([1, 2, 3]);
    model.stop();
    expect(model.snapshot.closed).toBe(true);
    expect(model.snapshot.timerActive).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    expect(model.snapshot.teardowns).toBe(1);
    vi.advanceTimersByTime(1000);
    expect(model.snapshot.ticks).toBe(3);
    expect(model.snapshot.values).toEqual([1, 2, 3]);
    model.stop();
    expect(model.snapshot.teardowns).toBe(1);
    model.start();
    vi.advanceTimersByTime(200);
    expect(model.snapshot.values).toEqual([1]);
    expect(model.snapshot.ticks).toBe(4);
    model.dispose();
    expect(model.snapshot.teardowns).toBe(2);
  });

  it('does not reconfigure an active timer and clears it on reset', () => {
    const model = new IntervalStream();
    models.push(model);
    model.start();
    model.setIntervalMs(100);
    expect(model.snapshot.intervalMs).toBe(750);
    model.reset();
    expect(vi.getTimerCount()).toBe(0);
    expect(model.snapshot.closed).toBeNull();
  });
});
