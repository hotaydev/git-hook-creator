import { isCancel, cancel } from '@clack/prompts';

export default function handleCancel(prompt: any) {
  if (isCancel(prompt)) {
    cancel('Operation cancelled. For help run "create-hook --help"');
    process.exit(0);
  }
}