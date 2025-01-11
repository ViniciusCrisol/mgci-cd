import { Instance } from "@src/lib/ci/core/mgc";

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

export interface IMGCDAO {
	createInstance(name: string, image: string, sshKeyName: string, machineType: string): Promise<string>;
	getInstanceByID(id: string): Promise<Instance | undefined>;
	getInstanceByName(name: string): Promise<Instance | undefined>;
	retypeInstance(id: string, machineType: string): Promise<void>;
}

export interface ISSHClient {
	run(command: string): Promise<string>;
}

export interface ISSHFactory {
	createSSHClient(host: string, username: string): ISSHClient;
}
