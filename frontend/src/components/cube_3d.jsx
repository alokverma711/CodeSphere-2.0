import React from "react";
import "./cube_3d.css";

function Cube({ size, x, y, z, rx = 0, ry = 0, rz = 0, colorType, delay }) {
  const cubeStyle = {
    "--size": `${size}px`,
    "--x": `${x}px`,
    "--y": `${y}px`,
    "--z": `${z}px`,
    "--rx": `${rx}deg`,
    "--ry": `${ry}deg`,
    "--rz": `${rz}deg`,
    "--delay": `${delay}s`,
  };

  return (
    <div className={`cube-3d color-${colorType}`} style={cubeStyle}>
      <div className="cube-face front"></div>
      <div className="cube-face back"></div>
      <div className="cube-face left"></div>
      <div className="cube-face right"></div>
      <div className="cube-face top"></div>
      <div className="cube-face bottom"></div>
    </div>
  );
}

function OuterCube({ size = 250, scale = 1, scrollProgress = 0 }) {
  const faceOffset = scrollProgress * 150; // scatter faces outward by up to 150px
  const faceOpacity = Math.max(1 - scrollProgress * 1.6, 0); // fade faces to 0 past 62% scroll

  const style = {
    "--size": `${size}px`,
    "--scale": `${scale}`,
    "--face-offset": `${faceOffset}px`,
    "--face-opacity": faceOpacity,
  };
  return (
    <div className="outer-glass-cube" style={style}>
      <div className="outer-face front-cube"></div>
      <div className="outer-face back-cube"></div>
      <div className="outer-face left-cube"></div>
      <div className="outer-face right-cube"></div>
      <div className="outer-face top-cube"></div>
      <div className="outer-face bottom-cube"></div>
    </div>
  );
}

