import { cancel, isCancel } from "@clack/prompts";

export default function handleCancel(
	prompt: boolean | symbol | string | string[],
) {
	if (isCancel(prompt)) {
		cancel('Operation cancelled. For help run "create-hook --help"');
		process.exit(0);
	}
}
