import { useState } from 'react';
import { NumberField } from '../components/NumberField';
import { Button } from '../components/Button';
import { Code } from '../components/Code';
import { Log } from '../components/Log';
import { Metric } from '../components/Metric';
import { Note } from '../components/Note';
import { Panel } from '../components/Panel';
import { useModel } from '../hooks/useModel';
import { Lifecycle } from '../rxjs/lifecycle';
import './LifecyclePage.css';

export function LifecyclePage() {
  const [model, state] = useModel(() => new Lifecycle());
  const [value, setValue] = useState(1);
  return (
    <>
      <div className="metrics">
        <Metric
          title="Источник Subject"
          value={{ active: 'Активен', complete: 'Завершён', error: 'Ошибка' }[state.sourceStatus]}
          accent
        />
        <Metric
          title="Subscription.closed · последняя"
          value={state.closed === null ? '—' : String(state.closed)}
        />
        <Metric title="Активные подписчики" value={state.active} />
        <Metric title="Последнее значение" value={state.lastValue ?? '—'} />
      </div>
      <Panel title="Управление жизненным циклом">
        <div className="actions">
          <Button variant="primary" onClick={() => model.subscribe()}>
            + Subscribe
          </Button>
          <Button disabled={!state.active} onClick={() => model.unsubscribe()}>
            Unsubscribe
          </Button>
          <Button disabled={state.sourceStatus !== 'active'} onClick={() => model.complete()}>
            Complete
          </Button>
          <Button
            variant="danger"
            disabled={state.sourceStatus !== 'active'}
            onClick={() => model.error()}
          >
            Error
          </Button>
          <Button onClick={() => model.reset()}>↻ Reset</Button>
        </div>
        <div className="send-value">
          <NumberField label="Значение" value={value} onChange={setValue} />
          <Button onClick={() => model.next(value)}>Next →</Button>
        </div>
        <div className="inline-state">
          <span>
            Причина завершения <b>{state.reason}</b>
          </span>
          <span>
            Создано подписок <b>{state.total}</b>
          </span>
        </div>
      </Panel>
      <Note>
        Каждый Subscribe добавляет подписчика. Unsubscribe отменяет все активные подписки без вызова
        complete. Complete и Error завершают источник: новая подписка сразу получит терминальное
        событие. Reset создаёт новый Subject.
      </Note>
      <Log entries={state.logs} onClear={() => model.clearLog()} />
      <Code>{`const subscription = subject.subscribe({ next, complete, error });\nsubscription.unsubscribe(); // отмена подписки, Subject остаётся активным\n// Альтернативы для завершения источника:\nsubject.complete(); // успешное завершение\nsubject.error(new Error('Ошибка')); // завершение с ошибкой`}</Code>
    </>
  );
}
