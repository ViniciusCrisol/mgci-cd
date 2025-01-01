import { Specs } from "@src/lib/ci";
import { SetupLBCommandBuilder } from "@src/lib/ci/command-builders/setup-lb-command-builder";
import { Instance, InstanceStatus, MGCDAO } from "@src/lib/ci/mgc";
import { SSHFactory } from "@src/lib/ci/ssh";
import { ExecutionError } from "@src/lib/utils/errors";
import { infiniteLoop } from "@src/lib/utils/infinite-loop";

export class SetupLBStep {
	constructor(private readonly mgcDAO: MGCDAO, private readonly sshFactory: SSHFactory) {}

	async execute(specs: Specs): Promise<void> {
		const lbInstance = await this.mgcDAO.getInstanceByName(specs.lb.name);
		if (lbInstance) {
			await this.update(specs, lbInstance);
		} else {
			await this.create(specs);
		}
	}

	async update(specs: Specs, lbInstance: Instance): Promise<void> {}

	async create(specs: Specs): Promise<void> {
		const lbInstance = await this.createLBInstance(specs);
		await this.setupLBInstance(specs, lbInstance);
	}

	async createLBInstance(specs: Specs): Promise<Instance> {
		const { id } = await this.mgcDAO.createInstance(
			specs.lb.name,
			specs.lb.image,
			specs.lb.sshKeyName,
			specs.lb.machineType,
		);
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
			}
			throw new ExecutionError("Load Balancer not ready yet");
		});
	}

	async setupLBInstance(specs: Specs, lbInstance: Instance): Promise<void> {
		const setupLBCommandBuilder = new SetupLBCommandBuilder(specs.lb.rollout.size, specs.lb.rollout.interval);
		const setupLBCommand = setupLBCommandBuilder.build();
		const sshClient = this.sshFactory.createSSHClient(lbInstance.network.privateIP, lbInstance.network.user);
		await infiniteLoop(async () => {
			await sshClient.run(setupLBCommand);
		});
	}
}
