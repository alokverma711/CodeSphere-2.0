// Import axios for making HTTP requests to external APIs
const axios = require('axios');

const RATE_LIMIT_WAIT_MS = Number(process.env.GROQ_RATE_LIMIT_WAIT_MS || 60000);
const MAX_RETRY_CYCLES = Number(process.env.GROQ_MAX_RETRY_CYCLES || 30);
const MAX_PARALLEL_SUMMARY_CALLS = Math.max(1, Number(process.env.GROQ_PARALLEL_REQUESTS || 1));

let activeGroqKeyIndex = 0;
let runningSummaryCalls = 0;
const summaryWaiters = [];

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeKey(rawValue) {
    return (rawValue || '').trim().replace(/^['"]|['"]$/g, '');
}

function isRealPlaceholder(key) {
    return !key || key === 'your_groq_api_key_here';
}

function isValidGroqKeyFormat(key) {
    return key.startsWith('gsk_') && key.length >= 40;
}

function getGroqApiKeys() {
    const singleKey = normalizeKey(process.env.GROQ_API_KEY || '');
    const multiKeyRaw = process.env.GROQ_API_KEYS || '';
    const multiKeys = multiKeyRaw
        .split(/[,\n]/)
        .map(item => normalizeKey(item))
        .filter(Boolean);

    const uniqueKeys = [...new Set([singleKey, ...multiKeys].filter(Boolean))];
    const validKeys = uniqueKeys.filter(key => !isRealPlaceholder(key) && isValidGroqKeyFormat(key));

    if (validKeys.length === 0) {
        throw new Error('No valid Groq API key found. Set GROQ_API_KEY or GROQ_API_KEYS in backend/.env and restart the backend server.');
    }

    return validKeys;
}

function nextSummaryWaiter() {
    const waiter = summaryWaiters.shift();
    if (waiter) waiter();
}

async function acquireSummarySlot() {
    if (runningSummaryCalls < MAX_PARALLEL_SUMMARY_CALLS) {
        runningSummaryCalls += 1;
        return;
    }

    await new Promise(resolve => {
        summaryWaiters.push(resolve);
    });

    runningSummaryCalls += 1;
}

function releaseSummarySlot() {
    runningSummaryCalls = Math.max(0, runningSummaryCalls - 1);
    nextSummaryWaiter();
}

async function runWithSummaryConcurrency(taskFn) {
    await acquireSummarySlot();
    try {
        return await taskFn();
    } finally {
        releaseSummarySlot();
    }
}

function parseRetryAfterMs(error) {
    const retryAfterHeader = error?.response?.headers?.['retry-after'];
    if (!retryAfterHeader) return 0;

    const asNumber = Number(retryAfterHeader);
    if (Number.isFinite(asNumber) && asNumber > 0) {
        return Math.ceil(asNumber * 1000);
    }

    const retryDate = Date.parse(retryAfterHeader);
    if (!Number.isNaN(retryDate)) {
        const delta = retryDate - Date.now();
        return delta > 0 ? delta : 0;
    }

    return 0;
}

function createSummaryPrompt(username, repo, summaryType, targetPath, fileContent) {
    if (summaryType === 'repo') {
        return `You are an expert software architect. Summarize the repository using only the provided context.\nWrite exactly three concise sections using these plain text labels (not markdown headings): Purpose, Architecture and Tech Stack, Key Components.\nPurpose: 2-4 factual sentences describing what the project does.\nArchitecture and Tech Stack: 2-4 factual sentences covering backend, frontend, AI usage, and major technologies.\nKey Components: 3-6 short bullet points naming core directories/modules and their responsibilities.\nKeep the summary crisp and precise.\nDo not use # or ## anywhere in the output.\nDo not invent details.\nNever use speculative or hedging phrases such as: "this suggests", "likely", "appears", "seems", "might", "probably".\nIf a required detail is missing, write: "Not specified in provided context."\n\nRepository: ${username}/${repo}\n\nRepository Context:\n${fileContent}`;
    }

    if (summaryType === 'file') {
        return `You are a code analysis assistant. Summarize only the provided file context and code.\nWrite exactly four concise sections using these plain text labels: File Purpose, Main Logic, Important Functions, Risks and Notes.\nUse 1 short paragraph per section.\nKeep statements factual and specific.\nDo not use # or ## anywhere in the output.\nDo not invent behavior not present in the code.\nAvoid speculative phrases such as "likely", "appears", or "might".\n\nFile: ${targetPath}\nRepository: ${username}/${repo}\n\nContext:\n${fileContent}`;
    }

    if (summaryType === 'folder') {
        return `You are an expert software architect analyzing a codebase. Summarize the provided folder based only on its contents and metadata.\nWrite exactly three concise sections using these plain text labels: Folder Role, Notable Contents, How It Fits In Project.\nFor each section, write one short paragraph with direct, concrete wording.\nKeep the summary crisp and precise.\nDo not use # or ## anywhere in the output.\nDo not invent files that are not listed.\nAvoid speculative filler and generic statements.\n\nFolder: ${targetPath}\nRepository: ${username}/${repo}\n\nFolder Structure and Metadata:\n${fileContent}`;
    }

    throw new Error('Invalid summary type. Must be "repo", "file", or "folder"');
}

async function requestGroqSummary(summaryPrompt) {
    const groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    const keys = getGroqApiKeys();
    let sawRateLimit = false;
    let authFailures = 0;
    let lastError = null;

    for (let cycle = 1; cycle <= MAX_RETRY_CYCLES; cycle += 1) {
        let waitFromRetryAfterMs = 0;
        const attemptedKeyIndexes = new Set();
        while (attemptedKeyIndexes.size < keys.length) {
            const keyIndex = ((activeGroqKeyIndex % keys.length) + keys.length) % keys.length;
            attemptedKeyIndexes.add(keyIndex);
            const groqApiKey = keys[keyIndex];

            try {
                const groqResponse = await axios({
                    method: 'post',
                    url: groqApiUrl,
                    headers: {
                        'Authorization': `Bearer ${groqApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    data: {
                        model: 'qwen/qwen3-32b',
                        reasoning_effort: 'none',
                        messages: [
                            {
                                role: 'system',
                                content: 'Return only the final answer.'
                            },
                            {
                                role: 'user',
                                content: summaryPrompt,
                            },
                        ],
                        temperature: 0.7,
                        max_tokens: 500,
                    },
                });

                return groqResponse.data.choices[0].message.content;
            } catch (error) {
                lastError = error;
                const status = error?.response?.status;

                if (status === 429) {
                    sawRateLimit = true;
                    waitFromRetryAfterMs = Math.max(waitFromRetryAfterMs, parseRetryAfterMs(error));
                    activeGroqKeyIndex = (keyIndex + 1) % keys.length;
                    continue;
                }

                if (status === 401) {
                    authFailures += 1;
                    activeGroqKeyIndex = (keyIndex + 1) % keys.length;
                    continue;
                }

                if (status === 400) {
                    throw new Error(`Groq API error: ${error.response?.data?.error?.message || 'Invalid request'}`);
                }

                throw new Error(`Summary generation failed: ${error.message}`);
            }
        }

        if (cycle < MAX_RETRY_CYCLES && sawRateLimit) {
            const effectiveWait = Math.max(RATE_LIMIT_WAIT_MS, waitFromRetryAfterMs);
            await wait(effectiveWait);
        }
    }

    if (authFailures > 0 && authFailures >= keys.length * MAX_RETRY_CYCLES) {
        throw new Error('Groq API authentication failed for all configured keys. Check GROQ_API_KEY and GROQ_API_KEYS.');
    }

    if (sawRateLimit) {
        throw new Error(`Groq API rate limit exceeded across all configured keys after ${MAX_RETRY_CYCLES} retry cycles. Increase GROQ_MAX_RETRY_CYCLES or wait and retry.`);
    }

    throw new Error(`Summary generation failed: ${lastError?.message || 'Unknown Groq error'}`);
}

// Define the async function that generates summaries based on user input
// Parameters:
// - username: GitHub username
// - repo: GitHub repository name
// - summaryType: Type of summary requested ('repo', 'file', or 'folder')
// - targetPath: Path to specific file or folder (optional, null for whole repo)
// - fileContent: The actual code/content to be summarized (passed from frontend)
async function generateSummary(username, repo, summaryType, targetPath, fileContent) {
    return runWithSummaryConcurrency(async () => {
        // Validate that fileContent is provided - this is the code that needs to be summarized
        if (!fileContent) {
            throw new Error('File content is required for summarization');
        }

        const summaryPrompt = createSummaryPrompt(username, repo, summaryType, targetPath, fileContent);
        const summary = await requestGroqSummary(summaryPrompt);

        return {
            summary: summary,
            summaryType: summaryType,
            targetPath: targetPath || 'entire repository',
            repository: `${username}/${repo}`,
            generatedAt: new Date().toISOString(),
        };
    });
}

// Export the generateSummary function so it can be used in other files
module.exports = { generateSummary };
