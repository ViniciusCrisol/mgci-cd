import { ISSHFactory } from "@src/lib/ci/core";
import { SSHClient } from "@src/lib/ci/infra/ssh/ssh-client";

export class SSHFactory implements ISSHFactory {
	constructor(private readonly port: number, private readonly privateKey: string) {}

	public createSSHClient(host: string, username: string): SSHClient {
		return new SSHClient(this.port, host, username, this.privateKey);
	}
}
