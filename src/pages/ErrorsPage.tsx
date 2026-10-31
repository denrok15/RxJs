import { Button } from '../components/Button';
import { Code } from '../components/Code';
import { Log } from '../components/Log';
import { Metric } from '../components/Metric';
import { Note } from '../components/Note';
import { Panel } from '../components/Panel';
import { Values } from '../components/Values';
import { useModel } from '../hooks/useModel';
import { ErrorHandling, type ErrorScenario } from '../rxjs/error-handling';
import './ErrorsPage.css';

export function ErrorsPage() {
  const [model, state] = useModel(() => new ErrorHandling());
  const scenarios: { id: ErrorScenario; title: string; code: string; text: string }[] = [
    {
      id: 'unhandled',
      title: '01. Ошибка в subscribe',
      code: 'throwError → error',
      text: 'Значения 1, 2, затем error. Обработчик complete не вызывается.',
    },
    {
      id: 'caught',
      title: '02. Восстановление',
      code: 'catchError → of(99)',
      text: 'Ошибка перехвачена. Значение 99 из нового потока, затем complete.',
    },
    {
      id: 'complete',
      title: '03. Успешное завершение',
      code: 'of(1, 2, 3) → complete',
      text: 'Все значения доставлены. Complete и финальная очистка.',
    },
  ];
  return (
    <>
      <div className="scenario-grid">
        {scenarios.map((item) => (
          <Panel key={item.id} title={item.title}>
            <code className="scenario-code">{item.code}</code>
            <p>{item.text}</p>
            <Button variant="primary" onClick={() => model.run(item.id)}>
              Запустить сценарий →
            </Button>
          </Panel>
        ))}
      </div>
      <div className="metrics">
        <Metric title="Терминальное событие" value={state.terminal} accent />
        <Metric title="finalize выполнен" value={state.finalized ? 'Да' : 'Нет'} />
        <Metric
          title="Subscription.closed"
          value={state.closed === null ? '—' : String(state.closed)}
        />
        <Metric title="Получено значений" value={state.values.length} />
      </div>
      <Panel title="Значения Subscriber">
        <Values values={state.values} />
      </Panel>
      <Note>
        Во всех сценариях выполняется finalize. При восстановлении catchError подписчик получает
        complete от потока замены. Сценарии синхронные и запускаются повторно с чистым журналом.
      </Note>
      <div className="section-actions">
        <Button onClick={() => model.reset()}>↻ Reset</Button>
      </div>
      <Log entries={state.logs} onClear={() => model.clearLog()} />
      <Code>{`concat(of(1, 2), throwError(() => new Error('Ошибка producer')))\n  .pipe(\n    catchError(() => of(99)), // заменяет ошибочный поток\n    finalize(() => { /* очистка при любом завершении */ })\n  )\n  .subscribe({ next, error, complete });`}</Code>
    </>
  );
}
