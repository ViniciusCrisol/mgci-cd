import { SSHClient } from "./ssh-client";

export class SSHFactory {
	constructor(private readonly port: number, private readonly privateKey: string) {}

	public createSSHClient(host: string, username: string): SSHClient {
		return new SSHClient(this.port, host, username, this.privateKey);
	}
}
