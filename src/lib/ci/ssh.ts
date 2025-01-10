export interface SSHClient {
	run(command: string): Promise<string>;
}

export interface SSHFactory {
	createSSHClient(ip: string, user: string): SSHClient;
}
