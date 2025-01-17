export type Specs = {
	image: string;
	sshKeyName: string;
	lb: {
		name: string;
		machineType: string;
		config: LBConfig;
	};
	instances: {
		name: string;
		machineType: string;
		config: InstanceConfig;
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

export type InstanceConfig = {
	replicas: number;
};
