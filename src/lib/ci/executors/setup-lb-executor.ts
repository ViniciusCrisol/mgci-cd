import { Specs } from "@src/lib/ci";
import { checkupInstance } from "@src/lib/ci/checkup-instance";
import { SetupLBCommandBuilder } from "@src/lib/ci/command-builders/setup-lb-command-builder";
import { Instance, MACHINE_TYPE } from "@src/lib/ci/mgc";
import { IMGCDAO } from "@src/lib/ci/mgc/mgc-dao";
import { ISSHFactory } from "@src/lib/ci/ssh/ssh-factory";
import { ValidationError } from "@src/lib/errors";
import { infiniteLoop } from "@src/lib/helpers/infinite-loop";

export class SetupLBExecutor {
	constructor(private readonly mgcDAO: IMGCDAO, private readonly sshFactory: ISSHFactory) {}

	public async execute(specs: Specs): Promise<void> {
		const lbInstance = await this.mgcDAO.getInstanceByName(specs.lb.name);
		if (lbInstance) {
			await this.update(specs, lbInstance);
		} else {
			await this.create(specs);
		}
	}

	private async update(specs: Specs, lbInstance: Instance): Promise<void> {
		// The machine type has already been validated in a previous module,
		// ensuring the map will always return a valid value. No additional
		// checks are necessary here.
		if (
			specs.lb.machineType !== lbInstance.machineType &&
			MACHINE_TYPE[lbInstance.machineType] &&
			MACHINE_TYPE[specs.lb.machineType]
		) {
			if ((MACHINE_TYPE[specs.lb.machineType]?.disk ?? 0) < (MACHINE_TYPE[lbInstance.machineType]?.disk ?? 0)) {
				throw new ValidationError(
					`Cannot downgrade machine type from ${lbInstance.machineType} to ${specs.lb.machineType}`,
				);
			}
			await this.mgcDAO.retypeInstance(lbInstance.id, specs.lb.machineType);
			// TODO: It may not be necessary to run checkupInstance because
			// if the retype does not affect the instance, the change will
			// be transparent. We need to check on it.
			await checkupInstance(lbInstance.id, this.mgcDAO);
		}
	}

	private async create(specs: Specs): Promise<void> {
		const { id: instanceID } = await this.mgcDAO.createInstance(
			specs.lb.name,
			specs.instanceImage,
			specs.sshKeyName,
			specs.lb.machineType,
		);
		const instance = await checkupInstance(instanceID, this.mgcDAO);
		const command = new SetupLBCommandBuilder(specs.lb.config).build();
		const sshClient = this.sshFactory.createSSHClient(instance.network.publicIP, instance.network.user);
		await infiniteLoop(async () => {
			await sshClient.run(command);
		});
		// The config is updated with the private IPs of the instances scheduled for rollout to avoid making
		// repeated queries. This creates shared state between executors, which can lead to potential issues.
		// For now, this trade-off is acceptable, but it should be revisited in the future.
		specs.lb.config.ips.push(instance.network.privateIP);
	}
}
