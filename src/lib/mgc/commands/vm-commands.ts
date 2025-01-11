import { CommandRunner } from "@src/lib/helpers/command-runner";
import { Instance } from "@src/lib/mgc";
import handleMGCCommandError from "@src/lib/mgc/handle-mgc-command-error";

interface QueryInstanceResult {
	id: string;
	name: string;
	state: string;
	status: string;
	ssh_key_name: string;
	availability_zone: string;
	image: {
		id: string;
		name: string;
		platform: string;
	};
	network: {
		vpc: {
			id: string;
			name: string;
		};
		ports: {
			id: string;
			name: string;
			ipAddresses: {
				ipV6Address: string;
				publicIpAddress: string;
				privateIpAddress: string;
			};
		}[];
	};
	machine_type: {
		id: string;
		name: string;
		ram: number;
		disk: number;
		vcpus: number;
	};
	created_at: string;
	updated_at: string;
}

interface CreateInstanceResult {
	id: string;
}

export class VMCommands {
	constructor(private readonly commandRunner: CommandRunner) {}

	@handleMGCCommandError("Failed to get instance")
	public async getInstance(id: string): Promise<Instance> {
		const result = await this.commandRunner.run([
			"virtual-machines",
			"instances",
			"get",
			`--id=${id}`,
			"--expand=image,machine-type,network",
		]);
		const instance: QueryInstanceResult = JSON.parse(result);
		return {
			id: instance.id,
			name: instance.name,
			status: instance.status,
			machineType: instance.machine_type.name,
			network: instance.network.ports[0] && {
				publicIP: instance.network.ports[0].ipAddresses.publicIpAddress,
				privateIP: instance.network.ports[0].ipAddresses.privateIpAddress,
			},
		};
	}

	@handleMGCCommandError("Failed to list instances")
	public async listInstances(): Promise<Instance[]> {
		const result = await this.commandRunner.run([
			"virtual-machines",
			"instances",
			"list",
			"--control.limit=1000",
			"--expand=image,machine-type,network",
		]);
		const { instances } = JSON.parse(result);
		return instances.map((instance: QueryInstanceResult) => ({
			id: instance.id,
			name: instance.name,
			status: instance.status,
			machineType: instance.machine_type.name,
			network: instance.network.ports[0] && {
				publicIP: instance.network.ports[0].ipAddresses.publicIpAddress,
				privateIP: instance.network.ports[0].ipAddresses.privateIpAddress,
			},
		}));
	}

	@handleMGCCommandError("Failed to create instance")
	public async createInstance(name: string, image: string, sshKeyName: string, machineType: string): Promise<string> {
		const result = await this.commandRunner.run([
			"virtual-machines",
			"instances",
			"create",
			`--name=${name}`,
			`--image.name=${image}`,
			`--ssh-key-name=${sshKeyName}`,
			`--machine-type.name=${machineType}`,
		]);
		const instance: CreateInstanceResult = JSON.parse(result);
		return instance.id;
	}
}
