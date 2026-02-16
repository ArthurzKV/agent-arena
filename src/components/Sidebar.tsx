import { useState, useCallback } from 'react';

interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
}

function FileIcon({ isDir, name }: { isDir: boolean; name: string }) {
  if (isDir) return <span className="file-icon dir">▸</span>;
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const iconMap: Record<string, string> = {
    ts: '⌞T⌝', tsx: '⌞T⌝', js: '⌞J⌝', jsx: '⌞J⌝',
    json: '{ }', css: '# ', html: '< >',
    md: '◆ ', py: '⌞P⌝', rs: '⌞R⌝',
    yml: '≡ ', yaml: '≡ ', toml: '≡ ',
    sh: '$ ', zsh: '$ ', bash: '$ ',
    png: '▣ ', jpg: '▣ ', svg: '▣ ', gif: '▣ ',
  };
  return <span className="file-icon file">{iconMap[ext] || '· '}</span>;
}

function DirNode({ entry, depth }: { entry: FileEntry; depth: number }) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<FileEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const toggle = async () => {
    if (!loaded && window.electronAPI) {
      const items = await window.electronAPI.readDirectory(entry.path);
      setChildren(items);
      setLoaded(true);
    }
    setExpanded(!expanded);
  };

  return (
    <>
      <div
        className={`file-entry ${expanded ? 'open' : ''}`}
        style={{ paddingLeft: `${12 + depth * 14}px` }}
        onClick={toggle}
      >
        <FileIcon isDir name={entry.name} />
        <span className="file-name">{entry.name}</span>
      </div>
      {expanded && children.map((child) =>
        child.isDir ? (
          <DirNode key={child.path} entry={child} depth={depth + 1} />
        ) : (
          <div
            key={child.path}
            className="file-entry"
            style={{ paddingLeft: `${12 + (depth + 1) * 14}px` }}
          >
            <FileIcon isDir={false} name={child.name} />
            <span className="file-name">{child.name}</span>
          </div>
        )
      )}
    </>
  );
}

export default function Sidebar() {
  const [rootPath, setRootPath] = useState<string>('');
  const [rootName, setRootName] = useState<string>('');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [expanded, setExpanded] = useState(true);

  const loadDir = useCallback(async (dirPath: string) => {
    if (!window.electronAPI) return;
    const items = await window.electronAPI.readDirectory(dirPath);
    setEntries(items);
    setRootPath(dirPath);
    setRootName(dirPath.split('/').pop() || dirPath);
    // Sync terminal cwd to the opened folder
    window.electronAPI.changeTerminalCwd(dirPath);
  }, []);

  const openFolder = async () => {
    if (!window.electronAPI) return;
    const path = await window.electronAPI.openFolderDialog();
    if (path) loadDir(path);
  };

  if (!window.electronAPI) {
    return (
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">
            <span>EXPLORER</span>
          </div>
        </div>
        <div className="no-fights-sidebar">Desktop app only</div>
      </div>
    );
  }

  if (!expanded) {
    return (
      <div className="sidebar collapsed" onClick={() => setExpanded(true)}>
        <div className="sidebar-toggle">›</div>
      </div>
    );
  }

  // No project open yet
  if (!rootPath) {
    return (
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">
            <span>EXPLORER</span>
          </div>
        </div>
        <div className="sidebar-empty">
          <div className="sidebar-empty-text">No folder open</div>
          <button className="sidebar-open-btn" onClick={openFolder}>
            Open Folder
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <span>EXPLORER</span>
        </div>
        <button className="sidebar-toggle" onClick={() => setExpanded(false)}>‹</button>
      </div>

      <div className="sidebar-section-header">
        <span className="sidebar-root-name" title={rootPath}>{rootName.toUpperCase()}</span>
        <button className="refresh-btn" onClick={openFolder} title="Open folder">+</button>
      </div>

      <div className="sidebar-files">
        {entries.map((entry) =>
          entry.isDir ? (
            <DirNode key={entry.path} entry={entry} depth={0} />
          ) : (
            <div key={entry.path} className="file-entry" style={{ paddingLeft: '12px' }}>
              <FileIcon isDir={false} name={entry.name} />
              <span className="file-name">{entry.name}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
