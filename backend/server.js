require('dotenv').config();

const express = require("express");
const cors = require("cors");
const { BuildDependencyTree } = require("./src/utils/buildDependencyTree");
const { generateSummary } = require("./src/services/summarise");
const prisma = require("./src/lib/prisma");
const {
    buildAndStoreBottomUpSummaries,
    getLatestSummaryRun,
    getSummaryRunDetails
} = require("./src/services/bottomUpSummary");

const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const app = express();

app.use(cors({
    origin: [frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express.json());

app.get("/", (req, res) => {
    res.send("CodeSphere 2.0 Backend is Running!");
});



const { exec } = require("child_process");

app.get("/branches/:username/:repo", async (req, res) => {
    const { username, repo } = req.params;
    const repoUrl = `https://github.com/${username}/${repo}`;
    
    exec(`git ls-remote --heads ${repoUrl}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`git ls-remote error: ${error.message}`);
            return res.json(['main']);
        }
        
        const lines = stdout.split('\n');
        const branches = lines
            .map(line => {
                const match = line.match(/refs\/heads\/(.+)$/);
                return match ? match[1].trim() : null;
            })
            .filter(Boolean);
            
        if (branches.length > 0) {
            res.json(branches);
        } else {
            res.json(['main']);
        }
    });
});

//Returns: { tree, traceability, apiEndpoints } - 3-object analysis response

app.get("/analyze/:username/:repo",async (req,res)=>{

    const {username,repo}=req.params;
    const {branch}=req.query;
    try {
        const analysisResult = await BuildDependencyTree(username,repo,branch);
        res.json(analysisResult);
    } catch (error) {
        res.status(500).json({error:error.message});
    }
})

// POST endpoint for generating summaries using Groq API
app.post("/summarize", async (req, res) => {
    // Extract parameters from request body
    const { username, repo, summaryType, targetPath, fileContent } = req.body;
    
    try {
        // Validate required fields
        if (!username || !repo || !summaryType || !fileContent) {
            return res.status(400).json({ 
                error: "Missing required fields: username, repo, summaryType, fileContent" 
            });
        }
        
        // Call the generateSummary function
        const result = await generateSummary(username, repo, summaryType, targetPath, fileContent);
        
        // Send the summary back to frontend
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

app.post("/summaries/build/:username/:repo", async (req, res) => {
    const { username, repo } = req.params;
    const { branch } = req.body || {};

    try {
        const analysisResult = await BuildDependencyTree(username, repo, branch);
        const result = await buildAndStoreBottomUpSummaries({
            username,
            repo,
            branch,
            analysisResult
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Read latest completed summary run for a repository.
app.get("/summaries/latest/:username/:repo", async (req, res) => {
    const { username, repo } = req.params;
    const { branch } = req.query;

    try {
        const latest = await getLatestSummaryRun(username, repo, branch);
        if (!latest) {
            return res.status(404).json({
                error: "No completed summary run found for this repository."
            });
        }
        res.json(latest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Read a summary run with all file/folder/repo summaries.
app.get("/summaries/run/:runId", async (req, res) => {
    const { runId } = req.params;

    try {
        const run = await getSummaryRunDetails(runId);
        if (!run) {
            return res.status(404).json({ error: "Summary run not found." });
        }
        res.json(run);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log("Server is running on port ",PORT);
});