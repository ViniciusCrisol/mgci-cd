import { ExecutionError } from "@src/lib/errors";
import { execFile } from "child_process";

export class CommandRunner {
	constructor(
		private readonly cliPath: string,
		private readonly globalArgs: string[],
		private readonly postProcessor: (result: string) => string,
	) {}

	public async run(commandArgs: string[]): Promise<string> {
		return new Promise((resolve, reject) => {
			execFile(this.cliPath, [...commandArgs, ...this.globalArgs], (error, stdout, stderr) => {
				// Do not customize error messages here. The stderr output might
				// be used by the caller to handle specific business logic errors.
				if (error) {
					return reject(new ExecutionError(error.message));
				}
				if (stderr) {
					return reject(new ExecutionError(stderr));
				}
				resolve(this.postProcessor(stdout));
			});
		});
	}
}
