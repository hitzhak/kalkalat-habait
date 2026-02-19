export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center">
        <div className="mb-4 text-6xl">📡</div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          אין חיבור לאינטרנט
        </h1>
        <p className="text-muted-foreground">
          הנתונים יסונכרנו כשתחזור אונליין
        </p>
      </div>
    </div>
  );
}
