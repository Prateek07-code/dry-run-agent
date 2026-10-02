// TEMPORARY DEV-ONLY STUB.
// mock-server/server.js is still empty, so there is nothing to call yet.
// This purely drives the UI's visual states locally for development.
// It is NOT used once the real mock server exists — delete this file then.

export function devSimulateNaiveRun(onEvent) {
  setTimeout(() => {
    onEvent('executing', {
      message: 'Running DROP TABLE directly on production...',
    });
  }, 300);

  setTimeout(() => {
    onEvent('error', {
      message: 'nightly_report_job crashed — dependency on old_sessions',
      rows_lost: 48213,
    });
  }, 2200);
}