import config from "@src/config";
import { checkupInstance } from "@src/lib/ci/checkup-instance";
import { InstanceStatus } from "@src/lib/ci/mgc";
import { IMGCDAO } from "@src/lib/ci/mgc/mgc-dao";
import { ExecutionError } from "@src/lib/errors";

describe("checkupInstance tests", () => {
	let mgcDAO: jest.Mocked<IMGCDAO>;

	beforeEach(() => {
		mgcDAO = {
			createInstance: jest.fn(),
			getInstanceByID: jest.fn(),
			getInstanceByName: jest.fn(),
			retypeInstance: jest.fn(),
		};
	});

	it("should return the instance if status is COMPLETED", async () => {
		const id = "1";
		const instance = {
			id: id,
			name: "test-instance",
			status: InstanceStatus.COMPLETED,
			machineType: "BV1-2-10",
			network: {
				user: "user",
				publicIP: "1.1.1.1",
				privateIP: "192.168.1.1",
			},
		};
		mgcDAO.getInstanceByID.mockResolvedValueOnce(instance);

		const result = await checkupInstance(id, mgcDAO);

		expect(result).toEqual(instance);
		expect(mgcDAO.getInstanceByID).toHaveBeenCalledWith(id);
	});

	it("should throw an error if instance is not ready yet", async () => {
		mgcDAO.getInstanceByID.mockResolvedValueOnce(undefined);
		await expect(checkupInstance("1", mgcDAO)).rejects.toThrow(
			new ExecutionError(`Failed after ${config.infiniteLoop.maxRetries} attempts: Instance not ready yet`),
		);
	});

	it("should throw an error if instance creation failed", async () => {
		const creationErrorStatuses = [
			InstanceStatus.CREATING_ERROR,
			InstanceStatus.CREATING_NETWORK_ERROR,
			InstanceStatus.CREATING_ERROR_QUOTA,
			InstanceStatus.CREATING_ERROR_QUOTA_RAM,
			InstanceStatus.CREATING_ERROR_QUOTA_VCPU,
			InstanceStatus.CREATING_ERROR_QUOTA_DISK,
			InstanceStatus.CREATING_ERROR_QUOTA_INSTANCE,
			InstanceStatus.CREATING_ERROR_QUOTA_FLOATING_IP,
		];
		for (const status of creationErrorStatuses) {
			const id = "1";
			const instance = {
				id: id,
				name: "test-instance",
				status: status,
				machineType: "BV1-2-10",
				network: {
					user: "user",
					publicIP: "1.1.1.1",
					privateIP: "192.168.1.1",
				},
			};
			mgcDAO.getInstanceByID.mockResolvedValueOnce(instance);

			await expect(checkupInstance(id, mgcDAO)).rejects.toThrow(
				new ExecutionError(
					`Failed after ${config.infiniteLoop.maxRetries} attempts: Instance creation failed with status: ${instance.status}`,
				),
			);
		}
	});

	it("should throw an error if instance retyping failed", async () => {
		const retypingErrorStatuses = [InstanceStatus.RETYPING_ERROR, InstanceStatus.RETYPING_ERROR_QUOTA];
		for (const status of retypingErrorStatuses) {
			const id = "1";
			const instance = {
				id: id,
				name: "test-instance",
				status: status,
				machineType: "BV1-2-10",
				network: {
					user: "user",
					publicIP: "1.1.1.1",
					privateIP: "192.168.1.1",
				},
			};
			mgcDAO.getInstanceByID.mockResolvedValueOnce(instance);

			await expect(checkupInstance(id, mgcDAO)).rejects.toThrow(
				new ExecutionError(
					`Failed after ${config.infiniteLoop.maxRetries} attempts: Instance retyping failed with status: ${instance.status}`,
				),
			);
		}
	});
});
