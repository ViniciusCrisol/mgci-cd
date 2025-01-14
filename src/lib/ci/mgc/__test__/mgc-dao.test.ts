import { MGC } from "@src/lib/ci/mgc";
import { MGCDAO } from "@src/lib/ci/mgc/mgc-dao";
import { NotFoundError } from "@src/lib/errors";

describe("MGCDAO tests", () => {
	const instanceResult = {
		id: "id",
		name: "name",
		status: "running",
		machine_type: {
			name: "test-machineType",
		},
		network: {
			ports: [
				{
					ipAddresses: {
						publicIpAddress: "1.2.3.4",
						privateIpAddress: "5.6.7.8",
					},
				},
			],
		},
	};
	const instanceUser = "instance-user";
	let mgcMock: jest.Mocked<MGC>;
	let mgcDAO: MGCDAO;

	beforeEach(() => {
		mgcMock = {
			vm: {
				createInstance: jest.fn(),
				listInstances: jest.fn(),
				getInstance: jest.fn(),
				retypeInstance: jest.fn(),
			},
		} as unknown as jest.Mocked<MGC>;
		mgcDAO = new MGCDAO(mgcMock, instanceUser);
	});

	describe("createInstance tests", () => {
		it("should create an instance", async () => {
			const createInstanceResult = { id: "instance-id" };
			(mgcMock.vm.createInstance as jest.Mock).mockResolvedValue(createInstanceResult);

			const result = await mgcDAO.createInstance("name", "image", "sshKey", "machineType");

			expect(result).toEqual({ id: createInstanceResult.id });
			expect(mgcMock.vm.createInstance).toHaveBeenCalledWith("name", "image", "sshKey", "machineType");
		});
	});

	describe("getInstanceByID tests", () => {
		it("should get an instance by ID", async () => {
			(mgcMock.vm.getInstance as jest.Mock).mockResolvedValue(instanceResult);

			const result = await mgcDAO.getInstanceByID(instanceResult.id);

			expect(result).toEqual({
				id: instanceResult.id,
				name: instanceResult.name,
				status: instanceResult.status,
				machineType: instanceResult.machine_type.name,
				network: {
					user: instanceUser,
					publicIP: instanceResult.network.ports[0]?.ipAddresses.publicIpAddress,
					privateIP: instanceResult.network.ports[0]?.ipAddresses.privateIpAddress,
				},
			});
			expect(mgcMock.vm.getInstance).toHaveBeenCalledWith(instanceResult.id);
		});

		it("should return undefined if instance not found by ID", async () => {
			const notFoundError = new NotFoundError("Instance not found with the given ID");
			(mgcMock.vm.getInstance as jest.Mock).mockRejectedValue(notFoundError);

			const result = await mgcDAO.getInstanceByID("instance-id");

			expect(result).toBeUndefined();
			expect(mgcMock.vm.getInstance).toHaveBeenCalledWith("instance-id");
		});

		it("should throw an error if an unexpected error occurs", async () => {
			const unexpectedError = new Error("Unexpected error");
			(mgcMock.vm.getInstance as jest.Mock).mockRejectedValue(unexpectedError);

			await expect(mgcDAO.getInstanceByID("instance-id")).rejects.toThrow("Unexpected error");
			expect(mgcMock.vm.getInstance).toHaveBeenCalledWith("instance-id");
		});
	});

	describe("getInstanceByName test", () => {
		it("should get an instance by name", async () => {
			(mgcMock.vm.listInstances as jest.Mock).mockResolvedValue([instanceResult]);

			const result = await mgcDAO.getInstanceByName(instanceResult.name);

			expect(result).toEqual({
				id: instanceResult.id,
				name: instanceResult.name,
				status: instanceResult.status,
				machineType: instanceResult.machine_type.name,
				network: {
					user: instanceUser,
					publicIP: instanceResult.network.ports[0]?.ipAddresses.publicIpAddress,
					privateIP: instanceResult.network.ports[0]?.ipAddresses.privateIpAddress,
				},
			});
			expect(mgcMock.vm.listInstances).toHaveBeenCalled();
		});

		it("should return undefined if instance not found by name", async () => {
			(mgcMock.vm.listInstances as jest.Mock).mockResolvedValue([]);

			const result = await mgcDAO.getInstanceByName("test-name");

			expect(result).toBeUndefined();
			expect(mgcMock.vm.listInstances).toHaveBeenCalled();
		});
	});

	describe("retypeInstance tests", () => {
		it("should retype an instance", async () => {
			mgcMock.vm.retypeInstance as jest.Mock;

			await mgcDAO.retypeInstance("instance-id", "new-machineType");

			expect(mgcMock.vm.retypeInstance).toHaveBeenCalledWith("instance-id", "new-machineType");
		});
	});
});
