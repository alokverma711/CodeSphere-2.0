# 🔍 CodeSphere 2.0 — Intelligent Code Visualization & Analysis

<div align="center">

![CodeSphere 2.0 Logo](https://img.shields.io/badge/CodeSphere%202.0-Code%20Analysis-blue?style=for-the-badge&logo=code&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.5-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![tree-sitter](https://img.shields.io/badge/tree--sitter-Parser-green?style=for-the-badge)

**Intelligent code visualization and analysis platform for GitHub repositories with AI-powered summaries**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Setup](#-setup-instructions) • [Architecture](#-system-architecture) • [API Docs](#-key-api-endpoints)

</div>

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Problem Statement](#-problem-statement)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Setup Instructions](#-setup-instructions)
- [Project Structure](#-project-structure)
- [API Documentation](#-key-api-endpoints)
- [How It Works](#-how-it-works)
- [Error Handling](#-error-handling--reliability)
- [Contributing](#-contributing)
- [Future Improvements](#-future-improvements)

---

## 🎯 Project Overview

**CodeSphere 2.0** is a comprehensive code analysis and visualization platform that transforms complex GitHub repositories into interactive visualizations with AI-powered insights. It enables developers, architects, and teams to understand code structure, dependencies, and execution flows with advanced graph visualization and semantic analysis.

The platform features:
- **Intelligent dependency visualization** with interactive ReactFlow graphs
- **Multi-language code parsing** using tree-sitter (12+ languages)
- **Function call traceability** mapping execution paths and relationships
- **API endpoint cataloging** from backend code
- **AI-powered semantic summaries** using Groq LLM
- **PDF report generation** for stakeholder sharing
- **Real-time analysis** with persistent caching

---

## 🔍 Problem Statement

### Challenge

Developers and architects face critical challenges when working with complex codebases:

1. **Complexity Overload** - Large repositories are hard to understand without months of study
2. **Dependency Hell** - Unclear module relationships and circular dependencies
3. **Documentation Gaps** - Code lacks meaningful documentation or comments
4. **Onboarding Delays** - New team members spend weeks understanding codebase structure
5. **Maintenance Risks** - Refactoring without understanding call chains leads to bugs
6. **Architecture Analysis** - No easy way to visualize and communicate system design

### Solution

CodeSphere 2.0 addresses these challenges by:
- **Automated Analysis** - Parse entire repositories in seconds
- **Visual Communication** - Interactive graphs replace thousand-word documents
- **AI Insights** - Groq-powered semantic summaries explain complex logic
- **Traceability** - Follow function calls and dependencies instantly
- **Knowledge Sharing** - Export analysis reports for team collaboration
- **Multi-language Support** - Analyze projects in any major programming language

---

## ✨ Features

### 🧠 Intelligent Code Visualization
- **Interactive Dependency Graphs** - Visualize file and module relationships with ReactFlow
- **Call Hierarchy Maps** - Trace function calls and execution paths
- **Real-time File Explorer** - Syntax-highlighted code preview with tree navigation
- **Responsive Graph Controls** - Pan, zoom, and select nodes to inspect relationships

### 📊 API Endpoint Cataloging
- **Automatic Endpoint Detection** - Extract REST APIs from Express, FastAPI, Flask, Spring
- **Complete Endpoint Info** - Method, path, parameters, and response types
- **Endpoint Traceability** - Link endpoints to their implementation and dependencies
- **Organized Discovery** - Browse and filter API surface by category

### 🔗 Advanced Code Traceability
- **Function Call Resolution** - Identify which functions call which across the codebase
- **Execution Sequence Mapping** - Understand code flow from entry points to leaf functions
- **Cross-Module Dependencies** - Follow imports and external package usage
- **Impact Analysis** - See what breaks when code is modified

### 🤖 AI-Powered Semantic Summaries
- **Groq LLM Integration** - Fast, context-aware code explanations
- **Multi-Level Summaries** - File-level, folder-level, and repository-level insights
- **Natural Language Explanations** - Complex logic simplified in plain English
- **Persistent Storage** - Cache summaries in PostgreSQL for instant retrieval

### 🌍 Multi-Language Support
- **12+ Languages** - JavaScript, TypeScript, Python, Java, Go, C#, PHP, Ruby, Rust, Kotlin, C++, Swift
- **Unified Parsing** - Language-agnostic analysis via tree-sitter
- **Automatic Detection** - Language identified from file extensions
- **Consistent Output** - Same analysis pipeline regardless of language

### 📄 PDF Report Generation
- **Professional Reports** - Export analysis with visualizations and summaries
- **Shareable Format** - Communicate architecture to stakeholders
- **Complete Snapshots** - Code snippets, graphs, and metrics included
- **Canvas Capture** - High-quality visualization export

### 🔄 GitHub Integration
- **Direct GitHub Access** - Analyze any public repository by username/repo
- **Branch Selection** - Choose specific branches or commits
- **Automatic Download** - ZIP fetch with automatic extraction
- **Commit Tracking** - Cache results by commit hash for consistency

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React.js** | 19.2.5 | UI framework with hooks |
| **Vite** | 8.0.10 | Lightning-fast build tool |
| **React Router** | 7.15.0 | Client-side routing |
| **ReactFlow** | 11.11.4 | Interactive graph visualization |
| **d3-force** | 3.0.0 | Physics-based graph layout |
| **Dagre** | 0.8.5 | Graph layout algorithms |
| **react-syntax-highlighter** | 16.1.1 | Code display with syntax highlighting |
| **jsPDF** | 4.2.1 | PDF generation |
| **html2canvas** | 1.4.1 | Canvas screenshot capture |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Express.js** | 5.2.1 | REST API framework |
| **Node.js** | Latest | Runtime environment |
| **Prisma ORM** | 6.16.2 | Database layer & migrations |
| **PostgreSQL** | 8.21.0 | Relational database (Neon) |
| **Axios** | 1.16.0 | HTTP client |

### Code Parsing & Analysis
| Technology | Version | Purpose |
|------------|---------|---------|
| **tree-sitter** | 0.24-0.26 | Universal code parser |
| **tree-sitter-javascript** | 0.25.0 | JS/TS parsing |
| **tree-sitter-python** | 0.25.0 | Python parsing |
| **tree-sitter-java** | 0.23.5 | Java parsing |
| **web-tree-sitter** | 0.26.8 | Browser-based tree-sitter |

### AI & LLM
| Service | Purpose |
|---------|---------|
| **Groq API** | Fast LLM for code summaries |
| **GitHub API** | Repository fetching |

### External Services
| Service | Version | Purpose |
|---------|---------|---------|
| **unzipper** | 0.12.3 | ZIP extraction |
| **cors** | 2.8.6 | CORS middleware |
| **dotenv** | 17.4.2 | Environment configuration |

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Home Page  │  │   Analyze    │  │   Dashboard  │      │
│  │  (Landing)   │  │  (Repository)│  │  (Results)   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘               │
│                           │                                  │
│              React Router · HTTP/REST API                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                       SERVER LAYER                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Express.js API Server                   │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │   │
│  │  │  Branches  │  │  Analysis  │  │  Summary   │    │   │
│  │  │  Routes    │  │   Routes   │  │   Routes   │    │   │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘    │   │
│  │        │               │               │            │   │
│  │  ┌─────┴───────────────┴───────────────┴──────┐    │   │
│  │  │         Processing Layer                    │    │   │
│  │  │  • GitHub API Integration                   │    │   │
│  │  │  • ZIP Download & Extraction                │    │   │
│  │  │  • Language Detection                       │    │   │
│  │  └─────────────────┬───────────────────────────┘    │   │
│  └────────────────────┼──────────────────────────────┘   │
│                       │                                    │
│  ┌────────────────────┴──────────────────────────────┐   │
│  │           Analysis Pipeline                       │   │
│  │  ┌─────────────────────────────────────────────┐ │   │
│  │  │  tree-sitter Parsing (12+ Languages)        │ │   │
│  │  │  • Function Extraction                      │ │   │
│  │  │  • Endpoint Detection                       │ │   │
│  │  │  • Import Resolution                        │ │   │
│  │  └─────────────────────────────────────────────┘ │   │
│  │  ┌─────────────────────────────────────────────┐ │   │
│  │  │  Traceability Engine                        │ │   │
│  │  │  • Call Graph Resolution                    │ │   │
│  │  │  • Execution Path Mapping                   │ │   │
│  │  │  • Sequence Building                        │ │   │
│  │  └─────────────────────────────────────────────┘ │   │
│  │  ┌─────────────────────────────────────────────┐ │   │
│  │  │  Groq AI Integration                        │ │   │
│  │  │  • Semantic Analysis                        │ │   │
│  │  │  • Code Summarization                       │ │   │
│  │  └─────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                    PostgreSQL Protocol
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                      DATABASE LAYER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                PostgreSQL (Neon)                     │   │
│  │  ┌────────────────┐  ┌──────────────────────────┐   │   │
│  │  │ AnalysisRun    │  │ FileSummary              │   │   │
│  │  │ • id           │  │ • id                     │   │   │
│  │  │ • repo_url     │  │ • content                │   │   │
│  │  │ • metadata     │  │ • ai_summary             │   │   │
│  │  │ • results      │  │ • file_path              │   │   │
│  │  │ • created_at   │  │ • analysis_run_id (FK)  │   │   │
│  │  └────────────────┘  └──────────────────────────┘   │   │
│  │  ┌──────────────────┐                               │   │
│  │  │ CommitHash       │                               │   │
│  │  │ • hash           │                               │   │
│  │  │ • repo_identifier│                               │   │
│  │  │ • cached_at      │                               │   │
│  │  └──────────────────┘                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                    GitHub API Integration
                            │
┌───────────────────────────┴─────────────────────────────────┐
│              EXTERNAL SERVICES LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  GitHub API  │  │   Groq API   │  │  PostgreSQL  │      │
│  │              │  │              │  │   (Neon)     │      │
│  │ • Fetch Repo │  │ • Summarize  │  │              │      │
│  │ • Branches   │  │ • Enrich     │  │ • Persist    │      │
│  │ • Commits    │  │              │  │ • Cache      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Analysis Pipeline Flow

```
User Input (GitHub URL)
        ↓
[GET /branches/:username/:repo]
        ↓
Query GitHub API for Branches
        ↓
[GET /analyze/:username/:repo?branch=main]
        ↓
┌─────────────────────────────┐
│  Download Repository (ZIP)  │
│  from GitHub API            │
└────────────┬────────────────┘
             ↓
┌─────────────────────────────┐
│  Extract ZIP & Walk Files   │
└────────────┬────────────────┘
             ↓
┌─────────────────────────────┐
│  For Each File:             │
│  • Detect Language          │
│  • Parse with tree-sitter   │
│  • Extract Functions        │
│  • Extract Endpoints        │
│  • Detect Imports           │
└────────────┬────────────────┘
             ↓
┌─────────────────────────────┐
│  Traceability Engine:       │
│  • Resolve Function Calls   │
│  • Build Call Graphs        │
│  • Map Sequences            │
└────────────┬────────────────┘
             ↓
┌─────────────────────────────┐
│  Optional: Groq AI Summary  │
│  (POST /summarize)          │
│  (POST /summaries/build)    │
└────────────┬────────────────┘
             ↓
┌─────────────────────────────┐
│  Return Structured Result:  │
│  • File Tree                │
│  • API Endpoints            │
│  • Traceability Graph       │
│  • Metadata                 │
│  • Summaries (optional)     │
└────────────┬────────────────┘
             ↓
Frontend Visualization
(React Components)
```

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** 16+ (with npm or yarn)
- **PostgreSQL** 12+ (or use Neon cloud database - recommended)
- **Git** for cloning the repository
- **GitHub Personal Access Token** (for public repo access)
- **Groq API Key** (for AI summaries)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/codesphere-2.0.git
cd codesphere-2.0
```

### 2. Database Setup

#### Option A: PostgreSQL Locally
```bash
# Install PostgreSQL
# Windows: Download from postgresql.org
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql

# Start PostgreSQL service
# Windows: Services app or `pg_ctl start`
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE codesphere_2_0;

# Exit
\q
```

#### Option B: Neon Cloud (Recommended)
1. Visit [neon.tech](https://neon.tech) and create a free account
2. Create a new project and database
3. Copy the connection string (looks like `postgresql://...`)
4. Use this in your `.env` file

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
# GitHub
GITHUB_TOKEN=your_github_personal_access_token

# Groq AI
GROQ_API_KEY=your_groq_api_key

# Database (PostgreSQL or Neon)
DATABASE_URL=postgresql://user:password@localhost:5432/codesphere_2_0

# Server
PORT=5000
NODE_ENV=development
EOF

# Set up database schema
npx prisma migrate dev --name init

# Start the server
npm start
```

### 4. Frontend Setup

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Create .env file (optional, has defaults)
cat > .env << EOF
VITE_API_URL=http://localhost:5000
EOF

# Start development server
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Docs**: See [Key API Endpoints](#-key-api-endpoints) section

### Environment Variables Reference

#### Backend (.env)
```env
# GitHub API Token
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Groq API Key (for AI summaries)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Database Connection
DATABASE_URL=postgresql://user:password@localhost:5432/codesphere_2_0

# Server Configuration
PORT=5000
NODE_ENV=development
```

#### Frontend (.env, optional)
```env
# Backend API URL (defaults to http://localhost:5000)
VITE_API_URL=http://localhost:5000
```

### Getting API Keys

#### GitHub Personal Access Token
1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click "Generate new token" (Classic)
3. Select `public_repo` scope
4. Copy and save the token
5. Use in `GITHUB_TOKEN` env variable

#### Groq API Key
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up for free
3. Navigate to API Keys
4. Create new API key
5. Use in `GROQ_API_KEY` env variable

### Verify Installation

```bash
# Terminal 1 - Test backend
cd backend
npm start
# Should see: "Server running on http://localhost:5000"

# Terminal 2 - Test frontend
cd frontend
npm run dev
# Should see: "Local: http://localhost:5173"

# Terminal 3 - Test API (optional)
curl http://localhost:5000/analyze/facebook/react?branch=main
```

---

## 📁 Project Structure

```
codesphere-2.0/
├── README.md                          # Project documentation
├── CODEBASE_ANALYSIS.md              # Detailed codebase overview
│
├── backend/                           # Express.js + Node.js server
│   ├── server.js                      # Main Express app & API routes
│   ├── package.json                   # Backend dependencies
│   ├── .env.example                   # Environment variables template
│   │
│   ├── prisma/
│   │   ├── schema.prisma              # Prisma ORM database schema
│   │   ├── migrations/                # Database schema migrations
│   │   │   ├── 20260523131954_init_bottom_up_summaries/
│   │   │   └── 20260523202510_add_commit_hash_cache/
│   │   └── migration_lock.toml
│   │
│   └── src/
│       ├── engines/
│       │   └── traceabilityEngine.js  # Call graph & execution path resolution
│       │
│       ├── lib/
│       │   └── prisma.js              # Prisma client initialization
│       │
│       ├── models/
│       │   ├── EndpointNode.js        # API endpoint data model
│       │   └── FunctionNode.js        # Function/method data model
│       │
│       ├── parsers/
│       │   ├── functionParser.js      # Extract functions (multi-language)
│       │   ├── endpointParser.js      # Extract API endpoints
│       │   ├── importDetector.js      # Detect imports & dependencies
│       │   └── languageDetector.js    # Identify programming language
│       │
│       ├── services/
│       │   ├── bottomUpSummary.js     # Persistent summary generation
│       │   └── summarise.js           # Groq API integration
│       │
│       └── utils/
│           └── buildDependencyTree.js # Main orchestrator service
│
├── frontend/                          # React + Vite application
│   ├── index.html                     # HTML entry point
│   ├── vite.config.js                 # Vite build configuration
│   ├── eslint.config.js               # ESLint linting rules
│   ├── package.json                   # Frontend dependencies
│   ├── README.md                      # Frontend-specific docs
│   │
│   └── src/
│       ├── main.jsx                   # React entry point
│       ├── App.jsx                    # Root component
│       ├── App.css                    # Global styles
│       ├── index.css                  # Base styles
│       │
│       ├── pages/
│       │   ├── home.jsx               # Landing page with hero
│       │   └── analyze.jsx            # Main analysis dashboard
│       │
│       ├── components/
│       │   ├── DependencyGraph.jsx    # File dependency visualization
│       │   ├── TraceabilityGraph.jsx  # Function call traceability
│       │   ├── ApiCatalog.jsx         # API endpoint browser
│       │   ├── FileExplorer.jsx       # File tree navigator
│       │   ├── Summary.jsx            # AI summary display
│       │   ├── cube_3d.jsx            # 3D cube animation
│       │   ├── Headers/               # Header components
│       │   ├── Sidebar/               # Sidebar navigation
│       │   ├── Canvas/                # Graph & visualization
│       │   └── *.css                  # Component-specific styles
│       │
│       ├── utils/
│       │   ├── generatePdfReport.js   # PDF export functionality
│       │   ├── graphNodePositioning.js# Graph layout algorithms
│       │   ├── treeFlattener.js       # Tree data transformation
│       │   ├── treeNodePosition.js    # Position calculations
│       │   └── icons.js               # Icon components
│       │
│       └── assets/                    # Images, fonts, media
│
└── .gitignore                         # Git ignore rules

```

---

## 🔑 Key API Endpoints

### Base URL
```
http://localhost:5000
```

### Endpoints

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/branches/:username/:repo` | GET | List available branches | `username`, `repo` |
| `/analyze/:username/:repo` | GET | Analyze repository | `branch` (query) |
| `/summarize` | POST | Generate AI summaries | JSON body |
| `/summaries/build/:username/:repo` | POST | Build & persist summaries | `branch` (query) |
| `/summaries/latest/:username/:repo` | GET | Get latest analysis | `branch` (query) |
| `/summaries/run/:runId` | GET | Retrieve results by run ID | `runId` (path) |

### Example Requests

#### 1. List Branches
```bash
curl http://localhost:5000/branches/facebook/react
```

**Response:**
```json
{
  "branches": ["main", "dev", "experimental"],
  "default": "main"
}
```

#### 2. Analyze Repository
```bash
curl "http://localhost:5000/analyze/facebook/react?branch=main"
```

**Response:**
```json
{
  "tree": {
    "files": [...],
    "folders": {...},
    "statistics": {...}
  },
  "apiEndpoints": [
    { "method": "GET", "path": "/api/users", "type": "express" }
  ],
  "traceability": {
    "nodes": [...],
    "edges": [...]
  },
  "metadata": {
    "repo": "facebook/react",
    "branch": "main",
    "languages": ["javascript", "typescript"],
    "totalFiles": 524,
    "totalFunctions": 1203
  }
}
```

#### 3. Generate AI Summary
```bash
curl -X POST http://localhost:5000/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function addNumbers(a, b) { return a + b; }",
    "language": "javascript"
  }'
```

**Response:**
```json
{
  "summary": "A simple utility function that takes two parameters and returns their sum.",
  "complexity": "O(1)",
  "purpose": "Arithmetic operation"
}
```

---

## 🎨 How It Works

### Step-by-Step Analysis Process

#### 1. **Repository Download**
- Fetch repository metadata from GitHub API
- Download repository as ZIP file
- Verify integrity and extract contents

#### 2. **File Analysis**
- Detect programming language by file extension
- Parse each file using appropriate tree-sitter grammar
- Extract functions, classes, and method signatures

#### 3. **Dependency Detection**
- Identify all imports and requires
- Map dependencies between files
- Detect external package usage

#### 4. **Endpoint Discovery**
- Analyze Express.js routes
- Detect FastAPI and Flask endpoints
- Extract Spring Boot controllers

#### 5. **Call Graph Resolution**
- Build function call relationships
- Resolve cross-file calls via imports
- Filter out common library functions

#### 6. **Traceability Building**
- Create execution sequences from entry points
- Map function-to-function calls
- Generate call stack visualization

#### 7. **AI Summarization** (Optional)
- Send code snippets to Groq API
- Generate semantic summaries
- Persist results in PostgreSQL

#### 8. **Visualization Rendering**
- Create ReactFlow graph nodes and edges
- Apply physics-based layout algorithms
- Render interactive components

#### 9. **PDF Export** (Optional)
- Capture visualizations to canvas
- Generate PDF report
- Include graphs and summaries

---

## 🛡️ Error Handling & Reliability

### Frontend Error Handling

#### 1. Network Errors
```javascript
try {
  const response = await fetch('/api/analyze/user/repo');
  if (!response.ok) throw new Error('Network error');
  return await response.json();
} catch (error) {
  console.error('Analysis failed:', error);
  // Display user-friendly toast notification
}
```

#### 2. Component Error Boundaries
- React Error Boundaries catch component crashes
- Graceful fallback UI displayed to user
- Error details logged for debugging

#### 3. Form Validation
- Client-side validation before submission
- Real-time error feedback
- Input sanitization to prevent XSS

### Backend Error Handling

#### 1. Global Error Middleware
```javascript
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});
```

#### 2. Database Error Handling
- Connection pooling with automatic retry
- Transaction rollback on failures
- Query timeout prevention
- Graceful degradation

#### 3. External API Error Handling
- GitHub API rate limiting (60/60min)
- Groq API timeout handling
- Retry logic with exponential backoff
- Fallback mechanisms

### Reliability Features

#### 1. Data Persistence
- PostgreSQL ACID compliance
- Automatic database backups via Neon
- Transaction logging
- Constraint enforcement

#### 2. Performance Optimization
- Query result caching
- Lazy loading of graph nodes
- Debounced API calls
- Indexed database queries

#### 3. Security Measures
- SQL injection prevention (parameterized queries)
- XSS protection (input sanitization)
- CORS configuration
- Rate limiting (express-rate-limit)
- Secure error messages (no stack traces to client)

#### 4. Monitoring & Logging
- Console logging with levels (error, warn, info, debug)
- Error tracking and aggregation
- API request logging
- Performance metrics collection

### Recovery Strategies

- **Automatic Retry**: Failed API calls retry up to 3 times
- **Session Persistence**: Browser localStorage for state recovery
- **Graceful Degradation**: App functions without optional features
- **User Notifications**: Clear messages for all error states

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

### Development Workflow

1. **Fork the repository**
   ```bash
   Click "Fork" on GitHub
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update relevant documentation

4. **Test your changes**
   ```bash
   # Backend
   cd backend && npm test
   
   # Frontend
   cd frontend && npm test
   ```

5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature: description'
   ```

6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**
   - Describe changes clearly
   - Reference any related issues
   - Include screenshots if UI changes

### Development Guidelines

- **Code Style**: Follow existing patterns in codebase
- **Naming**: Use descriptive names for functions and variables
- **Comments**: Explain "why", not "what"
- **Testing**: Add tests for new functionality
- **Documentation**: Update README and inline docs
- **Commits**: Write clear, atomic commits

### Backend Development

```bash
# Install dev dependencies
npm install --save-dev jest nodemon

# Run with hot reload
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Frontend Development

```bash
# Install dev dependencies
npm install --save-dev vitest

# Run dev server with hot reload
npm run dev

# Run linter
npm run lint

# Build for production
npm run build
```

---

## 🚧 Future Improvements

### 📈 Enhanced Visualizations
- [ ] **Heatmap Visualization** - Show hotspots of code activity
- [ ] **Timeline View** - Historical changes and evolution
- [ ] **Custom Dashboard** - Drag-and-drop widget configuration
- [ ] **3D Graph Rendering** - Babylon.js or Three.js integration
- [ ] **Real-time Collaboration** - WebSocket-based live editing

### 🔧 Advanced Analysis
- [ ] **Code Quality Metrics** - Complexity, maintainability scores
- [ ] **Security Scanning** - Vulnerability detection integration
- [ ] **Performance Profiling** - Bottleneck identification
- [ ] **Testing Coverage** - Test suite analysis and gaps
- [ ] **Documentation Generation** - Auto-generated API docs

### 🤖 Machine Learning
- [ ] **Anomaly Detection** - Identify unusual code patterns
- [ ] **Bug Prediction** - ML model for bug-prone code
- [ ] **Refactoring Suggestions** - Auto-detect improvement opportunities
- [ ] **Architecture Recommendations** - Best practice suggestions

### 🌐 Scalability
- [ ] **Microservices Architecture** - Modular backend services
- [ ] **Redis Caching** - Performance optimization layer
- [ ] **Message Queues** - Async task processing (Bull/RabbitMQ)
- [ ] **WebSocket Support** - Real-time updates
- [ ] **Load Balancing** - Horizontal scaling

### 📱 Platform Expansion
- [ ] **Progressive Web App** - Offline-first PWA version
- [ ] **Native Mobile Apps** - React Native for iOS/Android
- [ ] **VS Code Extension** - Direct IDE integration
- [ ] **GitHub App** - Automated analysis on PR
- [ ] **GitLab Integration** - Support for GitLab repositories

### 🔐 Advanced Features
- [ ] **Team Collaboration** - Multi-user workspaces
- [ ] **Role-Based Access** - Permission management
- [ ] **Audit Logs** - Track all analysis activities
- [ ] **Data Export** - Multiple format support
- [ ] **Custom Plugins** - Plugin system for extensions

---



<div align="center">

## 🌟 Made with

React · Express.js · tree-sitter · Groq API · PostgreSQL

### Bringing clarity to complex codebases, one visualization at a time. ✨

⭐ Star this repo if you find it helpful!

</div>
