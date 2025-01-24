import { Specs } from "@src/lib/ci";
import SetupAppReplicasExecutor from "@src/lib/ci/executors/setup-app-replicas-executor";
import { Instance, InstanceStatus } from "@src/lib/ci/mgc";
import { IMGCDAO } from "@src/lib/ci/mgc/mgc-dao";
import { ISSHClient } from "@src/lib/ci/ssh/ssh-client";
import { ISSHFactory } from "@src/lib/ci/ssh/ssh-factory";

describe("SetupAppReplicasExecutor tests", () => {
	let specs: Specs;
	let instance1: Instance;
	let instance2: Instance;

	let mgcDAO: jest.Mocked<IMGCDAO>;
	let sshClient: jest.Mocked<ISSHClient>;
	let sshFactory: jest.Mocked<ISSHFactory>;
	let setupAppReplicasExecutor: SetupAppReplicasExecutor;

	beforeEach(() => {
		specs = {
			name: "name",
			version: "v1.0.0",
			sshKeyName: "ssh-key-name",
			instanceImage: "cloud-ubuntu-24.04 LTS",
			lb: {
				name: "name-lb",
				config: {
					replicaIPs: [],
					replicaIDs: [],
					file: "/config.json",
					rollout: {
						size: 5,
						interval: 5000,
					},
				},
				machineType: "BV1-4-10",
			},
			app: {
				name: "name-v1_0_0",
				config: {
					port: "1250",
					image: "name:v1.0.0",
					replicas: 2,
				},
				machineType: "BV1-2-10",
			},
		};
		instance1 = {
			id: "1",
			name: specs.app.name + "-r1",
			status: InstanceStatus.COMPLETED,
			machineType: specs.app.machineType,
			network: {
				user: "user",
				publicIP: "1.1.1.1",
				privateIP: "192.168.1.1",
			},
		};
		instance2 = {
			id: "2",
			name: specs.app.name + "-r2",
			status: InstanceStatus.COMPLETED,
			machineType: specs.app.machineType,
			network: {
				user: "user",
				publicIP: "2.2.2.2",
				privateIP: "292.268.2.2",
			},
		};

		mgcDAO = jest.mocked({
			createInstance: jest.fn(),
			getInstanceByID: jest.fn(),
			getInstanceByName: jest.fn(),
			retypeInstance: jest.fn(),
			deleteInstance: jest.fn(),
		});
		sshClient = jest.mocked({
			run: jest.fn(),
		});
		sshFactory = jest.mocked({
			createSSHClient: jest.fn(),
		});
		setupAppReplicasExecutor = new SetupAppReplicasExecutor(mgcDAO, sshFactory);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("should create a new replica instance and run setup commands", async () => {
		mgcDAO.createInstance.mockResolvedValueOnce({ id: instance1.id }).mockResolvedValueOnce({ id: instance2.id });
		mgcDAO.getInstanceByID.mockResolvedValueOnce(instance1).mockResolvedValueOnce(instance2);
		sshFactory.createSSHClient.mockReturnValue(sshClient);

		await setupAppReplicasExecutor.execute(specs);

		expect(mgcDAO.createInstance).toHaveBeenCalledWith(
			instance1.name,
			specs.instanceImage,
			specs.sshKeyName,
			specs.app.machineType,
		);
		expect(mgcDAO.createInstance).toHaveBeenCalledWith(
			instance2.name,
			specs.instanceImage,
			specs.sshKeyName,
			specs.app.machineType,
		);
		expect(mgcDAO.getInstanceByID).toHaveBeenCalledWith(instance1.id);
		expect(mgcDAO.getInstanceByID).toHaveBeenCalledWith(instance2.id);
		expect(sshFactory.createSSHClient).toHaveBeenCalledWith(instance1.network.publicIP, instance1.network.user);
		expect(sshFactory.createSSHClient).toHaveBeenCalledWith(instance2.network.publicIP, instance2.network.user);
	});
});
