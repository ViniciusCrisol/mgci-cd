import { Instance, MGC } from "@src/lib/ci/mgc";
import { NotFoundError } from "@src/lib/errors";

export interface IMGCDAO {
	createInstance(name: string, image: string, sshKeyName: string, machineType: string): Promise<CreateInstanceResult>;
	getInstanceByID(id: string): Promise<Instance | undefined>;
	getInstanceByName(name: string): Promise<Instance | undefined>;
	retypeInstance(id: string, machineType: string): Promise<void>;
}

export interface CreateInstanceResult {
	id: string;
}

export class MGCDAO implements IMGCDAO {
	constructor(private readonly mgc: MGC, private readonly instanceUser: string) {}

	public async createInstance(
		name: string,
		image: string,
		sshKeyName: string,
		machineType: string,
	): Promise<CreateInstanceResult> {
		const result = await this.mgc.vm.createInstance(name, image, sshKeyName, machineType);
		return {
			id: result.id,
		};
	}

	public async getInstanceByID(id: string): Promise<Instance | undefined> {
		try {
			const result = await this.mgc.vm.getInstance(id);
			return {
				id: result.id,
				name: result.name,
				status: result.status,
				machineType: result.machine_type.name,
				network: {
					user: this.instanceUser,
					publicIP: result.network.ports[0]?.ipAddresses.publicIpAddress || "",
					privateIP: result.network.ports[0]?.ipAddresses.privateIpAddress || "",
				},
			};
		} catch (error) {
			if (error instanceof NotFoundError) {
				return;
			}
			throw error;
		}
	}

	public async getInstanceByName(name: string): Promise<Instance | undefined> {
		const results = await this.mgc.vm.listInstances();
		for (const result of results) {
			if (result.name === name) {
				return {
					id: result.id,
					name: result.name,
					status: result.status,
					machineType: result.machine_type.name,
					network: {
						user: this.instanceUser,
						publicIP: result.network.ports[0]?.ipAddresses.publicIpAddress || "",
						privateIP: result.network.ports[0]?.ipAddresses.privateIpAddress || "",
					},
				};
			}
		}
		return;
	}

	public async retypeInstance(id: string, machineType: string): Promise<void> {
		await this.mgc.vm.resizeInstance(id, machineType);
	}
}
