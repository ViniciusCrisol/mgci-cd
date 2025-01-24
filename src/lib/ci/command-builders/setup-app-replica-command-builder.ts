import { AppConfig } from "@src/lib/ci";
import { readFileSync } from "fs";
import { join } from "path";

const setupDockerCommandPath = join(__dirname, "commands", "setup-docker-command.sh");
const setupAppReplicaCommandPath = join(__dirname, "commands", "setup-app-replica-command.sh");

export default class SetupAppReplicaCommandBuilder {
	constructor(private readonly appConfig: AppConfig) {}

	public build() {
		const setupDockerCommand = readFileSync(setupDockerCommandPath, "utf-8");
		const setupAppReplicaCommand = readFileSync(setupAppReplicaCommandPath, "utf-8");
		// TODO: Implement a remove comments algorithm.
		return `bash -c -e '\n${setupAppReplicaCommand
			.replace(/{{port}}/g, this.appConfig.port)
			.replace(/{{image}}/g, this.appConfig.image)
			.replace(/{{setup_docker_command}}/g, setupDockerCommand)}'`;
	}
}
