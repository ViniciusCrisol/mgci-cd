export type Specs = {
	lb: {
		name: string;
		image: string;
		sshKeyName: string;
		machineType: string;
		config: LBConfig;
	};
};

export type LBConfig = {
	ips: string[];
	file: string;
	rollout: {
		size: number;
		interval: number;
	};
};

export class CI {
	constructor(private readonly message: string) {}

	public async execute(): Promise<string> {
		return this.message;
	}
}
