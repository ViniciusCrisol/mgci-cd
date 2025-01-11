import { VMCommands } from "@src/lib/ci/infra/mgc/commands/vm-commands";
import { CommandRunner } from "@src/lib/helpers/command-runner";
import { join } from "path";

const cliPath = join(__dirname, "embedded-cli", "linux_amd64@v0_31_0.elf");

export function init(key: string) {
	const commandRunner = new CommandRunner(
		cliPath,
		["--raw", "--no-confirm", `--api-key=${key}`, "--output=json=compact"],
		(stdout) =>
			stdout
				.replace(/[\u2580-\u259F]/g, "") // Remove block characters
				.replace(/\x1b\[[0-9;]*m/g, "") // Remove ANSI scape codes
				.replace(/\(\ds\)/g, "") // Remove time indicators
				.trim(),
	);
	return {
		vm: new VMCommands(commandRunner),
	};
}
