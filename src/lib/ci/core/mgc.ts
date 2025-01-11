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

export const MACHINE_TYPE: {
	[key: string]: {
		name: string;
		weight: number;
	};
} = {
	BV1_2_10: { name: "BV1-2-10", weight: 1 },
	BV1_2_40: { name: "BV1-2-40", weight: 2 },
	BV1_2_100: { name: "BV1-2-100", weight: 3 },
	BV1_2_150: { name: "BV1-2-150", weight: 4 },
	BV2_4_20: { name: "BV2-4-20", weight: 5 },
	BV2_4_40: { name: "BV2-4-40", weight: 6 },
	BV2_4_100: { name: "BV2-4-100", weight: 7 },
	BV2_4_150: { name: "BV2-4-150", weight: 8 },
	BV2_8_10: { name: "BV2-8-10", weight: 9 },
	BV2_8_100: { name: "BV2-8-100", weight: 10 },
	BV4_8_20: { name: "BV4-8-20", weight: 11 },
	BV4_16_10: { name: "BV4-16-10", weight: 12 },
	BV4_16_20: { name: "BV4-16-20", weight: 13 },
	BV8_16_10: { name: "BV8-16-10", weight: 14 },
	BV8_16_40: { name: "BV8-16-40", weight: 15 },
	BV8_32_20: { name: "BV8-32-20", weight: 16 },
	BV8_32_40: { name: "BV8-32-40", weight: 17 },
};
