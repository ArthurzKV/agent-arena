import React from 'react';
import { Box, Text } from 'ink';

export default function TitleBar({ status }: { status: string }) {
  return (
    <Box justifyContent="center" gap={1}>
      <Text bold color="blue">AGENT</Text>
      <Text bold color="red">ARENA</Text>
      <Text dimColor> — </Text>
      <Text color="yellow" bold>{status}</Text>
    </Box>
  );
}
