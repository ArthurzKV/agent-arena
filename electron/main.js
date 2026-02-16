import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { spawn } from 'child_process';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { readdir, stat, writeFile, mkdir } from 'fs/promises';
import * as pty from 'node-pty';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;
const PORT = 4242;

let serverProcess = null;
let mainWindow = null;
let ptyProcess = null;

function startServer() {
  const serverScript = join(__dirname, '..', 'server', 'index.ts');

  if (isDev) {
    serverProcess = spawn('npx', ['tsx', serverScript], {
      cwd: join(__dirname, '..'),
      env: { ...process.env, PORT: String(PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });
  } else {
    const builtServer = join(process.resourcesPath, 'server', 'index.js');
    serverProcess = spawn(process.execPath.replace('Electron', 'node'), [builtServer], {
      cwd: join(process.resourcesPath),
      env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }

  serverProcess.stdout?.on('data', (d) => console.log(`[server] ${d}`));
  serverProcess.stderr?.on('data', (d) => console.error(`[server] ${d}`));
  serverProcess.on('error', (err) => console.error('[server] Failed to start:', err));
}

function startPty() {
  const shellPath = process.env.SHELL || '/bin/zsh';
  // Strip CLAUDECODE env var so Claude Code can run inside the terminal
  const cleanEnv = { ...process.env };
  delete cleanEnv.CLAUDECODE;
  ptyProcess = pty.spawn(shellPath, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: cleanEnv,
  });

  ptyProcess.onData((data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('terminal-data', data);
      // Parse terminal output for Claude Code agent activity
      parseClaudeActivity(data);
    }
  });

  ptyProcess.onExit(() => {
    // Respawn if terminal exits
    setTimeout(startPty, 100);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1000,
    minHeight: 700,
    title: 'Agent Arena',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    backgroundColor: '#0a0a0a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const loadApp = () => {
    const url = isDev ? 'http://localhost:4243' : `http://localhost:${PORT}`;
    mainWindow.loadURL(url).catch(() => {
      setTimeout(loadApp, 500);
    });
  };

  setTimeout(loadApp, 1000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handlers for terminal — intercept arena-fight commands
let terminalInputBuffer = '';
let checkOutputForFight = false; // true for a short window after Enter to detect recalled commands

ipcMain.on('terminal-input', (_event, data) => {
  if (!ptyProcess) return;

  // Accumulate input to detect arena-fight on Enter
  if (data === '\r' || data === '\n') {
    const fightMatch = terminalInputBuffer.match(/arena-fight\s+(.+)/i);
    if (fightMatch) {
      const task = fightMatch[1].replace(/['"]/g, '').trim();
      if (task) {
        activateArenaFight(task);
        // Append explore-only instruction before sending Enter
        const suffix = ` — IMPORTANT: This is an arena-fight request. ONLY explore and read files to gather context. Do NOT implement, edit, write, or create any files. Do NOT use Edit or Write tools. Just report your findings.`;
        ptyProcess.write(suffix + '\r');
        terminalInputBuffer = '';
        return;
      }
    }
    // No match in typed input — command might be recalled from history (Up arrow).
    // Set flag to check terminal output for arena-fight in the next 500ms.
    checkOutputForFight = true;
    setTimeout(() => { checkOutputForFight = false; }, 500);
    terminalInputBuffer = '';
    ptyProcess.write(data);
  } else if (data === '\x7f' || data === '\b') {
    terminalInputBuffer = terminalInputBuffer.slice(0, -1);
    ptyProcess.write(data);
  } else if (data === '\x15') {
    // Ctrl+U — clear buffer
    terminalInputBuffer = '';
    ptyProcess.write(data);
  } else {
    terminalInputBuffer += data;
    ptyProcess.write(data);
  }
});

// Central function to activate arena fight mode + start gathering
function activateArenaFight(task) {
  arenaFightMode = true;
  arenaFightModeTask = task;
  console.log(`[arena] Fight mode ON for: "${task}"`);

  if (Date.now() >= fightCooldownUntil && !pendingFight) {
    const dedupKey = task.toLowerCase();
    if (!recentFightTasks.has(dedupKey)) {
      recentFightTasks.add(dedupKey);
      setTimeout(() => recentFightTasks.delete(dedupKey), 300000);
      startContextGathering(task);
    }
  }
}

async function triggerFight(task, context) {
  try {
    const body = { task };
    if (context) body.context = context;
    const res = await fetch(`http://localhost:${PORT}/api/fight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const { fightId } = await res.json();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('fight-triggered', { fightId, task });
    }
  } catch (err) {
    if (ptyProcess) {
      ptyProcess.write(`echo "Failed to start fight — is the server running?"\r`);
    }
  }
}

// === Arena Fight Mode ===
// When arena-fight is typed, we enter "arena fight mode" — watching for Claude
// to transition from exploring to implementing. This is INDEPENDENT of gathering.
let arenaFightMode = false; // true = watching for implementation signals to send Escape
let arenaFightModeTask = ''; // the task being watched

// === Context Gathering ===
// When arena-fight is detected, we don't trigger immediately.
// We buffer Claude's exploration output and wait for idle/transition signals.
let pendingFight = null; // { task, contextBuffer, lastActivityTime, startTime, checkTimer }
let fightCooldownUntil = 0; // timestamp — no new fights detected until this time
const CONTEXT_IDLE_TIMEOUT = 20000;  // 20s of no tool/thinking activity → trigger
const CONTEXT_MAX_TIMEOUT = 120000;  // 2 min max → force trigger
const CONTEXT_MIN_WAIT = 3000;       // minimum 3s of gathering
const FIGHT_COOLDOWN = 180000;       // 3 min cooldown after a fight triggers

function startContextGathering(task) {
  // Cancel any existing pending fight
  if (pendingFight?.checkTimer) clearTimeout(pendingFight.checkTimer);

  pendingFight = {
    task,
    contextBuffer: '',
    lastActivityTime: Date.now(),
    startTime: Date.now(),
  };

  // Notify renderer we're gathering
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('fight-gathering', { task });
  }

  scheduleContextCheck();
}

function scheduleContextCheck() {
  if (!pendingFight) return;
  pendingFight.checkTimer = setTimeout(checkContextGathering, 2000);
}

function checkContextGathering() {
  if (!pendingFight) return;

  const now = Date.now();
  const elapsed = now - pendingFight.startTime;
  const idle = now - pendingFight.lastActivityTime;

  // Force trigger after max timeout
  if (elapsed > CONTEXT_MAX_TIMEOUT) {
    console.log(`[arena] Context gathering hit max timeout (${(elapsed/1000).toFixed(0)}s), triggering fight`);
    finishContextGathering();
    return;
  }

  // Trigger after idle timeout (only if we have some context)
  if (idle > CONTEXT_IDLE_TIMEOUT && elapsed > CONTEXT_MIN_WAIT && pendingFight.contextBuffer.length > 50) {
    console.log(`[arena] Context gathering idle (${(idle/1000).toFixed(0)}s idle, ${pendingFight.contextBuffer.length} chars), triggering fight`);
    finishContextGathering();
    return;
  }

  scheduleContextCheck();
}

// Strip terminal noise from gathered context — keep file contents, search results, code
function cleanContext(raw) {
  const lines = raw.split('\n');
  const kept = [];
  let inFileContent = false;

  for (const line of lines) {
    // Skip empty/whitespace-only lines
    if (!line.trim()) { if (inFileContent) kept.push(''); continue; }
    // Skip spinner/progress/thinking noise
    if (/^[⏳⏺✳⚡↓↑]\s/.test(line)) continue;
    if (/thinking|Improvising|Whirring|Razzle/i.test(line) && line.length < 80) continue;
    if (/^\s*\d+[ms]\s*$/.test(line)) continue;
    if (/tokens?\s*$/.test(line) && line.length < 40) continue;
    // Keep file read output (numbered lines like "  1→code here")
    if (/^\s*\d+→/.test(line)) { inFileContent = true; kept.push(line); continue; }
    // Keep search results (file:line patterns)
    if (/^[\/\w].*:\d+:/.test(line)) { kept.push(line); continue; }
    // Keep file paths
    if (/^[\/\w][\w\-\/\.]+\.\w{1,6}$/.test(line.trim())) { kept.push(line); continue; }
    // Keep tool output markers
    if (/^[⎿]/.test(line)) { kept.push(line); continue; }
    // Keep lines that look like code (indented, or contain common code patterns)
    if (/^\s{2,}/.test(line) || /[{};=()=>]/.test(line)) { kept.push(line); continue; }
    // Keep tool invocation lines
    if (/(?:Read|Grep|Glob|Search)\(/.test(line)) { kept.push(line); continue; }
    // Keep substantive text (longer lines likely containing useful info)
    if (line.length > 60) { kept.push(line); continue; }
    // Skip everything else (short status messages, UI chrome)
    inFileContent = false;
  }

  return kept.join('\n');
}

function finishContextGathering() {
  if (!pendingFight) return;
  const { task, contextBuffer } = pendingFight;
  if (pendingFight.checkTimer) clearTimeout(pendingFight.checkTimer);
  pendingFight = null;
  arenaFightMode = false; // gathering handled it

  // Block new fight detection for cooldown period
  fightCooldownUntil = Date.now() + FIGHT_COOLDOWN;

  // Check if Claude concluded the task is already done — skip the fight
  const alreadyDone = /already (?:fully |completely )?(?:implemented|complete|functional|exists|done|present|in place)/i.test(contextBuffer)
    || /no (?:changes|work|modifications) (?:needed|required|necessary)/i.test(contextBuffer);

  if (alreadyDone) {
    console.log('[arena] Claude says task is already done — skipping fight');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('fight-skipped', { task, reason: 'Task already implemented' });
    }
    return;
  }

  // Send Escape to cancel Claude's current operation without killing the session
  if (ptyProcess) {
    ptyProcess.write('\x1b'); // Escape — cancels current tool/response in Claude Code
  }

  // Clean noise and cap at 30k chars
  let cleaned = cleanContext(contextBuffer);
  if (cleaned.length > 30000) {
    cleaned = cleaned.slice(cleaned.length - 30000);
  }

  console.log(`[arena] Context: ${contextBuffer.length} raw → ${cleaned.length} cleaned chars`);
  triggerFight(task, cleaned || undefined);
}

// Feed terminal output into context buffer during gathering phase
function feedContextGathering(strippedLine) {
  if (!pendingFight) return false;

  // Append to context buffer
  if (strippedLine.length > 0) {
    pendingFight.contextBuffer += strippedLine + '\n';
  }

  // Only reset idle timer for tool activity and thinking — NOT for response text
  const isActivity = /^[⎿✳⏺]/.test(strippedLine)
    || /(?:Read|Grep|Glob|Search|Explore|Task)\(/.test(strippedLine)
    || /Reading\s|Searching\s|Exploring\s|Thinking|Improvising|Whirring|Churning/i.test(strippedLine)
    || /[├└]─/.test(strippedLine)
    || /^\s*\d+→/.test(strippedLine)  // file content lines
    || /thought for|tokens/i.test(strippedLine);

  if (isActivity) {
    pendingFight.lastActivityTime = Date.now();
  }

  // Detect transition signals → Claude is about to implement, trigger fight now
  const isTransition = /(?:Edit|Write|Update)\(/.test(strippedLine)
    || /Entered plan mode/.test(strippedLine)
    || /Let me implement/i.test(strippedLine)
    || /I'll (?:start|begin) (?:with|by|implement)/i.test(strippedLine);

  if (isTransition && (Date.now() - pendingFight.startTime) > CONTEXT_MIN_WAIT) {
    console.log(`[arena] Transition detected ("${strippedLine.slice(0, 60)}"), triggering fight`);
    finishContextGathering();
    return true;
  }

  // Update renderer with gathering progress
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('fight-gathering-progress', {
      task: pendingFight.task,
      contextLength: pendingFight.contextBuffer.length,
      elapsed: Date.now() - pendingFight.startTime,
    });
  }

  return true;
}

// Allow renderer to force-trigger a pending fight
ipcMain.on('force-trigger-fight', () => {
  if (pendingFight) {
    console.log('[arena] Force-triggered by user');
    finishContextGathering();
  }
});

// Cancel a pending fight
ipcMain.on('cancel-fight', () => {
  if (pendingFight) {
    console.log('[arena] Fight cancelled by user');
    if (pendingFight.checkTimer) clearTimeout(pendingFight.checkTimer);
    pendingFight = null;
    // Send Escape to cancel Claude's exploration without killing the session
    if (ptyProcess) ptyProcess.write('\x1b');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('fight-cancelled');
    }
  }
});

// Apply winning solution — write to temp file, tell Claude to read it
ipcMain.on('apply-fight-solution', async (_event, { output, task }) => {
  if (!ptyProcess || !output) return;
  try {
    const dir = join(process.env.HOME, '.arena-fights');
    await mkdir(dir, { recursive: true });
    const file = join(dir, `winner-${Date.now()}.txt`);
    await writeFile(file, output, 'utf-8');
    const msg = `Read the file ${file} and apply that implementation to the project. The task was: ${task || 'see file contents'}`;
    ptyProcess.write(msg + '\r');
  } catch (err) {
    console.error('[arena] Failed to write winner file:', err);
  }
});

ipcMain.on('terminal-resize', (_event, { cols, rows }) => {
  if (ptyProcess) ptyProcess.resize(cols, rows);
});

ipcMain.on('change-terminal-cwd', (_event, dirPath) => {
  if (ptyProcess) {
    ptyProcess.write(`cd ${JSON.stringify(dirPath)} && clear\r`);
  }
});

// IPC handlers for file explorer
ipcMain.handle('read-directory', async (_event, dirPath) => {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const items = [];
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue; // skip hidden files
      const fullPath = join(dirPath, entry.name);
      const isDir = entry.isDirectory();
      items.push({ name: entry.name, path: fullPath, isDir });
    }
    items.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return items;
  } catch {
    return [];
  }
});

ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('get-home-dir', () => process.env.HOME);

// === Claude Code Agent Activity Tracker ===
const activeAgents = new Map(); // id -> { name, description, status, startTime, toolUses, tokens }
let agentIdCounter = 0;
let outputBuffer = '';
const recentFightTasks = new Set(); // Prevent duplicate triggers

function stripAnsi(str) {
  return str.replace(/\x1B\[[0-9;]*[A-Za-z]/g, '').replace(/\x1B\][^\x07]*\x07/g, '');
}

function parseClaudeActivity(rawData) {
  outputBuffer += rawData;

  // Process buffer line by line
  const lines = outputBuffer.split('\n');
  outputBuffer = lines.pop() || ''; // Keep incomplete last line in buffer

  for (const rawLine of lines) {
    const line = stripAnsi(rawLine).trim();
    if (!line) continue;

    // Detect arena-fight from output (handles recalled commands via Up arrow)
    if (checkOutputForFight && !arenaFightMode) {
      const outputFightMatch = line.match(/arena-fight\s+(.+)/i);
      if (outputFightMatch) {
        const task = outputFightMatch[1].replace(/['"]/g, '').replace(/\s*—\s*IMPORTANT.*$/, '').trim();
        if (task) {
          checkOutputForFight = false;
          activateArenaFight(task);
        }
      }
    }

    // Feed context gathering if active
    if (pendingFight) {
      feedContextGathering(line);
    }

    // Arena fight mode: watch for implementation signals INDEPENDENTLY of gathering
    // This catches cases where gathering was blocked by cooldown/dedup
    if (arenaFightMode && !pendingFight) {
      const isImplementing = /(?:Edit|Write|Update)\(/.test(line)
        || /Entered plan mode/.test(line)
        || /Let me implement/i.test(line)
        || /I'll (?:start|begin) (?:with|by|implement)/i.test(line)
        || /I'll (?:now |go ahead |proceed )?(?:make|create|add|update|modify|edit|write)/i.test(line);

      if (isImplementing) {
        console.log(`[arena] Implementation detected in fight mode ("${line.slice(0, 60)}"), sending Escape`);
        if (ptyProcess) ptyProcess.write('\x1b');
        arenaFightMode = false;
      }
    }

    // Fight detection is handled in the INPUT handler (terminal-input IPC)
    // Output parser only feeds context and tracks agent activity

    // Detect agent/task spawning: "Task(description)" or "Explore(description)"
    const taskMatch = line.match(/(?:Task|Explore|Plan|Bash|Read|Write|Edit|Grep|Glob|WebFetch|WebSearch)\(([^)]+)\)/);
    if (taskMatch) {
      const name = line.match(/(Task|Explore|Plan|Bash|Read|Write|Edit|Grep|Glob|WebFetch|WebSearch)/)?.[1] || 'Agent';
      const id = `agent-${++agentIdCounter}`;
      activeAgents.set(id, {
        name,
        description: taskMatch[1].slice(0, 80),
        status: 'running',
        startTime: Date.now(),
        toolUses: 0,
        tokens: 0,
      });
      sendAgentUpdate();
    }

    // Detect "Running N agents" or "Running N Explore agents"
    const runningMatch = line.match(/Running (\d+) (\w+) agents?/);
    if (runningMatch) {
      const count = parseInt(runningMatch[1]);
      const type = runningMatch[2];
      for (let i = 0; i < count; i++) {
        const id = `agent-${++agentIdCounter}`;
        activeAgents.set(id, {
          name: type,
          description: `${type} agent ${i + 1} of ${count}`,
          status: 'running',
          startTime: Date.now(),
          toolUses: 0,
          tokens: 0,
        });
      }
      sendAgentUpdate();
    }

    // Detect individual agent lines: "├─ Explore CSS theme · 2 tool uses · 13.3k tokens"
    const agentLineMatch = line.match(/[├└]─\s+(\w+)\s+(.+?)(?:\s*·\s*(\d+)\s*tool\s*uses?)?(?:\s*·\s*([\d.]+k?)\s*tokens)?/);
    if (agentLineMatch) {
      const id = `agent-${++agentIdCounter}`;
      const toolUses = agentLineMatch[3] ? parseInt(agentLineMatch[3]) : 0;
      const tokensRaw = agentLineMatch[4] || '0';
      const tokens = tokensRaw.includes('k') ? parseFloat(tokensRaw) * 1000 : parseFloat(tokensRaw);
      activeAgents.set(id, {
        name: agentLineMatch[1],
        description: agentLineMatch[2].trim().slice(0, 80),
        status: 'running',
        startTime: Date.now(),
        toolUses,
        tokens,
      });
      sendAgentUpdate();
    }

    // Detect tool usage: "⎿ Searching..." "⎿ Reading..." etc.
    const toolMatch = line.match(/⎿\s+(\w+ing\s+.+)/);
    if (toolMatch) {
      // Update the most recent agent's description
      const entries = [...activeAgents.entries()];
      if (entries.length > 0) {
        const [lastId, lastAgent] = entries[entries.length - 1];
        lastAgent.description = toolMatch[1].slice(0, 80);
        lastAgent.toolUses++;
        sendAgentUpdate();
      }
    }

    // Detect completion patterns
    if (line.includes('Completed') || line.includes('completed') || line.includes('✓') || line.includes('✔')) {
      // Mark oldest running agent as done
      for (const [id, agent] of activeAgents) {
        if (agent.status === 'running') {
          agent.status = 'done';
          // Remove after 10 seconds
          setTimeout(() => { activeAgents.delete(id); sendAgentUpdate(); }, 10000);
          break;
        }
      }
      sendAgentUpdate();
    }

    // Detect thinking/processing: "Thinking..." "Whirring..." "Razzle-dazzling..."
    const thinkMatch = line.match(/[✳⏺]\s+(.+?)(?:\s*\(thought for.*\))?$/);
    if (thinkMatch && !line.includes('Entered plan mode')) {
      const entries = [...activeAgents.entries()];
      if (entries.length > 0) {
        const [lastId, lastAgent] = entries[entries.length - 1];
        lastAgent.description = thinkMatch[1].slice(0, 80);
        sendAgentUpdate();
      }
    }

    // Detect plan mode
    if (line.includes('Entered plan mode')) {
      const id = `agent-${++agentIdCounter}`;
      activeAgents.set(id, {
        name: 'Plan',
        description: 'Exploring and designing implementation',
        status: 'running',
        startTime: Date.now(),
        toolUses: 0,
        tokens: 0,
      });
      sendAgentUpdate();
    }

    // Detect when Claude prompt returns (indicates task done)
    if (line.match(/^[❯➜>$]\s/) && activeAgents.size > 0) {
      // Shell prompt returned — mark all agents as done
      for (const [id, agent] of activeAgents) {
        if (agent.status === 'running') {
          agent.status = 'done';
          setTimeout(() => { activeAgents.delete(id); sendAgentUpdate(); }, 10000);
        }
      }
      sendAgentUpdate();
    }
  }
}

function sendAgentUpdate() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const agents = [...activeAgents.values()].map(a => ({
    ...a,
    elapsed: Date.now() - a.startTime,
  }));
  mainWindow.webContents.send('claude-agents-update', agents);
}

// Expose agent data via IPC
ipcMain.handle('get-claude-agents', () => {
  return [...activeAgents.values()].map(a => ({
    ...a,
    elapsed: Date.now() - a.startTime,
  }));
});

app.on('ready', () => {
  if (!isDev) {
    startServer();
  }
  createWindow();
  startPty();
});

app.on('window-all-closed', () => {
  if (ptyProcess) ptyProcess.kill();
  if (serverProcess) serverProcess.kill();
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

app.on('before-quit', () => {
  if (ptyProcess) ptyProcess.kill();
  if (serverProcess) serverProcess.kill();
});
