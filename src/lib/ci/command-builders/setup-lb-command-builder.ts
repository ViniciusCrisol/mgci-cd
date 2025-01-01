import { readFileSync } from "fs";
import { join } from "path";

const setupLBCommandPath = join(__dirname, "commands", "setup-lb-command.sh");

export class SetupLBCommandBuilder {
	constructor(private readonly defaultRolloutSize: number, private readonly defaultRolloutInterval: number) {}

	build() {
		const setupLBCommand = readFileSync(setupLBCommandPath, "utf-8");
		return `bash -c -e '\n${setupLBCommand
			.replace(/{{default_rollout_size}}/g, this.defaultRolloutSize.toString())
			.replace(/{{default_rollout_interval}}/g, this.defaultRolloutInterval.toString())}'`;
	}
}
