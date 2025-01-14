import { Instance, MGC } from "@src/lib/ci/mgc";
import { QueryInstanceResult } from "@src/lib/ci/mgc/commands/vm-commands";
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
		// TODO: Add logging here. The logging system should
		// be implemented within the infrastructure components.
		const result = await this.mgc.vm.createInstance(name, image, sshKeyName, machineType);
		return {
			id: result.id,
		};
	}

	public async getInstanceByID(id: string): Promise<Instance | undefined> {
		// TODO: Add logging here. The logging system should
		// be implemented within the infrastructure components.
		try {
			return this.mapInstance(await this.mgc.vm.getInstance(id));
		} catch (error) {
			if (error instanceof NotFoundError) {
				return;
			}
			throw error;
		}
	}

	public async getInstanceByName(name: string): Promise<Instance | undefined> {
		// TODO: Implement a pagination system here.

		// TODO: Add logging here. The logging system should
		// be implemented within the infrastructure components.

		// Currently, it is not possible to search by name
		// directly, hence iterating through all instances.
		const results = await this.mgc.vm.listInstances();
		for (const result of results) {
			if (result.name === name) {
				return this.mapInstance(result);
			}
		}
		return;
	}

	public async retypeInstance(id: string, machineType: string): Promise<void> {
		// TODO: Add logging here. The logging system should
		// be implemented within the infrastructure components.
		await this.mgc.vm.retypeInstance(id, machineType);
	}

	private mapInstance(result: QueryInstanceResult): Instance {
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
