import { execFile } from "child_process";

export class CommandRunner {
	constructor(
		private readonly cliPath: string,
		private readonly globalArgs: string[],
		private readonly postProcessor: (result: string) => string,
	) {}

	public async run(commandArgs: string[]): Promise<string> {
		const args = [...commandArgs, ...this.globalArgs];
		return new Promise((resolve, reject) => {
			execFile(this.cliPath, args, (error, stdout, stderr) => {
				if (error) return reject(error);
				if (stderr) return reject(stderr);
				resolve(this.postProcessor(stdout));
			});
		});
	}
}
