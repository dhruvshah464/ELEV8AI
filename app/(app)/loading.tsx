export default function AppSegmentLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* KRIYA Glyph — pulsing gold */}
        <div className="relative">
          <span
            className="text-4xl"
            style={{
              color: "hsl(var(--kriya-primary))",
              animation: "kriya-glyph-pulse 2.4s ease-in-out infinite",
            }}
          >
            ◈
          </span>
        </div>
        <p className="kriya-label">Initializing</p>
      </div>
    </div>
  );
}
