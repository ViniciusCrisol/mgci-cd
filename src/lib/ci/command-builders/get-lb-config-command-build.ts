import config from "@src/config";
import { readFileSync } from "fs";
import { join } from "path";

const getLBConfigCommandPath = join(__dirname, "commands", "get-lb-config-command.sh");

export class GetLBConfigCommandBuilder {
	constructor() {}

	public build() {
		const getLBConfigCommand = readFileSync(getLBConfigCommandPath, "utf-8");
		// TODO: Verify if accessing the configuration from this point in the code is appropriate.
		return `bash -c -e '\n${getLBConfigCommand.replace(/{{config_file}}/g, config.lb.configFile)}'`;
	}
}
