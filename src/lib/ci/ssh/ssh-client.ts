import { ExecutionError, NetworkError } from "@src/lib/errors";
import { Client } from "ssh2";

export interface ISSHClient {
	run(command: string): Promise<string>;
}

export class SSHClient implements ISSHClient {
	constructor(
		private readonly port: number,
		private readonly host: string,
		private readonly user: string,
		private readonly privateKey: string,
	) {}

	public async run(command: string): Promise<string> {
		const client = new Client();
		try {
			// The method initializes a new Client instance from the ssh2 library and attempts to connect to the
			// remote server using the provided connection parameters. This connection process is wrapped in this
			// promise that resolves when the connection is successfully established and rejects if an error occurs.
			await new Promise<void>((resolve, reject) => {
				client.on("ready", resolve).on("error", reject).connect({
					port: this.port,
					host: this.host,
					username: this.user,
					privateKey: this.privateKey,
				});
			});
			return await new Promise<string>((resolve, reject) => {
				// Once connected, the method executes the provided command using the client.exec method.
				// The command execution is also wrapped in a promise. If an error occurs during command
				// execution, the promise is rejected with an ExecutionError.
				client.exec(command, (error, stream) => {
					if (error) {
						return reject(new ExecutionError(`Failed to execute command: ${error.message}`));
					}
					let stdout = "";
					let stderr = "";
					// The command's standard output and error streams are captured and concatenated into
					// stdout and stderr strings, respectively. When the command execution completes, the
					// client connection is closed, and the promise resolves with the command's output if
					// the execution was successful. If the command exits with a non-zero code, the
					// promise is rejected with an ExecutionError containing the error details.
					stream
						.on("close", (code: number) => {
							client.end();
							if (code !== 0) {
								return reject(
									new ExecutionError(`Command exited with code ${code}. Error output: ${stderr}`),
								);
							}
							resolve(stdout);
						})
						.on("data", (data: Buffer) => {
							stdout += data.toString();
						})
						.stderr.on("data", (data: Buffer) => {
							stderr += data.toString();
						});
				});
			});
		} catch (error) {
			client.end();
			if (error instanceof NetworkError || error instanceof ExecutionError) {
				throw error;
			}
			if (error instanceof Error) {
				throw new NetworkError(
					`Error connecting to ${this.host}:${this.port} as ${this.user}: ${error.message}`,
				);
			} else {
				throw new NetworkError(
					`Error connecting to ${this.host}:${this.port} as ${this.user}: ${String(error)}`,
				);
			}
		}
	}
}