export default function Cube3D() {
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [mouseOffset, setMouseOffset] = React.useState({ x: 0, y: 0 });
  const [entryProgress, setEntryProgress] = React.useState(1.5); // Starts scattered for load assembly

  const targetScrollProgress = React.useRef(0);
  const currentScrollProgress = React.useRef(0);

  const targetMouseOffset = React.useRef({ x: 0, y: 0 });
  const currentMouseOffset = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    // 1. Mount entry assembly physics loop (LERP from 1.5 scatter down to 0 core)
    let entryAnimId;
    let start = null;
    const duration = 2000; // 2 seconds assembly ease

    const animateMount = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      
      // Cubic ease-out curve
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      setEntryProgress(1.5 * (1 - easeOutCubic));

      if (elapsed < duration) {
        entryAnimId = requestAnimationFrame(animateMount);
      }
    };
    entryAnimId = requestAnimationFrame(animateMount);

    // 2. Scroll tracking on home-container
    const handleScroll = () => {
      const container = document.querySelector(".home-container");
      if (container) {
        const scrollTop = container.scrollTop;
        const scrollRange = container.clientHeight || window.innerHeight || 800;
        // Reach maximum transition (1.2) smoothly when scrolled exactly one full viewport fold
        targetScrollProgress.current = Math.min((scrollTop / scrollRange) * 1.2, 1.25);
      }
    };

    // 3. Mouse movements on window
    const handleMouseMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      targetMouseOffset.current = { x: nx * 18, y: ny * 15 };
    };

    const container = document.querySelector(".home-container");
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // 4. Damped physics update loop
    let physicsAnimId;
    const updatePhysics = () => {
      // Lazy Scroll progress
      const scrollDiff = targetScrollProgress.current - currentScrollProgress.current;
      if (Math.abs(scrollDiff) > 0.001) {
        currentScrollProgress.current += scrollDiff * 0.055;
        setScrollProgress(currentScrollProgress.current);
      }

      // Lazy Mouse movements
      const mouseDiffX = targetMouseOffset.current.x - currentMouseOffset.current.x;
      const mouseDiffY = targetMouseOffset.current.y - currentMouseOffset.current.y;
      if (Math.abs(mouseDiffX) > 0.01 || Math.abs(mouseDiffY) > 0.01) {
        currentMouseOffset.current.x += mouseDiffX * 0.075;
        currentMouseOffset.current.y += mouseDiffY * 0.075;
        setMouseOffset({ x: currentMouseOffset.current.x, y: currentMouseOffset.current.y });
      }

      physicsAnimId = requestAnimationFrame(updatePhysics);
    };
    physicsAnimId = requestAnimationFrame(updatePhysics);

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(entryAnimId);
      cancelAnimationFrame(physicsAnimId);
    };
  }, []);

  // Define 15 cubes in a highly dense, symmetric star configuration (Larger dimensions!)
  const cubes = [
    // Core Center Cube
    { size: 130, x: 0, y: 0, z: 0, colorType: "core", delay: 0 },

    // Primary Axis Extensions
    { size: 80, x: 98, y: 0, z: 0, colorType: "cyan", delay: 0.2 },
    { size: 80, x: -98, y: 0, z: 0, colorType: "cyan", delay: 0.3 },
    { size: 80, x: 0, y: -98, z: 0, colorType: "purple", delay: 0.4 },
    { size: 80, x: 0, y: 98, z: 0, colorType: "purple", delay: 0.5 },
    { size: 80, x: 0, y: 0, z: 98, colorType: "pink", delay: 0.6 },
    { size: 80, x: 0, y: 0, z: -98, colorType: "pink", delay: 0.7 },

    // Symmetric 3D Corner Accents (creating the dense crystal cluster)
    { size: 56, x: 70, y: -70, z: 70, colorType: "accent-1", delay: 0.8 },
    { size: 56, x: -70, y: -70, z: -70, colorType: "accent-2", delay: 0.9 },
    { size: 56, x: 70, y: 70, z: -70, colorType: "accent-1", delay: 1.0 },
    { size: 56, x: -70, y: 70, z: 70, colorType: "accent-2", delay: 1.1 },
    { size: 56, x: 70, y: -70, z: -70, colorType: "accent-1", delay: 1.2 },
    { size: 56, x: -70, y: -70, z: 70, colorType: "accent-2", delay: 1.3 },
    { size: 56, x: -70, y: 70, z: -70, colorType: "accent-1", delay: 1.4 },
    { size: 56, x: 70, y: 70, z: 70, colorType: "accent-2", delay: 1.5 },
  ];

  // Combined physical factors
  const scrollExplosion = 1 + scrollProgress * 2.8;
  const assemblyFactor = 1 + entryProgress;

  // Volumetric fixed wrapper styles for sliding centering and bottom alignment
  const sceneStyle = {
    position: "fixed",
    zIndex: 1,
    pointerEvents: "none",
    "--scroll-progress": scrollProgress,
    left: `calc(27.5vw + ${Math.min(scrollProgress, 1.2)} * 22.5vw)`,
    top: `calc(50vh + ${Math.min(scrollProgress, 1.2)} * 22vh)`,
    transform: "translate(-50%, -50%)",
    width: "540px",
    height: "540px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div className="scene-container cube-fixed-wrapper" style={sceneStyle}>
      {/* 3D Perspective Viewport */}
      <div 
        className="viewport-3d" 
        style={{ 
          opacity: scrollProgress <= 0.6 ? 1 : Math.max(1 - (scrollProgress - 0.6) * 1.8, 0.35), 
          transition: "opacity 0.25s ease-out" 
        }}
      >
        {/* Dynamic Mouse Tilt sub-wrapper */}
        <div
          className="mouse-rotation-wrapper"
          style={{
            transform: `rotateX(${-18 - mouseOffset.y}deg) rotateY(${mouseOffset.x}deg)`,
            transformStyle: "preserve-3d",
            width: "100%",
            height: "100%",
            position: "relative",
            willChange: "transform"
          }}
        >
          {/* Slow rotating group wrapper */}
          <div className="rotation-wrapper">
            {/* Outer Big 3D Glass Cube (Enlarged size: 380px!) */}
            <OuterCube size={380} scale={(1 + scrollProgress * 0.15) * (1 + entryProgress * 0.12)} scrollProgress={scrollProgress} />

            {/* Central Cube Cluster (Assembles on load, explodes on scroll) */}
            <div className="cluster-group">
              {cubes.map((c, index) => {
                // Core cube stays central, outer cubes disperse dynamically based on both assembly and scroll physics!
                const factor = c.colorType === "core" 
                  ? (1 + scrollProgress * 0.3) * (1 + entryProgress * 0.15)
                  : scrollExplosion * assemblyFactor;
                
                // Rotational axis dynamic swirling offsets based on coordinate positions
                const rx = c.x * scrollProgress * 1.3;
                const ry = c.y * scrollProgress * 1.3;
                const rz = c.z * scrollProgress * 1.3;
                
                return (
                  <Cube
                    key={index}
                    size={c.size}
                    x={c.x * factor}
                    y={c.y * factor}
                    z={c.z * factor}
                    rx={rx}
                    ry={ry}
                    rz={rz}
                    colorType={c.colorType}
                    delay={c.delay}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
