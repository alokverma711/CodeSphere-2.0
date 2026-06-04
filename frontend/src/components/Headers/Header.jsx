import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import './Header.css';
import logo from '../../assets/logo.png';
import { FaPlay, FaDownload, FaCodeBranch, FaChevronDown } from 'react-icons/fa';

const Header = ({ repoUrl, setRepoUrl, onAnalyze, onExport, branches = [], selectedBranch, setSelectedBranch }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAnalyze = location.pathname.startsWith('/analyze');

  const [branchOpen, setBranchOpen] = useState(false);
  const branchRef = useRef(null);

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onAnalyze();
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (branchRef.current && !branchRef.current.contains(e.target)) {
        setBranchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBranchSelect = (br) => {
    setSelectedBranch(br);
    setBranchOpen(false);
  };

  return (
    <header className="app-header">
      <div className="header-left" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
        <img src={logo} alt="CodeSphere 2.0" className={`logo ${isAnalyze ? 'logo-analyze' : ''}`} />
      </div>

      {/* Custom Branch Dropdown */}
      <div className="header-branch-wrapper" ref={branchRef}>
        {branches && branches.length > 0 && (
          <div className={`branch-dropdown ${branchOpen ? 'open' : ''}`}>
            <button
              className="branch-dropdown-trigger"
              onClick={() => setBranchOpen(!branchOpen)}
              title="Select Branch"
            >
              <FaCodeBranch className="branch-trigger-icon" />
              <span className="branch-trigger-text">{selectedBranch || 'branch'}</span>
              <FaChevronDown className={`branch-chevron ${branchOpen ? 'rotated' : ''}`} />
            </button>
            {branchOpen && (
              <div className="branch-dropdown-menu">
                {branches.map(br => (
                  <div
                    key={br}
                    className={`branch-dropdown-item ${br === selectedBranch ? 'active' : ''}`}
                    onClick={() => handleBranchSelect(br)}
                  >
                    <FaCodeBranch className="branch-item-icon" />
                    <span>{br}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="header-center-search">
        <input
          type="text"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/username/repository"
          className="header-search-input"
          onKeyDown={handleKeyDown}
        />
        <button onClick={onAnalyze} className="header-action-btn run-btn" title="Analyze Repository">
          <FaPlay size={10} style={{ marginRight: '6px' }} /> <span className="header-btn-text">Analyze</span>
        </button>
      </div>

      <div className="header-right">
        <button onClick={onExport} className="header-action-btn export-btn" title="Export Analysis as JSON">
          <FaDownload size={10} style={{ marginRight: '6px' }} /> <span className="header-btn-text">Export Report</span>
        </button>
      </div>
    </header>
  );
};
export default Header;