import config from "@src/config";
import { SetupLBExecutor } from "@src/lib/ci/executors/setup-lb-executor";
import { init } from "@src/lib/ci/mgc";
import { MGCDAO } from "@src/lib/ci/mgc/mgc-dao";
import { SSHFactory } from "@src/lib/ci/ssh/ssh-factory";
import { readFileSync } from "fs";

export async function main() {
	const mgc = init(config.mgc.token);
	const mgcDAO = new MGCDAO(mgc, config.mgc.instanceUser);
	const sshFactory = new SSHFactory(config.ssh.port, config.ssh.privateKey);

	const setupLBExecutor = new SetupLBExecutor(mgcDAO, sshFactory);

	const specs = JSON.parse(readFileSync(config.specsPath, "utf-8"));
	await setupLBExecutor.execute({
		lb: {
			name: `${specs.name}_lb`,
			image: config.mgc.instanceImage,
			sshKeyName: specs.sshKeyName,
			machineType: specs.lb.machineType,
			config: {
				ips: [],
				file: config.lb.configFile,
				rollout: {
					size: specs.lb.config.rollout.size,
					interval: specs.lb.config.rollout.interval,
				},
			},
		},
	});
}

if (process.argv.includes("execute")) {
	main();
}
