import { LBConfig } from "@src/lib/ci";
import { readFileSync } from "fs";
import { join } from "path";

const setupLBCommandPath = join(__dirname, "commands", "setup-lb-command.sh");

export class SetupLBCommandBuilder {
	constructor(private readonly lbConfig: LBConfig) {}

	public build() {
		const setupLBCommand = readFileSync(setupLBCommandPath, "utf-8");
		return `bash -c -e '\n${setupLBCommand
			.replace(/{{config_file}}/g, this.lbConfig.file)
			.replace(/{{config_json}}/g, JSON.stringify(this.lbConfig, null, 4))}'`;
	}
}
