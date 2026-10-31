import type { LogEntry } from '../rxjs/store';
import './Panel.css';
import './Log.css';

export function Log({ entries, onClear }: { entries: LogEntry[]; onClear: () => void }) {
  return (
    <section className="panel log-panel">
      <div className="panel-heading">
        <div className="log-title">
          <h2>Журнал выполнения</h2>
          <span className="count">{entries.length}</span>
        </div>
        <button className="text-button" onClick={onClear} disabled={!entries.length}>
          Очистить
        </button>
      </div>
      <div className="log-head">
        <span>№ / ВРЕМЯ</span>
        <span>ЭТАП</span>
        <span>СОБЫТИЕ</span>
      </div>
      <div className="log-body" role="log" aria-label="Журнал выполнения" aria-live="polite">
        {entries.length ? (
          entries.map((entry) => (
            <div className={`log-row ${entry.kind}`} key={entry.id}>
              <span className="log-time">
                <b>{String(entry.id).padStart(2, '0')}</b> {entry.time}
              </span>
              <span className="log-stage">{entry.stage}</span>
              <span>{entry.message}</span>
            </div>
          ))
        ) : (
          <div className="log-empty">
            <p>Событий пока нет</p>
          </div>
        )}
      </div>
    </section>
  );
}
