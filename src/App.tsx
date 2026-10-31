import { useState } from 'react';
import { PipelinePage } from './pages/PipelinePage';
import { LifecyclePage } from './pages/LifecyclePage';
import { ColdPage } from './pages/ColdPage';
import { IntervalPage } from './pages/IntervalPage';
import { ErrorsPage } from './pages/ErrorsPage';
import './App.css';

const screens = [
  { name: 'Observable и pipe', component: PipelinePage },
  { name: 'Жизненный цикл', component: LifecyclePage },
  { name: 'Cold Observable', component: ColdPage },
  { name: 'Teardown и таймеры', component: IntervalPage },
  { name: 'Обработка ошибок', component: ErrorsPage },
];

export default function App() {
  const [active, setActive] = useState(0);
  const screen = screens[active];
  const Page = screen.component;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            setActive(0);
          }}
        >
          RxJS Explorer
        </a>
        <nav aria-label="Демонстрационные экраны">
          {screens.map((item, index) => (
            <button
              className={`nav-item ${active === index ? 'selected' : ''}`}
              key={item.name}
              onClick={() => setActive(index)}
              aria-current={active === index ? 'page' : undefined}
            >
              {item.name}
            </button>
          ))}
        </nav>
      </aside>
      <div className="main-area">
        <main>
          <div className="page-heading">
            <h1>{screen.name}</h1>
          </div>
          <Page key={active} />
        </main>
      </div>
    </div>
  );
}
