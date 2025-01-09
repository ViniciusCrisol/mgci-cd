import { Specs } from "@src/lib/ci";
import { Instance, InstanceStatus, MACHINE_TYPE, MGCDAO } from "@src/lib/ci/mgc";
import { SSHClient, SSHFactory } from "@src/lib/ci/ssh";
import { SetupLBStep } from "@src/lib/ci/steps/setup-lb-step";
import { ValidationError } from "@src/lib/errors";

jest.mock("@src/lib/helpers/infinite-loop", () => ({
	infiniteLoop: jest.fn((fn) => fn()),
}));

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
			mgcDAO.getInstanceByName.mockResolvedValueOnce(lbInstance);
			jest.spyOn(setupLBStep, "update" as keyof SetupLBStep).mockResolvedValueOnce(undefined);

			await setupLBStep.execute(specs);

			expect(setupLBStep["update"]).toHaveBeenCalledWith(specs, lbInstance);
			expect(mgcDAO.getInstanceByName).toHaveBeenCalledWith(lbInstance.name);
		});

		it("should create the instance if it does not exist", async () => {
			mgcDAO.getInstanceByName.mockResolvedValueOnce(undefined);
			jest.spyOn(setupLBStep, "create" as keyof SetupLBStep).mockResolvedValueOnce(undefined);

			await setupLBStep.execute(specs);

			expect(setupLBStep["create"]).toHaveBeenCalledWith(specs);
			expect(mgcDAO.getInstanceByName).toHaveBeenCalledWith(lbInstance.name);
		});
	});

	describe("update tests", () => {
		it("should throw ValidationError if trying to downgrade machine type", async () => {
			mgcDAO.getInstanceByName.mockResolvedValueOnce(lbInstance);

			specs.lb.machineType = "lower-type";
			lbInstance.machineType = "higher-type";
			MACHINE_TYPE["lower-type"] = { name: "lower-type", weight: 1 };
			MACHINE_TYPE["higher-type"] = { name: "higher-type", weight: 2 };

			await expect(setupLBStep.execute(specs)).rejects.toThrow(
				new ValidationError(
					`Cannot downgrade machine type from ${lbInstance.machineType} to ${specs.lb.machineType}`,
				),
			);
			expect(mgcDAO.getInstanceByName).toHaveBeenCalledWith(lbInstance.name);

			delete MACHINE_TYPE["higher-type"];
			delete MACHINE_TYPE["lower-type"];
		});

		it("should retype the instance and run checkupInstance if machine type is different", async () => {
			mgcDAO.getInstanceByID.mockResolvedValueOnce(lbInstance);
			mgcDAO.getInstanceByName.mockResolvedValueOnce(lbInstance);

			specs.lb.machineType = "new-type";
			lbInstance.machineType = "old-type";
			MACHINE_TYPE["old-type"] = { name: "old-type", weight: 1 };
			MACHINE_TYPE["new-type"] = { name: "new-type", weight: 2 };

			await setupLBStep.execute(specs);

			expect(mgcDAO.retypeInstance).toHaveBeenCalledWith(lbInstance.id, specs.lb.machineType);
			expect(mgcDAO.getInstanceByID).toHaveBeenCalledWith(lbInstance.id);
			expect(mgcDAO.getInstanceByName).toHaveBeenCalledWith(lbInstance.name);

			delete MACHINE_TYPE["old-type"];
			delete MACHINE_TYPE["new-type"];
		});

		it("should not retype the instance if machine type is the same", async () => {
			mgcDAO.getInstanceByName.mockResolvedValueOnce(lbInstance);

			specs.lb.machineType = "same-type";
			lbInstance.machineType = "same-type";
			MACHINE_TYPE["same-type"] = { name: "same-type", weight: 1 };

			await setupLBStep.execute(specs);

			expect(mgcDAO.retypeInstance).not.toHaveBeenCalled();
			expect(mgcDAO.getInstanceByName).toHaveBeenCalledWith(lbInstance.name);

			delete MACHINE_TYPE["same-type"];
		});

		it("should handle undefined weights in MACHINE_TYPE", async () => {
			mgcDAO.getInstanceByName.mockResolvedValueOnce(lbInstance);

			specs.lb.machineType = "undefined-weight-type";
			lbInstance.machineType = "another-undefined-weight-type";

			await setupLBStep.execute(specs);

			expect(mgcDAO.retypeInstance).not.toHaveBeenCalled();
			expect(mgcDAO.getInstanceByName).toHaveBeenCalledWith(lbInstance.name);
		});
	});

	describe("create tests", () => {
		it("should create a new instance and run setup commands", async () => {
			mgcDAO.createInstance.mockResolvedValueOnce(lbInstance);
			mgcDAO.getInstanceByID.mockResolvedValueOnce(lbInstance);
			mgcDAO.getInstanceByName.mockResolvedValueOnce(undefined);
			sshFactory.createSSHClient.mockReturnValueOnce(sshClient);

			await setupLBStep.execute(specs);

			expect(mgcDAO.createInstance).toHaveBeenCalledWith(
				specs.lb.name,
				specs.lb.image,
				specs.lb.sshKeyName,
				specs.lb.machineType,
			);
			expect(mgcDAO.getInstanceByID).toHaveBeenCalledWith(lbInstance.id);
			expect(mgcDAO.getInstanceByName).toHaveBeenCalledWith(lbInstance.name);
			expect(sshFactory.createSSHClient).toHaveBeenCalledWith(
				lbInstance.network.publicIP,
				lbInstance.network.user,
			);
		});
	});
});
