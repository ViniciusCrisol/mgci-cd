import { Specs } from "@src/lib/ci";
import { SetupLBCommandBuilder } from "@src/lib/ci/command-builders/setup-lb-command-builder";
import { Instance, MACHINE_TYPE, MGCDAO, checkupInstance } from "@src/lib/ci/mgc";
import { SSHFactory } from "@src/lib/ci/ssh";
import { ValidationError } from "@src/lib/utils/errors";
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
			if (
				(MACHINE_TYPE[specs.lb.machineType]?.weight || 0) < (MACHINE_TYPE[lbInstance.machineType]?.weight || 0)
			) {
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
		let lbInstance = await this.mgcDAO.createInstance(
			specs.lb.name,
			specs.lb.image,
			specs.lb.sshKeyName,
			specs.lb.machineType,
		);
		// Override lbInstance with the result from checkupInstance to ensure
		// it reflects the latest state and values before proceeding with setup.
		lbInstance = await checkupInstance(lbInstance.id, this.mgcDAO);
		const command = new SetupLBCommandBuilder(specs.lb.config).build();
		const sshClient = this.sshFactory.createSSHClient(lbInstance.network.privateIP, lbInstance.network.user);
		await infiniteLoop(async () => {
			await sshClient.run(command);
		});
	}
}
