import './Values.css';

export function Values({
  values,
  empty = 'Значений пока нет',
  danger = false,
}: {
  values: number[];
  empty?: string;
  danger?: boolean;
}) {
  return (
    <div className={`values ${danger ? 'rejected' : ''}`}>
      {values.length ? (
        values.map((value, index) => <span key={index}>{value}</span>)
      ) : (
        <small>{empty}</small>
      )}
    </div>
  );
}
