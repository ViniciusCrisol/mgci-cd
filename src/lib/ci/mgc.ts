export const MACHINE_TYPE_WEIGHT: { [key: string]: number } = {
	BV1_2_10: 1,
	BV1_2_40: 2,
	BV1_2_100: 3,
	BV1_2_150: 4,
	BV2_4_20: 5,
	BV2_4_40: 6,
	BV2_4_100: 7,
	BV2_4_150: 8,
	BV2_8_10: 9,
	BV2_8_100: 10,
	BV4_8_20: 11,
	BV4_16_10: 12,
	BV4_16_20: 13,
	BV8_16_10: 14,
	BV8_16_40: 15,
	BV8_32_20: 16,
	BV8_32_40: 17,
};

export type Instance = {
	id: string;
	name: string;
	status: string;
	machineType: string;
	network: {
		user: string;
		publicIP: string;
		privateIP: string;
	};
};

export enum InstanceStatus {
	COMPLETED = "completed",
	CREATING_ERROR = "creating_error",
	CREATING_NETWORK_ERROR = "creating_network_error",
	CREATING_ERROR_QUOTA = "creating_error_quota",
	CREATING_ERROR_QUOTA_RAM = "creating_error_quota_ram",
	CREATING_ERROR_QUOTA_VCPU = "creating_error_quota_vcpu",
	CREATING_ERROR_QUOTA_DISK = "creating_error_quota_disk",
	CREATING_ERROR_QUOTA_INSTANCE = "creating_error_quota_instance",
	CREATING_ERROR_QUOTA_FLOATING_IP = "creating_error_quota_floating_ip",
	RETYPING_ERROR = "retyping_error",
	RETYPING_ERROR_QUOTA = "retyping_error_quota",
}

export interface MGCDAO {
	createInstance(name: string, image: string, sshKeyName: string, machineType: string): Promise<Instance>;
	getInstanceByID(id: string): Promise<Instance | undefined>;
	getInstanceByName(name: string): Promise<Instance | undefined>;
	retypeInstance(id: string, machineType: string): Promise<void>;
}
