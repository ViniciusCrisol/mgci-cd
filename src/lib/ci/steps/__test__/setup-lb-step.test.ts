import { Specs } from "@src/lib/ci";
import { Instance, InstanceStatus, MGCDAO } from "@src/lib/ci/mgc";
import { SSHFactory } from "@src/lib/ci/ssh";
import { SetupLBStep } from "@src/lib/ci/steps/setup-lb-step";

jest.mock("@src/lib/ci/mgc");
jest.mock("@src/lib/ci/ssh");
jest.mock("@src/lib/utils/infinite-loop");
jest.mock("@src/lib/ci/command-builders/setup-lb-command-builder");

describe("SetupLBStep tests", () => {
	let specs: Specs;
	let lbInstance: Instance;

	let mgcDAO: jest.Mocked<MGCDAO>;
	let sshFactory: jest.Mocked<SSHFactory>;
	let setupLBStep: SetupLBStep;

	beforeEach(() => {
		specs = {
			lb: {
				name: "test-lb",
				image: "test-image",
				sshKeyName: "test-key",
				machineType: "BV1-2-10",
				config: {
					ips: [],
					file: "/config.json",
					rollout: {
						size: 5,
						interval: 5000,
					},
				},
			},
		};
		lbInstance = {
			id: "id",
			name: specs.lb.name,
			status: InstanceStatus.COMPLETED,
			machineType: specs.lb.machineType,
			network: {
				user: "user",
				publicIP: "1.1.1.1",
				privateIP: "192.168.1.1",
			},
		};

		mgcDAO = jest.mocked({
			createInstance: jest.fn(),
			getInstanceByID: jest.fn(),
			getInstanceByName: jest.fn(),
			retypeInstance: jest.fn(),
		});
		sshFactory = jest.mocked({
			createSSHClient: jest.fn(),
		});
		setupLBStep = new SetupLBStep(mgcDAO, sshFactory);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("execute tests", () => {
		it("should update the instance if it exists", async () => {
			mgcDAO.getInstanceByName.mockResolvedValue(lbInstance);
			jest.spyOn(setupLBStep, "update" as keyof SetupLBStep).mockResolvedValue(undefined);

			await setupLBStep.execute(specs);

			expect(mgcDAO.getInstanceByName).toHaveBeenCalledWith(lbInstance.name);
			expect(setupLBStep["update"]).toHaveBeenCalledWith(specs, lbInstance);
		});

		it("should create the instance if it does not exist", async () => {
			mgcDAO.getInstanceByName.mockResolvedValue(undefined);
			jest.spyOn(setupLBStep, "create" as keyof SetupLBStep).mockResolvedValue(undefined);

			await setupLBStep.execute(specs);

			expect(mgcDAO.getInstanceByName).toHaveBeenCalledWith(lbInstance.name);
			expect(setupLBStep["create"]).toHaveBeenCalledWith(specs);
		});
	});
});
