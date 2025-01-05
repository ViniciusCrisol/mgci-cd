import { Specs } from "@src/lib/ci";
import { checkupInstance, Instance, InstanceStatus, MACHINE_TYPE, MGCDAO } from "@src/lib/ci/mgc";
import { SSHClient, SSHFactory } from "@src/lib/ci/ssh";
import { SetupLBStep } from "@src/lib/ci/steps/setup-lb-step";
import { ValidationError } from "@src/lib/utils/errors";

jest.mock("@src/lib/utils/infinite-loop", () => ({
	infiniteLoop: jest.fn((fn) => fn()),
}));
jest.mock("@src/lib/ci/mgc");
jest.mock("@src/lib/ci/ssh");
jest.mock("@src/lib/ci/command-builders/setup-lb-command-builder");

describe("SetupLBStep tests", () => {
	let specs: Specs;
	let lbInstance: Instance;

	let mgcDAO: jest.Mocked<MGCDAO>;
	let sshClient: jest.Mocked<SSHClient>;
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
			id: "1",
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
		sshClient = jest.mocked({
			run: jest.fn(),
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

	describe("update tests", () => {
		it("should throw ValidationError if trying to downgrade machine type", async () => {
			specs.lb.machineType = "lower-type";
			lbInstance.machineType = "higher-type";
			MACHINE_TYPE["lower-type"] = { name: "lower-type", weight: 1 };
			MACHINE_TYPE["higher-type"] = { name: "higher-type", weight: 2 };

			await expect(setupLBStep["update"](specs, lbInstance)).rejects.toThrow(ValidationError);

			delete MACHINE_TYPE["higher-type"];
			delete MACHINE_TYPE["lower-type"];
		});

		it("should retype the instance and run checkupInstance if machine type is different", async () => {
			specs.lb.machineType = "new-type";
			lbInstance.machineType = "old-type";
			MACHINE_TYPE["old-type"] = { name: "old-type", weight: 1 };
			MACHINE_TYPE["new-type"] = { name: "new-type", weight: 2 };

			await setupLBStep["update"](specs, lbInstance);

			expect(checkupInstance).toHaveBeenCalledWith(lbInstance.id, mgcDAO);
			expect(mgcDAO.retypeInstance).toHaveBeenCalledWith(lbInstance.id, specs.lb.machineType);

			delete MACHINE_TYPE["old-type"];
			delete MACHINE_TYPE["new-type"];
		});

		it("should not retype the instance if machine type is the same", async () => {
			specs.lb.machineType = "same-type";
			lbInstance.machineType = "same-type";
			MACHINE_TYPE["same-type"] = { name: "same-type", weight: 1 };

			await setupLBStep["update"](specs, lbInstance);

			expect(checkupInstance).not.toHaveBeenCalled();
			expect(mgcDAO.retypeInstance).not.toHaveBeenCalled();

			delete MACHINE_TYPE["same-type"];
		});

		it("should handle undefined weights in MACHINE_TYPE", async () => {
			specs.lb.machineType = "undefined-weight-type";
			lbInstance.machineType = "another-undefined-weight-type";

			await setupLBStep["update"](specs, lbInstance);

			expect(checkupInstance).not.toHaveBeenCalled();
			expect(mgcDAO.retypeInstance).not.toHaveBeenCalled();
		});
	});

	describe("create tests", () => {
		it("should create a new instance and run setup commands", async () => {
			const checkupInstanceMock = jest.mocked(checkupInstance);
			checkupInstanceMock.mockResolvedValue(lbInstance);
			mgcDAO.createInstance.mockResolvedValue(lbInstance);
			sshFactory.createSSHClient.mockReturnValue(sshClient);

			await setupLBStep["create"](specs);

			expect(mgcDAO.createInstance).toHaveBeenCalledWith(
				specs.lb.name,
				specs.lb.image,
				specs.lb.sshKeyName,
				specs.lb.machineType,
			);
			expect(checkupInstance).toHaveBeenCalledWith(lbInstance.id, mgcDAO);
		});
	});
});
