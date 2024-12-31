export type Instance = {
	id: string;
	name: string;
	status: string;
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
}

export interface MGCDAO {
	createInstance(
		name: string,
		image: string,
		sshKeyName: string,
		machineType: string,
	): Promise<Instance>;
	getInstanceByID(id: string): Promise<Instance | undefined>;
	getInstanceByName(name: string): Promise<Instance | undefined>;
}
