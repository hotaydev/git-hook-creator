#!/usr/bin/env node
import { log } from "@clack/prompts";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import MainCli from "./cli";
import open from "./utils/open_url";

const yargsParameters = hideBin(process.argv);

yargs(yargsParameters)
	.scriptName("create-hook")
	.usage("Usage: $0 <command> [options]")
	.wrap(yargs(yargsParameters).terminalWidth())
	.command(
		"changelog",
		"Open the tool changelog",
		() => {},
		() => {
			log.success(
				"Changelog URL: https://github.com/hotaydev/git-hook-creator/releases",
			);
			open("https://github.com/hotaydev/git-hook-creator/releases");
		},
	)
	.command(
		"*",
		"Create a new git hook",
		() => {},
		() => {
			new MainCli().prompt();
		},
	)
	.help()
	.version()
	.alias("h", "help")
	.alias("v", "version")
	.parse();
