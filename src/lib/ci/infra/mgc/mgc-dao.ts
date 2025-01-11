import { IMGCDAO } from "@src/lib/ci/core";
import { Instance } from "@src/lib/ci/core/mgc";
import { MGC } from "@src/lib/ci/infra/mgc";
import { QueryInstanceResult } from "@src/lib/ci/infra/mgc/commands/vm-commands";
import { NotFoundError } from "@src/lib/errors";

export class MGCDAO implements IMGCDAO {
	constructor(private readonly mgc: MGC, private readonly instanceUser: string) {}

	public async createInstance(name: string, image: string, sshKeyName: string, machineType: string): Promise<string> {
		const { id } = await this.mgc.vm.createInstance(name, image, sshKeyName, machineType);
		return id;
	}

	public async getInstanceByID(id: string): Promise<Instance | undefined> {
		try {
			const instance = await this.mgc.vm.getInstance(id);
			return this.mapInstance(instance);
		} catch (error) {
			if (error instanceof NotFoundError) {
				return undefined;
			}
			throw error;
		}
	}

	public async getInstanceByName(name: string): Promise<Instance | undefined> {
		const instances = await this.mgc.vm.listInstances();
		for (const instance of instances) {
			if (instance.name === name) {
				return this.mapInstance(instance);
			}
		}
		return undefined;
	}

	public async retypeInstance(_id: string, _machineType: string): Promise<void> {
		throw new Error("Method not implemented.");
	}

	private mapInstance(instance: QueryInstanceResult): Instance {
		return {
			id: instance.id,
			name: instance.name,
			status: instance.status,
			machineType: instance.machine_type.name,
			network: {
				user: this.instanceUser,
				publicIP: instance.network.ports[0]?.ipAddresses.publicIpAddress || "",
				privateIP: instance.network.ports[0]?.ipAddresses.privateIpAddress || "",
			},
		};
	}
}
