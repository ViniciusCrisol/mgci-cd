import { Specs } from "@src/lib/ci";
import { checkupInstance } from "@src/lib/ci/checkup-instance";
import { SetupAppReplicaCommandBuilder } from "@src/lib/ci/command-builders/setup-app-replica-command-builder";
import { IMGCDAO } from "@src/lib/ci/mgc/mgc-dao";
import { ISSHFactory } from "@src/lib/ci/ssh/ssh-factory";
import { infiniteLoop } from "@src/lib/helpers/infinite-loop";

export class SetupAppReplicasExecutor {
	constructor(private readonly mgcDAO: IMGCDAO, private readonly sshFactory: ISSHFactory) {}

	public async execute(specs: Specs): Promise<void> {
		const createReplicas: Promise<void>[] = [];
		// TODO: Check if using snapshots is possible here. This could improve
		// overall application performance and make the process more resilient.
		for (let i = 1; i <= specs.app.config.replicas; i++) {
			createReplicas.push(this.createReplica(specs, i));
		}
		await Promise.all(createReplicas);
	}

	private async createReplica(specs: Specs, replicaNumber: number) {
		const { id: instanceID } = await this.mgcDAO.createInstance(
			this.buildReplicaName(specs, replicaNumber),
			specs.instanceImage,
			specs.sshKeyName,
			specs.app.machineType,
		);
		const instance = await checkupInstance(instanceID, this.mgcDAO);
		const command = new SetupAppReplicaCommandBuilder(specs.app.config).build();
		const sshClient = this.sshFactory.createSSHClient(instance.network.publicIP, instance.network.user);
		await infiniteLoop(async () => {
			await sshClient.run(command);
		});
		// The config is updated with the private IPs of the instances scheduled for rollout to avoid making
		// repeated queries. This creates shared state between executors, which can lead to potential issues.
		// For now, this trade-off is acceptable, but it should be revisited in the future.
		specs.lb.config.ips.push(instance.network.privateIP);
	}

	private buildReplicaName(specs: Specs, replicaNumber: number): string {
		return `${specs.app.name}-r${replicaNumber}`;
	}
}
