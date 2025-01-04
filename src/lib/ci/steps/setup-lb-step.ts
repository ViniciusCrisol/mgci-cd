import { Specs } from "@src/lib/ci";
import { SetupLBCommandBuilder } from "@src/lib/ci/command-builders/setup-lb-command-builder";
import { Instance, InstanceStatus, MACHINE_TYPE_WEIGHT, MGCDAO } from "@src/lib/ci/mgc";
import { SSHFactory } from "@src/lib/ci/ssh";
import { ExecutionError, ValidationError } from "@src/lib/utils/errors";
import { infiniteLoop } from "@src/lib/utils/infinite-loop";

export class SetupLBStep {
	constructor(private readonly mgcDAO: MGCDAO, private readonly sshFactory: SSHFactory) {}

	public async execute(specs: Specs): Promise<void> {
		const lbInstance = await this.mgcDAO.getInstanceByName(specs.lb.name);
		if (lbInstance) {
			await this.update(specs, lbInstance);
		} else {
			await this.create(specs);
		}
	}

	private async update(specs: Specs, lbInstance: Instance): Promise<void> {
		if (specs.lb.machineType !== lbInstance.machineType) {
			// The machine type has already been validated in a previous module,
			// ensuring the map will always return a valid value. No additional
			// checks are necessary here.
			if ((MACHINE_TYPE_WEIGHT[specs.lb.machineType] || 0) < (MACHINE_TYPE_WEIGHT[lbInstance.machineType] || 0)) {
				throw new ValidationError(
					`Cannot downgrade machine type from ${lbInstance.machineType} to ${specs.lb.machineType}`,
				);
			}
			await this.mgcDAO.retypeInstance(lbInstance.id, specs.lb.machineType);
			await this.checkLBInstance(lbInstance.id);
		}
	}

	private async create(specs: Specs): Promise<Instance> {
		let lbInstance = await this.mgcDAO.createInstance(
			specs.lb.name,
			specs.lb.image,
			specs.lb.sshKeyName,
			specs.lb.machineType,
		);
		lbInstance = await this.checkLBInstance(lbInstance.id);
		await this.setupLBInstance(specs, lbInstance);
		return lbInstance;
	}

	private async checkLBInstance(id: string): Promise<Instance> {
		return await infiniteLoop(async () => {
			const lbInstance = await this.mgcDAO.getInstanceByID(id);
			if (lbInstance) {
				if (lbInstance.status === InstanceStatus.COMPLETED) {
					return lbInstance;
				}
				if (
					lbInstance.status === InstanceStatus.CREATING_ERROR ||
					lbInstance.status === InstanceStatus.CREATING_NETWORK_ERROR ||
					lbInstance.status === InstanceStatus.CREATING_ERROR_QUOTA ||
					lbInstance.status === InstanceStatus.CREATING_ERROR_QUOTA_RAM ||
					lbInstance.status === InstanceStatus.CREATING_ERROR_QUOTA_VCPU ||
					lbInstance.status === InstanceStatus.CREATING_ERROR_QUOTA_DISK ||
					lbInstance.status === InstanceStatus.CREATING_ERROR_QUOTA_INSTANCE ||
					lbInstance.status === InstanceStatus.CREATING_ERROR_QUOTA_FLOATING_IP
				) {
					throw new ExecutionError(`Load Balancer creation failed with status: ${lbInstance.status}`);
				}
				if (
					lbInstance.status === InstanceStatus.RETYPING_ERROR ||
					lbInstance.status === InstanceStatus.RETYPING_ERROR_QUOTA
				) {
					throw new ExecutionError(`Load Balancer retyping failed with status: ${lbInstance.status}`);
				}
			}
			throw new ExecutionError("Load Balancer not ready yet");
		});
	}

	private async setupLBInstance(specs: Specs, lbInstance: Instance): Promise<void> {
		const setupLBCommand = new SetupLBCommandBuilder(specs.lb.config).build();
		const sshClient = this.sshFactory.createSSHClient(lbInstance.network.privateIP, lbInstance.network.user);
		await infiniteLoop(async () => {
			await sshClient.run(setupLBCommand);
		});
	}
}
