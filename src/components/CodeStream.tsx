import { useEffect, useRef } from 'react';

interface Props {
  output: string;
  label: string;
  isActive: boolean;
}

export default function CodeStream({ output, label, isActive }: Props) {
  const containerRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className={`code-stream ${isActive ? 'active' : ''}`}>
      <div className="code-stream-header">{label}</div>
      <pre ref={containerRef} className="code-stream-content">
        {output || (isActive ? '⏳ Waiting for output...' : '')}
        {isActive && output && <span className="cursor">▌</span>}
      </pre>
    </div>
  );
}
