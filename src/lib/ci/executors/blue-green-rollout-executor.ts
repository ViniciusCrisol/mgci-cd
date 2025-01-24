import { LBConfig, Specs } from "@src/lib/ci";
import GetLBConfigCommandBuilder from "@src/lib/ci/command-builders/get-lb-config-command-build";
import UpdateLBCommandBuilder from "@src/lib/ci/command-builders/update-lb-command-builder";
import { Instance } from "@src/lib/ci/mgc";
import { IMGCDAO } from "@src/lib/ci/mgc/mgc-dao";
import { ISSHFactory } from "@src/lib/ci/ssh/ssh-factory";
import { ExecutionError } from "@src/lib/errors";
import timeout from "@src/lib/helpers/timeout";

export default class BlueGreenRolloutExecutor {
	constructor(private readonly mgcDAO: IMGCDAO, private readonly sshFactory: ISSHFactory) {}

	public async execute(specs: Specs): Promise<void> {
		const lbInstance = await this.mgcDAO.getInstanceByName(specs.lb.name);
		if (!lbInstance) {
			throw new ExecutionError(
				"LB instance not found. This might indicate a broken process. If confirmed, please open an issue to address it",
			);
		}
		const lbConfig = await this.getLBConfig(lbInstance);
		await this.rollout(lbConfig, specs, lbInstance);
		await this.deleteOutdatedReplicas(lbConfig);
	}

	private async rollout(lbConfig: LBConfig, specs: Specs, lbInstance: Instance) {
		let pendingRollouts = 0;
		const ips = [...lbConfig.replicaIPs];
		// Checks the required number of replicas against the current number.
		// Adds extra replicas if scaling up is needed or removes the excess
		// replicas if scaling down is required.
		for (let i = 0; i < Math.max(lbConfig.replicaIPs.length, specs.lb.config.replicaIPs.length); i++) {
			// Iterates through the replicas during the blue-green deployment process.
			// Replaces old replicas with new ones for upscaling. Removes old replicas
			// that have no replacement for downscaling.
			pendingRollouts++;
			if (!specs.lb.config.replicaIPs[i]) {
				ips.splice(i, 1);
			} else {
				ips[i] = specs.lb.config.replicaIPs[i];
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

	private async deleteOutdatedReplicas(lbConfig: LBConfig): Promise<void> {
		await Promise.all(
			lbConfig.replicaIDs.map(async (id) => {
				await this.mgcDAO.deleteInstance(id);
			}),
		);
	}

	private getUpdatedLBConfig(lbConfig: LBConfig, ips: string[]): LBConfig {
		// Creates a new LB configuration object with the updated list of IPs,
		// while preserving all other properties from the existing configuration.
		// This approach avoids directly modifying the Specs state, ensuring the
		// original data remains unchanged.
		return { ...lbConfig, replicaIPs: ips };
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
