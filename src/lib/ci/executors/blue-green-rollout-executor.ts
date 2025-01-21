import { LBConfig, Specs } from "@src/lib/ci";
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
			throw new ExecutionError("!");
		}
		const lbConfig = await this.getLBConfig(specs, lbInstance);

		if (lbConfig.ips.length > specs.lb.config.ips.length) {
			// this.downScalingDeploy
			let pendingRollouts = 0;
			const ips = [...lbConfig.ips];
			for (let i = 0; i < lbConfig.ips.length; i++) {
				if (specs.lb.config.ips[i]) {
					ips[i] = specs.lb.config.ips[i]!;
				} else {
					ips.splice(i, 1);
				}
				pendingRollouts++;
				if (pendingRollouts === lbConfig.rollout.size) {
					// this.updateLBIPs
					pendingRollouts = 0;
					await timeout(lbConfig.rollout.interval);
				}
			}
			if (pendingRollouts !== 0) {
				// this.updateLBIPs
			}
		} else {
			// this.upScalingDeploy
			let pendingRollouts = 0;
			const ips = [...lbConfig.ips];
			for (let i = 0; i < specs.lb.config.ips.length; i++) {
				ips[i] = specs.lb.config.ips[i]!;
				pendingRollouts++;
				if (pendingRollouts === lbConfig.rollout.size) {
					// this.updateLBIPs
					pendingRollouts = 0;
					await timeout(lbConfig.rollout.interval);
				}
			}
			if (pendingRollouts !== 0) {
				// this.updateLBIPs
			}
		}
	}

	private async getLBConfig(specs: Specs, lbInstance: Instance): Promise<LBConfig> {
		const sshClient = this.sshFactory.createSSHClient(lbInstance.network.publicIP, lbInstance.network.user);
		// getLBConfigCommand
		const lbConfig = await sshClient.run(`cat ${specs.lb.config.file}`);
		return JSON.parse(lbConfig) as LBConfig;
	}
}
