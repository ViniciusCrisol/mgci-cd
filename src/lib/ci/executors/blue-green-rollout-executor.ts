import { LBConfig, Specs } from "@src/lib/ci";
import { GetLBConfigCommandBuilder } from "@src/lib/ci/command-builders/get-lb-config-command-build";
import { UpdateLBCommandBuilder } from "@src/lib/ci/command-builders/update-lb-command-builder";
import { Instance } from "@src/lib/ci/mgc";
import { IMGCDAO } from "@src/lib/ci/mgc/mgc-dao";
import { ISSHFactory } from "@src/lib/ci/ssh/ssh-factory";
import { ExecutionError } from "@src/lib/errors";
import { timeout } from "@src/lib/helpers/timeout";

export class BlueGreenRolloutExecutor {
	constructor(private readonly mgcDAO: IMGCDAO, private readonly sshFactory: ISSHFactory) {}

	public async execute(specs: Specs): Promise<void> {
		const lbInstance = await this.mgcDAO.getInstanceByName(specs.lb.name);
		if (!lbInstance) {
			throw new ExecutionError(
				"LB instance not found. This might indicate a broken process. If confirmed, please open an issue to address it",
			);
		}
		const lbConfig = await this.getLBConfig(lbInstance);

		let pendingRollouts = 0;
		const ips = [...lbConfig.ips];
		// Checks the required number of replicas against the current number.
		// Adds extra replicas if scaling up is needed or removes the excess
		// replicas if scaling down is required.
		for (let i = 0; i < Math.max(lbConfig.ips.length, specs.lb.config.ips.length); i++) {
			// Iterates through the replicas during the blue-green deployment process.
			// Replaces old replicas with new ones for upscaling. Removes old replicas
			// that have no replacement for downscaling.
			pendingRollouts++;
			if (!specs.lb.config.ips[i]) {
				// Removes an old replica that will not be replaced.
				ips.splice(i, 1);
			} else {
				// Replaces an old replica with the new one.
				ips[i] = specs.lb.config.ips[i];
			}

			if (pendingRollouts === lbConfig.rollout.size) {
				await this.updateLBConfig(this.getUpdatedLBConfig(specs.lb.config, ips), lbInstance);
				await timeout(lbConfig.rollout.interval);
				pendingRollouts = 0;
			}
		}
		if (pendingRollouts !== 0) {
			await this.updateLBConfig(this.getUpdatedLBConfig(specs.lb.config, ips), lbInstance);
		}
	}

	private getUpdatedLBConfig(lbConfig: LBConfig, ips: string[]): LBConfig {
		// Creates a new LB configuration object with the updated list of IPs,
		// while preserving all other properties from the existing configuration.
		// This approach avoids directly modifying the Specs state, ensuring the
		// original data remains unchanged.
		return { ...lbConfig, ips: ips };
	}

	private async getLBConfig(lbInstance: Instance): Promise<LBConfig> {
		const sshClient = this.sshFactory.createSSHClient(lbInstance.network.publicIP, lbInstance.network.user);
		const command = new GetLBConfigCommandBuilder().build();
		const lbConfig = await sshClient.run(command);
		return JSON.parse(lbConfig) as LBConfig;
	}

	private async updateLBConfig(lbConfig: LBConfig, lbInstance: Instance): Promise<void> {
		const sshClient = this.sshFactory.createSSHClient(lbInstance.network.publicIP, lbInstance.network.user);
		const command = new UpdateLBCommandBuilder(lbConfig).build();
		await sshClient.run(command);
	}
}
