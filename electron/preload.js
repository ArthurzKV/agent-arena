const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Terminal
  sendTerminalInput: (data) => ipcRenderer.send('terminal-input', data),
  sendTerminalResize: (cols, rows) => ipcRenderer.send('terminal-resize', { cols, rows }),
  onTerminalData: (callback) => {
    ipcRenderer.on('terminal-data', (_event, data) => callback(data));
  },
  removeTerminalListeners: () => {
    ipcRenderer.removeAllListeners('terminal-data');
  },
  // File explorer
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  getHomeDir: () => ipcRenderer.invoke('get-home-dir'),
  // Terminal cwd sync
  changeTerminalCwd: (dirPath) => ipcRenderer.send('change-terminal-cwd', dirPath),
  // Fight notifications
  onFightTriggered: (callback) => {
    ipcRenderer.on('fight-triggered', (_event, data) => callback(data));
  },
  onFightGathering: (callback) => {
    ipcRenderer.on('fight-gathering', (_event, data) => callback(data));
  },
  onFightGatheringProgress: (callback) => {
    ipcRenderer.on('fight-gathering-progress', (_event, data) => callback(data));
  },
  forceTriggerFight: () => ipcRenderer.send('force-trigger-fight'),
  cancelFight: () => ipcRenderer.send('cancel-fight'),
  applyFightSolution: (output, task) => ipcRenderer.send('apply-fight-solution', { output, task }),
  onFightSkipped: (callback) => {
    ipcRenderer.on('fight-skipped', (_event, data) => callback(data));
  },
  onFightCancelled: (callback) => {
    ipcRenderer.on('fight-cancelled', () => callback());
  },
  removeFightListeners: () => {
    ipcRenderer.removeAllListeners('fight-triggered');
    ipcRenderer.removeAllListeners('fight-gathering');
    ipcRenderer.removeAllListeners('fight-gathering-progress');
    ipcRenderer.removeAllListeners('fight-skipped');
    ipcRenderer.removeAllListeners('fight-cancelled');
  },
  // Model selection
  setArenaModel: (model) => ipcRenderer.send('set-arena-model', model),
  getArenaModel: () => ipcRenderer.invoke('get-arena-model'),
  // Claude agent tracking
  onClaudeAgentsUpdate: (callback) => {
    ipcRenderer.on('claude-agents-update', (_event, agents) => callback(agents));
  },
  removeClaudeAgentsListeners: () => {
    ipcRenderer.removeAllListeners('claude-agents-update');
  },
  getClaudeAgents: () => ipcRenderer.invoke('get-claude-agents'),
});
