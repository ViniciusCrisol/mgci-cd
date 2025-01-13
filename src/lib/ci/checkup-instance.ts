import { Instance, InstanceStatus } from "@src/lib/ci/mgc";
import { IMGCDAO } from "@src/lib/ci/mgc/mgc-dao";
import { ExecutionError } from "@src/lib/errors";
import { infiniteLoop } from "@src/lib/helpers/infinite-loop";

/**
 * Checks the status of an instance by its ID and returns
 * the instance if it is completed. If the instance is in
 * an error state, it throws an ExecutionError.
 */
export async function checkupInstance(id: string, mgcDAO: IMGCDAO): Promise<Instance> {
	return await infiniteLoop(async () => {
		const instance = await mgcDAO.getInstanceByID(id);
		if (instance) {
			if (instance.status === InstanceStatus.COMPLETED) {
				return instance;
			}
			if (
				instance.status === InstanceStatus.CREATING_ERROR ||
				instance.status === InstanceStatus.CREATING_NETWORK_ERROR ||
				instance.status === InstanceStatus.CREATING_ERROR_QUOTA ||
				instance.status === InstanceStatus.CREATING_ERROR_QUOTA_RAM ||
				instance.status === InstanceStatus.CREATING_ERROR_QUOTA_VCPU ||
				instance.status === InstanceStatus.CREATING_ERROR_QUOTA_DISK ||
				instance.status === InstanceStatus.CREATING_ERROR_QUOTA_INSTANCE ||
				instance.status === InstanceStatus.CREATING_ERROR_QUOTA_FLOATING_IP
			) {
				throw new ExecutionError(`Instance creation failed with status: ${instance.status}`);
			}
			if (
				instance.status === InstanceStatus.RETYPING_ERROR ||
				instance.status === InstanceStatus.RETYPING_ERROR_QUOTA
			) {
				throw new ExecutionError(`Instance retyping failed with status: ${instance.status}`);
			}
		}
		throw new ExecutionError("Instance not ready yet");
	});
}
