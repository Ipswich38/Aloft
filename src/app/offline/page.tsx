export default function Offline() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <h1 className="text-2xl font-bold text-ink">You&apos;re offline</h1>
      <p className="mt-2 max-w-sm text-ink-soft">
        Aloft needs a connection to load live flight data. Cached pages still work — reconnect
        to book or track a delivery.
      </p>
    </main>
  );
}
