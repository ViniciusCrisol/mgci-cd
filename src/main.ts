import config from "@src/config";
import BlueGreenRolloutExecutor from "@src/lib/ci/executors/blue-green-rollout-executor";
import SetupAppReplicasExecutor from "@src/lib/ci/executors/setup-app-replicas-executor";
import SetupLBExecutor from "@src/lib/ci/executors/setup-lb-executor";
import { init } from "@src/lib/ci/mgc";
import { MGCDAO } from "@src/lib/ci/mgc/mgc-dao";
import { SSHFactory } from "@src/lib/ci/ssh/ssh-factory";
import { readFileSync } from "fs";

export async function main() {
	const mgc = init(config.mgc.token);
	const mgcDAO = new MGCDAO(mgc, config.mgc.instanceUser);
	const sshFactory = new SSHFactory(config.ssh.port, config.ssh.privateKey);

	const setupLBExecutor = new SetupLBExecutor(mgcDAO, sshFactory);
	const setupAppExecutor = new SetupAppReplicasExecutor(mgcDAO, sshFactory);
	const blueGreenRolloutExecutor = new BlueGreenRolloutExecutor(mgcDAO, sshFactory);

	const rawSpecs = JSON.parse(readFileSync(config.specsPath, "utf-8"));
	const specs = {
		name: rawSpecs.name,
		version: rawSpecs.version,
		sshKeyName: rawSpecs.sshKeyName,
		instanceImage: config.mgc.instanceImage,
		lb: {
			name: rawSpecs.name + "-lb",
			config: {
				file: config.lb.configFile,
				replicaIPs: [],
				replicaIDs: [],
				rollout: {
					size: rawSpecs.lb.config.rollout.size,
					interval: rawSpecs.lb.config.rollout.interval,
				},
			},
			machineType: rawSpecs.lb.machineType,
		},
		app: {
			name: rawSpecs.name + "-" + rawSpecs.version.replace(/\./g, "_"),
			config: {
				port: rawSpecs.app.config.port,
				image: rawSpecs.app.config.image,
				replicas: rawSpecs.app.config.replicas,
			},
			machineType: rawSpecs.app.machineType,
		},
	};
	await Promise.all([setupLBExecutor.execute(specs), setupAppExecutor.execute(specs)]);
	await blueGreenRolloutExecutor.execute(specs);
}

if (process.argv.includes("execute")) {
	main();
}
