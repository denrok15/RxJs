import { useState } from 'react';
import { NumberField } from '../components/NumberField';
import { Button } from '../components/Button';
import { Code } from '../components/Code';
import { Log } from '../components/Log';
import { Note } from '../components/Note';
import { Panel } from '../components/Panel';
import { Values } from '../components/Values';
import { useModel } from '../hooks/useModel';
import { Pipeline } from '../rxjs/pipeline';
import './PipelinePage.css';

export function PipelinePage() {
  const [model, state] = useModel(() => new Pipeline());
  const [value, setValue] = useState(7);
  const filterNode = (
    <div className="flow-node filter-node">
      <span className="node-kind">ОПЕРАТОР</span>
      <h3>filter</h3>
      <code>x ≥ {state.threshold}</code>
      <div className="node-values">
        <span>
          Вход <b>{state.filterValue?.input ?? '—'}</b>
        </span>
        <span>
          Выход <b>{state.filterValue ? (state.filterValue.output ?? 'отклонён') : '—'}</b>
        </span>
      </div>
    </div>
  );
  const mapNode = (
    <div className="flow-node map-node">
      <span className="node-kind">ОПЕРАТОР</span>
      <h3>map</h3>
      <code>x × {state.multiplier}</code>
      <div className="node-values">
        <span>
          Вход <b>{state.mapValue?.input ?? '—'}</b>
        </span>
        <span>
          Выход <b>{state.mapValue?.output ?? '—'}</b>
        </span>
      </div>
    </div>
  );
  return (
    <>
      <Panel title="Путь значения">
        <div className="flow-status">
          <span className={`status ${state.subscribed ? 'active' : ''}`}>
            <i className="dot" />
            {state.subscribed
              ? 'Подписка активна'
              : state.created
                ? 'Ожидает подписки'
                : 'Источник не создан'}
          </span>
          <span>Синхронная обработка</span>
        </div>
        <div className="flow">
          <div className="flow-node source-node">
            <span className="node-kind">ИСТОЧНИК</span>
            <h3>Observable</h3>
            <code>Subject&lt;number&gt;</code>
            <div className="node-values">
              <span>
                next <b>{state.input ?? '—'}</b>
              </span>
            </div>
          </div>
          <span className="flow-arrow">→</span>
          {state.order === 'filter-map' ? filterNode : mapNode}
          <span className="flow-arrow">→</span>
          {state.order === 'filter-map' ? mapNode : filterNode}
          <span className="flow-arrow">→</span>
          <div className="flow-node subscriber-node">
            <span className="node-kind">ПОЛУЧАТЕЛЬ</span>
            <h3>Subscriber</h3>
            <code>subscribe(next)</code>
            <div className="node-values">
              <span>
                Результат <b>{state.results.at(-1) ?? '—'}</b>
              </span>
            </div>
          </div>
        </div>
        <div className="flow-caption">
          <span className="purple-dot" />
          Реальные операторы RxJS <span>•</span> Значение проходит цепочку при next()
        </div>
      </Panel>
      <div className="two-columns">
        <Panel title="Управление потоком">
          <div className="actions">
            <Button variant="primary" onClick={() => model.create()}>
              {state.created ? '↻ Создать заново' : '+ Создать Observable'}
            </Button>
            <Button disabled={!state.created || state.subscribed} onClick={() => model.subscribe()}>
              Subscribe
            </Button>
            <Button disabled={!state.subscribed} onClick={() => model.stop()}>
              Unsubscribe
            </Button>
          </div>
          <div className="send-value">
            <NumberField label="Значение для Subject.next()" value={value} onChange={setValue} />
            <Button variant="primary" disabled={!state.created} onClick={() => model.next(value)}>
              Отправить →
            </Button>
          </div>
          <p className="hint">Начните с 3 и 7: при пороге 5 одно значение будет отклонено.</p>
        </Panel>
        <Panel title="Настройки операторов">
          <div className="settings-row">
            <NumberField
              label="Порог filter (≥)"
              value={state.threshold}
              onChange={(threshold) => model.configure({ ...state, threshold })}
            />
            <NumberField
              label="Множитель map (×)"
              value={state.multiplier}
              onChange={(multiplier) => model.configure({ ...state, multiplier })}
            />
          </div>
          <label className="field">
            <span>Порядок операторов</span>
            <select
              value={state.order}
              onChange={(event) =>
                model.configure({ ...state, order: event.target.value as typeof state.order })
              }
            >
              <option value="filter-map">filter → map</option>
              <option value="map-filter">map → filter</option>
            </select>
          </label>
          <p className="hint">Изменение настройки пересоздаёт активную подписку.</p>
        </Panel>
      </div>
      <div className="two-columns">
        <Panel title="Получено Subscriber" label={`${state.results.length} / 20`}>
          <Values values={state.results} />
        </Panel>
        <Panel title="Отклонено filter" label={`${state.rejected.length} / 20`}>
          <Values values={state.rejected} danger />
        </Panel>
      </div>
      <Log entries={state.logs} onClear={() => model.clearLog()} />
      <Note>
        Поменяйте порядок при значении 3: <code>filter → map</code> отклонит его, а{' '}
        <code>map → filter</code> передаст 30. Порог применяется к входу самого filter.
      </Note>
      <Code>{`source.pipe(\n  ${state.order === 'filter-map' ? `filter(x => x >= ${state.threshold}),\n  map(x => x * ${state.multiplier})` : `map(x => x * ${state.multiplier}),\n  filter(x => x >= ${state.threshold})`}\n).subscribe(value => { /* конечный подписчик */ });`}</Code>
    </>
  );
}
