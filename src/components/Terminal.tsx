import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

const theme = {
  background: '#0d1117',
  foreground: '#e0e0e0',
  cursor: '#e63946',
  selectionBackground: 'rgba(230, 57, 70, 0.3)',
  black: '#0a0a0a',
  red: '#e63946',
  green: '#2ecc71',
  yellow: '#ffd700',
  blue: '#3498db',
  magenta: '#9b59b6',
  cyan: '#1abc9c',
  white: '#e0e0e0',
};

export default function Terminal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);

  useEffect(() => {
    if (!containerRef.current || !window.electronAPI) return;

    const term = new XTerm({
      theme,
      fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
      fontSize: 13,
      lineHeight: 1.3,
      cursorBlink: true,
      cursorStyle: 'bar',
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();
    termRef.current = term;

    // Send input to node-pty via IPC
    term.onData((data) => {
      window.electronAPI!.sendTerminalInput(data);
    });

    // Receive output from node-pty
    window.electronAPI.onTerminalData((data) => {
      term.write(data);
    });

    // Resize handling
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
      window.electronAPI!.sendTerminalResize(term.cols, term.rows);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      window.electronAPI?.removeTerminalListeners();
      term.dispose();
    };
  }, []);

  if (!window.electronAPI) {
    return (
      <div className="terminal-fallback">
        <div className="terminal-fallback-text">
          Terminal available in desktop app
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="terminal-container" />;
}
