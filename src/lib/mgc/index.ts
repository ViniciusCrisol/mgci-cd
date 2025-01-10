import { CommandRunner } from "@src/lib/helpers/command-runner";
import { join } from "path";

const cliPath = join(__dirname, "embedded-cli", "linux_amd64@v0.31.0");

export default function init(key: string) {
	const runner = new CommandRunner(
		cliPath,
		["--raw", "--no-confirm", `--api-key=${key}`, "--output=json=compact"],
		(stdout) =>
			stdout
				.replace(/[\u2580-\u259F]/g, "") // Remove block characters
				.replace(/\x1b\[[0-9;]*m/g, "") // Remove ANSI scape codes
				.replace(/\(\ds\)/g, "") // Remove time indicators
				.trim(),
	);
	return {};
}
