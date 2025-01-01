import { readFileSync } from "fs";
import { join } from "path";

const setupLBCommandPath = join(__dirname, "commands", "setup-lb-command.sh");

export class SetupLBCommandBuilder {
	constructor(private readonly rolloutSize: number, private readonly rolloutInterval: number) {}

	build() {
		const setupLBCommand = readFileSync(setupLBCommandPath, "utf-8");
		return `bash -c -e '\n${setupLBCommand
			.replace(/{{rollout_size}}/g, this.rolloutSize.toString())
			.replace(/{{rollout_interval}}/g, this.rolloutInterval.toString())}'`;
	}
}
