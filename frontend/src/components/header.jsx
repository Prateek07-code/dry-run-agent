export default function Header() {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__mark" aria-hidden="true">⏸</span>
        <div className="app-header__text">
          <h1>Dry-Run Agent</h1>
          <p className="app-header__tagline">Test the plan before it becomes real.</p>
        </div>
      </div>
    </header>
  );
}