import React from 'react';
import { render } from 'ink';
import App from './App.js';

const task = process.argv.slice(2).join(' ').trim();

// Render the interactive TUI app
// With task arg: jumps straight to fight screen
// Without: shows home screen with input prompt
const { waitUntilExit } = render(
  <App initialTask={task || undefined} />,
  {
    patchConsole: true,
    exitOnCtrlC: true,
  }
);

await waitUntilExit();
