import { CommandRunner } from "@src/lib/helpers/command-runner";
import { Instance } from "@src/lib/mgc";
import handleMGCCommandError from "@src/lib/mgc/handle-mgc-command-error";

interface MGCInstance {
	id: string;
	name: string;
	status: string;
	machine_type: {
		id: string;
		name: string;
	};
	network: {
		ports: {
			ipAddresses: {
				user: string;
				publicIpAddress: string;
				privateIpAddress: string;
			};
		}[];
	};
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
		const instance: MGCInstance = JSON.parse(result);
		return {
			id: instance.id,
			name: instance.name,
			status: instance.status,
			machineType: instance.machine_type.name,
			network: instance.network.ports[0] && {
				user: instance.network.ports[0].ipAddresses.user,
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
		const instances = JSON.parse(result);
		return instances.map(
			(instance: MGCInstance): Instance => ({
				id: instance.id,
				name: instance.name,
				status: instance.status,
				machineType: instance.machine_type.name,
				network: instance.network.ports[0] && {
					user: instance.network.ports[0].ipAddresses.user,
					publicIP: instance.network.ports[0].ipAddresses.publicIpAddress,
					privateIP: instance.network.ports[0].ipAddresses.privateIpAddress,
				},
			}),
		);
	}

	@handleMGCCommandError("Failed to create instance")
	public async createInstances(
		name: string,
		image: string,
		sshKeyName: string,
		machineType: string,
	): Promise<Instance> {
		const result = await this.commandRunner.run([
			"virtual-machines",
			"instances",
			"create",
			`--name=${name}`,
			`--image.name=${image}`,
			`--ssh-key-name=${sshKeyName}`,
			`--machine-type.name=${machineType}`,
		]);
		const instance: MGCInstance = JSON.parse(result);
		return {
			id: instance.id,
			name: instance.name,
			status: instance.status,
			machineType: instance.machine_type.name,
		};
	}
}
