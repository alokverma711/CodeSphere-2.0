import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Cube3D from "../components/cube_3d";
import { parseGitHubRepoUrl } from "../utils/parseGitHubRepoUrl";
import "../App.css";

function Home() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  const slides = [
    {
      titleBold: "CodeSphere",
      titleLight: "2.0",
      subtitle: "visualize codebase",
      description: "Visualize your GitHub repository in an interactive visualization scene. Enter a repository link and explore the code hierarchy, dependencies, and structure visually.",
      showSearch: true,
      colors: {
        color1: "rgba(168, 85, 247, 0.45)", // purple
        color2: "rgba(6, 182, 212, 0.38)",  // cyan
        color3: "rgba(236, 72, 153, 0.3)",  // pink
        dotColor: "#a855f7",
        gradient: "linear-gradient(135deg, #a855f7 0%, #4f46e5 100%)",
        glowColor: "rgba(168, 85, 247, 0.45)",
        glowShadow: "rgba(168, 85, 247, 0.15)",
      }
    },
    {
      titleBold: "Interactive",
      titleLight: "Visualization",
      subtitle: "explore architecture",
      description: "Navigate the complex web of folders and files in a rich, interactive canvas. Analyze code modularity and directory structure with immersive high-performance graphs.",
      showSearch: false,
      colors: {
        color1: "rgba(6, 182, 212, 0.45)",  // cyan
        color2: "rgba(59, 130, 246, 0.38)",  // blue
        color3: "rgba(168, 85, 247, 0.3)",  // purple
        dotColor: "#00d4ff",
        gradient: "linear-gradient(135deg, #00d4ff 0%, #0891b2 100%)",
        glowColor: "rgba(0, 212, 255, 0.45)",
        glowShadow: "rgba(0, 212, 255, 0.15)",
      }
    },
    {
      titleBold: "Runtime",
      titleLight: "Trace",
      subtitle: "execution behavior",
      description: "Trace sequence calls, execution logic, and functional dependencies in real-time. Visually isolate hot paths, performance bottlenecks, and recursive calls.",
      showSearch: false,
      colors: {
        color1: "rgba(236, 72, 153, 0.45)", // pink
        color2: "rgba(168, 85, 247, 0.38)", // purple
        color3: "rgba(244, 63, 94, 0.3)",   // rose
        dotColor: "#ec4899",
        gradient: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
        glowColor: "rgba(236, 72, 153, 0.45)",
        glowShadow: "rgba(236, 72, 153, 0.15)",
      }
    },
    {
      titleBold: "AI Intelligence",
      titleLight: "Engine",
      subtitle: "semantic insights",
      description: "Leverage advanced heuristics and structural code summarization. Generate modularity reports, circular dependency alerts, and natural language files explanation.",
      showSearch: false,
      colors: {
        color1: "rgba(124, 58, 237, 0.45)", // violet
        color2: "rgba(6, 182, 212, 0.38)",  // cyan
        color3: "rgba(16, 185, 129, 0.3)",  // emerald
        dotColor: "#7c3aed",
        gradient: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
        glowColor: "rgba(124, 58, 237, 0.45)",
        glowShadow: "rgba(124, 58, 237, 0.15)",
      }
    }
  ];

  const [activeSlide, setActiveSlide] = useState(0);
  const [renderSlide, setRenderSlide] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const transitionToSlide = (index) => {
    if (index === activeSlide) return;
    setIsFading(true);
    setTimeout(() => {
      setActiveSlide(index);
      setRenderSlide(index);
      setIsFading(false);
    }, 250);
  };

  useEffect(() => {
    if (isInputFocused) return;
    const interval = setInterval(() => {
      transitionToSlide((activeSlide + 1) % slides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isInputFocused, activeSlide]);

  function handleAnalyze() {
    if (!url.trim()) {
      alert("Please enter a URL");
      return;
    }
    const parsed = parseGitHubRepoUrl(url);
    if (!parsed) {
      alert("Invalid URL. Please enter a valid GitHub repository URL (e.g. https://github.com/owner/repo or owner/repo).");
      return;
    }
    navigate(`/analyze/${parsed.username}/${parsed.repo}`);
  }

  // Spotlight mouse tracking effect for cards
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  };

  // Set up Intersection Observer for Framer-like scroll reveals
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px -60px 0px",
      }
    );

    const elements = document.querySelectorAll(".scroll-reveal");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const handleNavClick = (e, target) => {
    e.preventDefault();
    if (target === 'home') {
      transitionToSlide(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target === 'features') {
      const capSection = document.querySelector('.section-capabilities');
      if (capSection) {
        capSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (target === 'why-us') {
      const whySection = document.querySelector('.section-why');
      if (whySection) {
        whySection.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (target === 'join') {
      transitionToSlide(0);
      setTimeout(() => {
        const searchInput = document.querySelector('.premium-search-bar input');
        if (searchInput) {
          searchInput.focus();
        }
      }, 300);
    }
  };

  const activeColors = slides[activeSlide].colors;
  const heroStyle = {
    "--fluid-color-1": activeColors.color1,
    "--fluid-color-2": activeColors.color2,
    "--fluid-color-3": activeColors.color3,
    "--active-dot-color": activeColors.dotColor,
    "--active-gradient": activeColors.gradient,
    "--active-glow-color": activeColors.glowColor,
    "--active-glow-shadow": activeColors.glowShadow,
  };

  return (
    <div className="home-container">
      {/* 1. HERO SECTION (100vh fold) */}
      <div className="home-hero" style={heroStyle}>
        {/* Mesmerizing Liquid Fluid Backdrop */}
        <div className="fluid-backdrop">
          <div className="fluid-blob blob-1"></div>
          <div className="fluid-blob blob-2"></div>
          <div className="fluid-blob blob-3"></div>
        </div>

        {/* Absolute-Positioned Premium Header */}
        <header className="premium-header">
          <div className="header-logo" onClick={(e) => handleNavClick(e, 'home')}>
            CodeSphere 2.0
          </div>
          <nav className="header-nav">
            <a href="#home" className={`nav-link ${activeSlide === 0 ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'home')}>
              Home
            </a>
            <a href="#features" className="nav-link" onClick={(e) => handleNavClick(e, 'features')}>
              Features
            </a>
            <a href="#why-us" className="nav-link" onClick={(e) => handleNavClick(e, 'why-us')}>
              Why Us
            </a>
            <a href="#join" className="nav-link" onClick={(e) => handleNavClick(e, 'join')}>
              Join Us
            </a>
          </nav>
        </header>

        {/* Home Content Layer */}
        <div className="home-content">
          {/* Left half: Mesmerizing animated mesh background with floating 3D cube */}
          <div className="hero-left">
            <Cube3D />
          </div>

          {/* Right half: Text stack & search bar aligned with the user mockup */}
          <div className="hero-right">
            {/* Sliding Copy Container */}
            <div className={`premium-slide-content ${isFading ? 'slide-fade-exit-active' : 'slide-fade-enter-active'}`}>
              <div className="premium-title-container">
                <h1 className="title-bold">{slides[renderSlide].titleBold}</h1>
                <h1 className="title-light">{slides[renderSlide].titleLight}</h1>
              </div>

              <div className="premium-subtitle-wrapper">
                <h3 className="premium-subtitle">{slides[renderSlide].subtitle}</h3>
                <div className="subtitle-underline"></div>
              </div>

              <p className="premium-description">
                {slides[renderSlide].description}
              </p>
            </div>

            {/* Premium capsule-style search ingestion bar (visible consistently for rapid access, shifts state elegantly) */}
            <div className="premium-search-container">
              <div className="premium-search-bar">
                <input
                  type="text"
                  placeholder="https://github.com/username/repository"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                />
                <button onClick={handleAnalyze}>Analyze →</button>
              </div>
            </div>

            {/* Pagination / Slide Selectors (dots `o o o o` from user mockup) */}
            <div className="premium-dots-container">
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`premium-dot ${activeSlide === index ? 'active' : ''}`}
                  onClick={() => transitionToSlide(index)}
                  title={`Slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. CORE CAPABILITIES SECTION */}
      <section className="section-capabilities">
        <div className="section-header-wrapper">
          <div className="section-pill scroll-reveal">CORE FEATURES</div>
          <h2 className="section-title scroll-reveal">
            Codebase Visualization <span className="gradient-text">Features</span>
          </h2>
          <div className="section-underline scroll-reveal"></div>
        </div>

        <div className="capabilities-grid">
          {/* Card 1: Architecture Intelligence */}
          <div
            className="capability-card scroll-reveal"
            onMouseMove={handleMouseMove}
          >
            <div className="card-spotlight"></div>
            <div className="card-inner">
              <div className="card-header">
                <div className="card-icon-container blue-glow">
                  <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="5" r="3" />
                    <circle cx="5" cy="19" r="3" />
                    <circle cx="19" cy="19" r="3" />
                    <line x1="12" y1="8" x2="6.8" y2="16.2" />
                    <line x1="12" y1="8" x2="17.2" y2="16.2" />
                  </svg>
                </div>
                <h3 className="card-title">Architecture Intelligence</h3>
              </div>

              <div className="card-body">
                <ul className="card-list">
                  <li><span className="dot blue-dot"></span>Interactive Directory Topology</li>
                  <li><span className="dot blue-dot"></span>Multi-View Call Graph System</li>
                  <li><span className="dot blue-dot"></span>Automatic Code Dependency Mapping</li>
                  <li><span className="dot blue-dot"></span>Dynamic High-Performance Layouts</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Card 2: Execution Traceability */}
          <div
            className="capability-card scroll-reveal"
            onMouseMove={handleMouseMove}
          >
            <div className="card-spotlight"></div>
            <div className="card-inner">
              <div className="card-header">
                <div className="card-icon-container pulse-glow">
                  <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <h3 className="card-title">Execution <span className="pink-text">Traceability</span></h3>
              </div>

              <div className="card-body">
                <ul className="card-list">
                  <li><span className="dot purple-dot"></span>Real-Time Execution Flow Visualizer</li>
                  <li><span className="dot purple-dot"></span>Sequence Call Path Generation</li>
                  <li><span className="dot purple-dot"></span>Active Bottleneck Performance Mapping</li>
                  <li><span className="dot purple-dot"></span>Recursive Function Graphing</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Card 3: AI Code Intelligence */}
          <div
            className="capability-card scroll-reveal"
            onMouseMove={handleMouseMove}
          >
            <div className="card-spotlight"></div>
            <div className="card-inner">
              <div className="card-header">
                <div className="card-icon-container cyan-glow">
                  <div className="ai-icon-text">AI</div>
                </div>
                <h3 className="card-title">AI Code Intelligence</h3>
              </div>

              <div className="card-body">
                <ul className="card-list">
                  <li><span className="dot cyan-dot"></span>Natural Language Codebase Summaries</li>
                  <li><span className="dot cyan-dot"></span>Structural Insight Generation</li>
                  <li><span className="dot cyan-dot"></span>Interactive Code Explanation Panel</li>
                  <li><span className="dot cyan-dot"></span>Semantic Heuristic Analysis Engine</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Card 4: Scalable Analysis & Automation */}
          <div
            className="capability-card scroll-reveal"
            onMouseMove={handleMouseMove}
          >
            <div className="card-spotlight"></div>
            <div className="card-inner">
              <div className="card-header">
                <div className="card-icon-container violet-glow">
                  <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>
                <h3 className="card-title">Scalable Analysis & Automation</h3>
              </div>

              <div className="card-body">
                <ul className="card-list">
                  <li><span className="dot violet-dot"></span>Multi-Repository Automated Processing</li>
                  <li><span className="dot violet-dot"></span>Optimized Performance for Large Codebases</li>
                  <li><span className="dot violet-dot"></span>Clean Visual Architectural Reports</li>
                  <li><span className="dot violet-dot"></span>Flexible PDF & JSON Insight Exports</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHY CODESPHERE 2.0 SECTION */}
      <section className="section-why">
        <div className="section-header-wrapper">
          <div className="section-pill scroll-reveal">WHY CODESPHERE 2.0?</div>
          <div className="section-underline scroll-reveal"></div>
        </div>

        <div className="why-grid">
          {/* Item 1 */}
          <div className="why-column scroll-reveal">
            <div className="why-icon-container blue-glow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="why-icon">
                <circle cx="12" cy="12" r="10" strokeDasharray="3 3" />
                <circle cx="12" cy="12" r="3.5" />
                <circle cx="12" cy="6" r="1.5" />
                <circle cx="18" cy="12" r="1.5" />
                <circle cx="12" cy="18" r="1.5" />
                <circle cx="6" cy="12" r="1.5" />
                <line x1="12" y1="8.5" x2="12" y2="7.5" />
                <line x1="15.5" y1="12" x2="16.5" y2="12" />
                <line x1="12" y1="15.5" x2="12" y2="16.5" />
                <line x1="8.5" y1="12" x2="7.5" y2="12" />
              </svg>
            </div>
            <h4 className="why-title">AI + Graph Visualization</h4>
            <p className="why-description">AI insights combined with interactive graph intelligence.</p>
          </div>

          {/* Item 2 */}
          <div className="why-column scroll-reveal">
            <div className="why-icon-container purple-glow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="why-icon">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <h4 className="why-title">Real-Time Traceability</h4>
            <p className="why-description">Track execution flow and understand runtime behavior.</p>
          </div>

          {/* Item 3 */}
          <div className="why-column scroll-reveal">
            <div className="why-icon-container blue-cyan-glow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="why-icon">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <h4 className="why-title">Interactive Intelligence</h4>
            <p className="why-description">Explore architecture through dynamic, interactive graphs.</p>
          </div>

          {/* Item 4 */}
          <div className="why-column scroll-reveal">
            <div className="why-icon-container pink-glow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="why-icon">
                <circle cx="12" cy="12" r="10" strokeDasharray="4 4" />
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
              </svg>
            </div>
            <h4 className="why-title">Visual Debugging</h4>
            <p className="why-description">Identify issues, errors and bottlenecks visually.</p>
          </div>

          {/* Item 5 */}
          <div className="why-column scroll-reveal">
            <div className="why-icon-container cyan-glow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="why-icon">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
                <path d="M2 20h20" />
                <path d="M12 4l6 6M12 4l-6 6" />
              </svg>
            </div>
            <h4 className="why-title">Scalable Platform</h4>
            <p className="why-description">Built to handle large repositories with optimized rendering.</p>
          </div>

          {/* Item 6 */}
          <div className="why-column scroll-reveal">
            <div className="why-icon-container violet-glow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="why-icon">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <h4 className="why-title">Code Navigation Made Easy</h4>
            <p className="why-description">Seamlessly move from visualizations to actual source code.</p>
          </div>
        </div>
      </section>

      {/* Decorative Network Bottom Graphic */}
      <div className="home-footer-decor">
        <svg className="footer-decor-svg" viewBox="0 0 1440 200" fill="none">
          <path d="M0 100 Q360 180 720 100 T1440 100" stroke="rgba(0, 212, 255, 0.12)" strokeWidth="2" strokeDasharray="6 6" />
          <path d="M0 130 Q360 210 720 130 T1440 130" stroke="rgba(168, 85, 247, 0.08)" strokeWidth="1.5" />
          <circle cx="360" cy="140" r="4.5" fill="#00d4ff" className="footer-node-pulse" />
          <circle cx="1080" cy="140" r="4.5" fill="#a855f7" className="footer-node-pulse" />
        </svg>
      </div>
    </div>
  );
}

export default Home;