export interface SSHClient {
	run(command: string): Promise<string>;
}

export interface SSHFactory {
	createSSHClient(host: string, username: string): SSHClient;
}
