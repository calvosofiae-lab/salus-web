export function BackgroundShapes() {
  return (
    <>
      <div className="bg-shape bg-shape-top" />
      <div className="bg-shape bg-shape-middle-left" />
      <div className="bg-shape bg-shape-middle-right" />
      <div className="bg-shape bg-shape-honey-left" />
      <div className="bg-shape bg-shape-blue-right" />
      <div className="bg-shape bg-shape-bottom-left" />
    </>
  );
}

export function BackgroundWave() {
  return (
    <div className="bg-wave-bottom">
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path
          d="M0,0 C150,90 350,-40 500,40 C650,120 900,20 1200,60 L1200,120 L0,120 Z"
          fill="#dbe8e3"
        />
      </svg>
    </div>
  );
}
