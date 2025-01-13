import { ISSHClient, SSHClient } from "@src/lib/ci/ssh/ssh-client";

export interface ISSHFactory {
	createSSHClient(host: string, username: string): ISSHClient;
}

export class SSHFactory implements ISSHFactory {
	constructor(private readonly port: number, private readonly privateKey: string) {}

	public createSSHClient(host: string, username: string): ISSHClient {
		return new SSHClient(this.port, host, username, this.privateKey);
	}
}
