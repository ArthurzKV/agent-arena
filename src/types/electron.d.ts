export {};

declare global {
  interface Window {
    electronAPI?: {
      sendTerminalInput: (data: string) => void;
      sendTerminalResize: (cols: number, rows: number) => void;
      onTerminalData: (callback: (data: string) => void) => void;
      removeTerminalListeners: () => void;
      readDirectory: (dirPath: string) => Promise<{ name: string; path: string; isDir: boolean }[]>;
      openFolderDialog: () => Promise<string | null>;
      getHomeDir: () => Promise<string>;
      changeTerminalCwd: (dirPath: string) => void;
      onFightTriggered: (callback: (data: { fightId: string; task: string }) => void) => void;
      onFightGathering: (callback: (data: { task: string }) => void) => void;
      onFightGatheringProgress: (callback: (data: { task: string; contextLength: number; elapsed: number }) => void) => void;
      forceTriggerFight: () => void;
      cancelFight: () => void;
      applyFightSolution: (output: string, task: string) => void;
      removeFightListeners: () => void;
      onClaudeAgentsUpdate: (callback: (agents: any[]) => void) => void;
      removeClaudeAgentsListeners: () => void;
      getClaudeAgents: () => Promise<any[]>;
    };
  }
}
