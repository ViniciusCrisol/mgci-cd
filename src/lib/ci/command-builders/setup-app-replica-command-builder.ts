import { AppConfig } from "@src/lib/ci";
import { readFileSync } from "fs";
import { join } from "path";

const setupAppReplicaCommandPath = join(__dirname, "commands", "setup-app-replica-command.sh");

export class SetupAppReplicaCommandBuilder {
	constructor(private readonly appConfig: AppConfig) {}

	public build() {
		const setupAppCommand = readFileSync(setupAppReplicaCommandPath, "utf-8");
		return `bash -c -e '\n${setupAppCommand
			.replace(/{{port}}/g, this.appConfig.port)
			.replace(/{{image}}/g, this.appConfig.image)}'`;
	}
}
