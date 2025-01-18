export type Specs = {
	name: string;
	version: string;
	sshKeyName: string;
	instanceImage: string;
	lb: {
		name: string;
		config: LBConfig;
		machineType: string;
	};
	app: {
		name: string;
		config: AppConfig;
		machineType: string;
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

export type AppConfig = {
	port: string;
	image: string;
	replicas: number;
};
