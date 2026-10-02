export default function NaiveExecuting({ message }) {
  return (
    <div className="naive-executing">
      <div className="naive-executing__spinner" aria-hidden="true"></div>
      <p className="naive-executing__message">
        {message || 'Executing directly on production...'}
      </p>
    </div>
  );
}