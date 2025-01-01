export type Specs = {
	lb: {
		name: string;
		image: string;
		sshKeyName: string;
		machineType: string;
		rollout: {
			size: number;
			interval: number;
		};
	};
};

export class CI {
	constructor(private message: string) {}

	public async execute(): Promise<string> {
		return this.message;
	}
}
