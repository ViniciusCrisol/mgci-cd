import { LBConfig } from "@src/lib/ci";
import { readFileSync } from "fs";
import { join } from "path";

const updateLBCommandPath = join(__dirname, "commands", "update-lb-command.sh");

export class UpdateLBCommandBuilder {
	constructor(private readonly lbConfig: LBConfig) {}

	public build() {
		const updateLBCommand = readFileSync(updateLBCommandPath, "utf-8");
		return `bash -c -e '\n${updateLBCommand
			.replace(/{{ips}}/g, this.getFormattedIPs())
			.replace(/{{config_file}}/g, this.lbConfig.file)
			.replace(/{{config_json}}/g, this.getFormattedConfigs())}'`;
	}

	private getFormattedIPs(): string {
		return this.lbConfig.replicaIPs.map((ip) => `    server ${ip};`).join("\n");
	}

	private getFormattedConfigs(): string {
		return JSON.stringify(this.lbConfig, null, 4);
	}
}
