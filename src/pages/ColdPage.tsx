import { Button } from '../components/Button';
import { Code } from '../components/Code';
import { Log } from '../components/Log';
import { Metric } from '../components/Metric';
import { Note } from '../components/Note';
import { Panel } from '../components/Panel';
import { Values } from '../components/Values';
import { useModel } from '../hooks/useModel';
import { ColdObservable } from '../rxjs/cold-observable';
import './ColdPage.css';

export function ColdPage() {
  const [model, state] = useModel(() => new ColdObservable());
  return (
    <>
      <div className="metrics">
        <Metric title="Observable" value="Создан" accent />
        <Metric title="Запусков producer" value={state.starts} />
        <Metric title="Активных producer" value={state.active} />
        <Metric title="Вызовов teardown" value={state.teardowns} />
      </div>
      <div className="two-columns">
        {(['A', 'B'] as const).map((name) => {
          const active = name === 'A' ? state.activeA : state.activeB;
          return (
            <Panel
              title={`Подписчик ${name}`}
              label={active ? 'АКТИВЕН · 1 000 МС' : 'НЕТ ПОДПИСКИ'}
              key={name}
            >
              <div className={`subscriber-avatar avatar-${name}`}>{name}</div>
              <p className="hint">Собственный producer, счётчик и таймер</p>
              <div className="actions">
                <Button variant="primary" disabled={active} onClick={() => model.subscribe(name)}>
                  Subscribe {name}
                </Button>
                <Button disabled={!active} onClick={() => model.unsubscribe(name)}>
                  Unsubscribe {name}
                </Button>
              </div>
              <Values values={state[name]} />
            </Panel>
          );
        })}
      </div>
      <Note>
        Сначала подпишитесь A, подождите два значения, затем подпишитесь B. B начнёт с 1, пока A
        продолжит свой счёт. Без подписок producer не работает.
      </Note>
      <div className="section-actions">
        <Button onClick={() => model.reset()}>↻ Сбросить эксперимент</Button>
      </div>
      <Log entries={state.logs} onClear={() => model.clearLog()} />
      <Code>{`const cold$ = new Observable<number>(subscriber => {\n  let counter = 0; // новый для каждой подписки\n  const timer = setInterval(() => subscriber.next(++counter), 1000);\n  return () => clearInterval(timer); // очистка ресурсов\n});\nconst a = cold$.subscribe(nextA);\nconst b = cold$.subscribe(nextB);`}</Code>
    </>
  );
}
