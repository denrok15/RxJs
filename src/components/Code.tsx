import './Code.css';

export function Code({ children }: { children: string }) {
  return (
    <details className="code-details">
      <summary>Код сценария</summary>
      <pre className="code">
        <code>{children}</code>
      </pre>
    </details>
  );
}
