import { spawn } from 'node:child_process';

const openCommands = (): { command: string | undefined, args: string[] } => {
  const { platform } = process;
  switch (platform) {
  case 'linux':
    return {
      command: 'xdg-open',
      args: []
    };
  case 'darwin':
    return {
      command: 'open',
      args: []
    };
  case 'win32':
    return {
      command: 'cmd',
      args: ['/c', 'start']
    };
  default:
    return {
      command: undefined,
      args: []
    };
  }
};

export default function open(url: string): void {
  const { command, args } = openCommands();
  if (command) spawn(command, [...args, encodeURI(url)]);
}