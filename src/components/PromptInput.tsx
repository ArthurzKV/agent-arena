import { useState } from 'react';

interface Props {
  onFight: (task: string) => void;
  disabled: boolean;
}

export default function PromptInput({ onFight, disabled }: Props) {
  const [task, setTask] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task.trim() && !disabled) {
      onFight(task.trim());
    }
  };

  return (
    <form className="prompt-input" onSubmit={handleSubmit}>
      <input
        type="text"
        value={task}
        onChange={e => setTask(e.target.value)}
        placeholder="Enter a coding task... e.g. 'Write a debounce function in TypeScript'"
        disabled={disabled}
      />
      <button type="submit" disabled={disabled || !task.trim()} className="fight-btn">
        {disabled ? '⚔️ FIGHTING...' : '🥊 FIGHT!'}
      </button>
    </form>
  );
}
