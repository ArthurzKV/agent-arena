import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  isActive: boolean;
}

export default function Octagon({ children, isActive }: Props) {
  return (
    <div className={`octagon-wrapper ${isActive ? 'fighting' : ''}`}>
      <div className="octagon-border" />
      <div className="octagon-content">
        {children}
      </div>
    </div>
  );
}
