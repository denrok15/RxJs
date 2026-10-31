import { NumberField } from '../components/NumberField';
import { Button } from '../components/Button';
import { Code } from '../components/Code';
import { Log } from '../components/Log';
import { Metric } from '../components/Metric';
import { Note } from '../components/Note';
import { Panel } from '../components/Panel';
import { Values } from '../components/Values';
import { useModel } from '../hooks/useModel';
import { IntervalStream } from '../rxjs/interval-stream';
import './IntervalPage.css';

export function IntervalPage() {
  const [model, state] = useModel(() => new IntervalStream());
  return (
    <>
      <div className="metrics">
        <Metric title="setInterval" value={state.timerActive ? 'Работает' : 'Не активен'} accent />
        <Metric title="Всего тиков producer" value={state.ticks} />
        <Metric title="Вызовов teardown" value={state.teardowns} />
        <Metric
          title="Subscription.closed"
          value={state.closed === null ? '—' : String(state.closed)}
        />
      </div>
      <Panel title="Асинхронный поток">
        <div className="timer-display">
          <span className={state.running ? 'timer-orbit running' : 'timer-orbit'}>◷</span>
          <div>
            <strong>{state.values.at(-1) ?? '—'}</strong>
            <span>
              {state.running ? `Новое значение каждые ${state.intervalMs} мс` : 'Ожидание запуска'}
            </span>
          </div>
        </div>
        <div className="send-value">
          <NumberField
            label="Интервал, мс (100–5000)"
            value={state.intervalMs}
            onChange={(intervalMs) => model.setIntervalMs(intervalMs)}
            min={100}
            max={5000}
            step={50}
            disabled={state.running}
          />
          <Button variant="primary" disabled={state.running} onClick={() => model.start()}>
            ▶ Запустить поток
          </Button>
          <Button disabled={!state.running} onClick={() => model.stop()}>
            ■ Unsubscribe
          </Button>
          <Button onClick={() => model.reset()}>↻ Reset</Button>
        </div>
        <Values values={state.values} />
      </Panel>
      <Note>
        Нажмите Unsubscribe и убедитесь, что число тиков больше не растёт. Teardown удаляет
        настоящий setInterval. Повторный запуск создаст новый таймер и начнёт последовательность с
        1.
      </Note>
      <Log entries={state.logs} onClear={() => model.clearLog()} />
      <Code>{`const stream$ = new Observable(subscriber => {\n  const timer = setInterval(() => subscriber.next(++counter), intervalMs);\n  return () => { clearInterval(timer); };\n});\nconst subscription = stream$.subscribe(next);\nsubscription.unsubscribe(); // синхронно вызывает teardown`}</Code>
    </>
  );
}
