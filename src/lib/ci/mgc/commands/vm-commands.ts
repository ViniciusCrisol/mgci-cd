import mgcErrorHandler from "@src/lib/ci/mgc/mgc-error-handler";
import { CommandRunner } from "@src/lib/helpers/command-runner";

export type QueryInstanceResult = {
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
};

export type CreateInstanceResult = {
	id: string;
};

export class VMCommands {
	constructor(private readonly commandRunner: CommandRunner) {}

	@mgcErrorHandler("Failed to get instance")
	public async getInstance(id: string): Promise<QueryInstanceResult> {
		const result = await this.commandRunner.run([
			"virtual-machines",
			"instances",
			"get",
			`--id=${id}`,
			"--expand=image,machine-type,network",
		]);
		return JSON.parse(result) as QueryInstanceResult;
	}

	@mgcErrorHandler("Failed to list instances")
	public async listInstances(): Promise<QueryInstanceResult[]> {
		const result = await this.commandRunner.run([
			"virtual-machines",
			"instances",
			"list",
			"--control.limit=1000",
			"--expand=image,machine-type,network",
		]);
		const { instances } = JSON.parse(result);
		return instances as QueryInstanceResult[];
	}

	@mgcErrorHandler("Failed to create instance")
	public async createInstance(
		name: string,
		image: string,
		sshKeyName: string,
		machineType: string,
	): Promise<CreateInstanceResult> {
		const result = await this.commandRunner.run([
			"virtual-machines",
			"instances",
			"create",
			`--name=${name}`,
			`--image.name=${image}`,
			`--ssh-key-name=${sshKeyName}`,
			`--machine-type.name=${machineType}`,
		]);
		return JSON.parse(result) as CreateInstanceResult;
	}

	@mgcErrorHandler("Failed to resize instance")
	public async resizeInstance(id: string, machineType: string): Promise<void> {
		await this.commandRunner.run([
			"virtual-machines",
			"instances",
			"retype",
			`--id=${id}`,
			`--machine-type.name=${machineType}`,
		]);
	}
}
