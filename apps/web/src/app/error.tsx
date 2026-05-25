"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      color: "white",
      background: "#050506",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      fontFamily: "monospace"
    }}>
      <h2 style={{ color: "#f87171", marginBottom: 16 }}>Something went wrong</h2>
      <pre style={{
        color: "#94a3b8",
        background: "#0a0a0f",
        padding: 20,
        borderRadius: 8,
        maxWidth: "100%",
        overflow: "auto",
        whiteSpace: "pre-wrap",
        wordBreak: "break-all"
      }}>
        {error.message}
        {process.env.NODE_ENV === "development" ? (
          <>
            {"\n\n"}
            {error.stack}
          </>
        ) : (
          <>
            {"\n\n"}
            If this persists, please check the server logs or contact support.
          </>
        )}
      </pre>
      <button
        onClick={() => reset()}
        style={{
          marginTop: 20,
          padding: "8px 24px",
          background: "#22d3ee",
          color: "#000",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        Try again
      </button>
    </div>
  );
}
