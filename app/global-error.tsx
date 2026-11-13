"use client"

/** Last resort: the root layout itself failed. Renders its own document (no app styles reach it). */
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <title>CoralDAC</title>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>CoralDAC could not load</h1>
          <p style={{ opacity: 0.7, marginBottom: 16 }}>Check your connection and try again.</p>
          <button onClick={() => retry()} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid currentColor", background: "none", color: "inherit", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
