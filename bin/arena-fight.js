#!/usr/bin/env node

// Quick CLI to trigger a fight from the terminal
// Usage: arena-fight "implement binary search in Python"

const task = process.argv.slice(2).join(' ');

if (!task) {
  console.log('Usage: arena-fight "your coding task here"');
  process.exit(1);
}

const PORT = process.env.ARENA_PORT || 4242;

fetch(`http://localhost:${PORT}/api/fight`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ task }),
})
  .then(r => r.json())
  .then(data => {
    console.log(`⚔️  Fight started: ${data.fightId}`);
    console.log(`   Task: ${task}`);
    console.log(`   Watch it in the Arena!`);
  })
  .catch(() => {
    console.error('Failed to connect to Arena server. Is it running?');
    process.exit(1);
  });
