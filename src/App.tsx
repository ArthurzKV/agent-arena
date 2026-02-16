import { useRef, useCallback, useState } from 'react';
import Sidebar from './components/Sidebar';
import Arena from './pages/Arena';
import Terminal from './components/Terminal';
import AgentPanel from './components/AgentPanel';

function ResizeHandle({ direction, onResize }: { direction: 'col' | 'row'; onResize: (delta: number) => void }) {
  const dragging = useRef(false);
  const last = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    last.current = direction === 'col' ? e.clientX : e.clientY;

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const current = direction === 'col' ? e.clientX : e.clientY;
      const delta = current - last.current;
      last.current = current;
      onResize(delta);
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = direction === 'col' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [direction, onResize]);

  return (
    <div
      className={`resize-handle ${direction}`}
      onMouseDown={onMouseDown}
    />
  );
}

export default function App() {
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [terminalWidth, setTerminalWidth] = useState(420);
  const [agentPanelHeight, setAgentPanelHeight] = useState(200);

  const resizeSidebar = useCallback((delta: number) => {
    setSidebarWidth(w => Math.max(140, Math.min(500, w + delta)));
  }, []);

  const resizeTerminal = useCallback((delta: number) => {
    setTerminalWidth(w => Math.max(250, Math.min(800, w - delta)));
  }, []);

  const resizeAgentPanel = useCallback((delta: number) => {
    setAgentPanelHeight(h => Math.max(100, Math.min(500, h - delta)));
  }, []);

  return (
    <div className="app-layout">
      <div className="titlebar-drag" />
      <div className="app-panels">
        <div className="sidebar-container" style={{ width: sidebarWidth }}>
          <Sidebar />
        </div>
        <ResizeHandle direction="col" onResize={resizeSidebar} />
        <div className="center-panel">
          <div className="center-top">
            <Arena />
          </div>
          <ResizeHandle direction="row" onResize={resizeAgentPanel} />
          <div className="center-bottom" style={{ height: agentPanelHeight }}>
            <AgentPanel />
          </div>
        </div>
        <ResizeHandle direction="col" onResize={resizeTerminal} />
        <div className="right-panel" style={{ width: terminalWidth }}>
          <div className="right-panel-header">
            <span className="panel-tab active">TERMINAL</span>
          </div>
          <div className="right-panel-content">
            <Terminal />
          </div>
        </div>
      </div>
      <div className="status-bar">
        <span className="status-item">Agent Arena v0.1.0</span>
        <span className="status-item">Claude Code</span>
      </div>
    </div>
  );
}
