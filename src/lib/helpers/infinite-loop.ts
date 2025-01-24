import config from "@src/config";
import { ExecutionError } from "@src/lib/errors";
import timeout from "@src/lib/helpers/timeout";

export default async function infiniteLoop<T>(
	fn: () => Promise<T>,
	interval: number = config.infiniteLoop.interval,
	maxRetries: number = config.infiniteLoop.maxRetries,
): Promise<T> {
	const attempt = async function (retries: number): Promise<T> {
		try {
			return await fn();
		} catch (error) {
			if (retries >= maxRetries) {
				if (error instanceof Error) {
					throw new ExecutionError(`Failed after ${maxRetries} attempts: ${error.message}`);
				} else {
					throw new ExecutionError(`Failed after ${maxRetries} attempts: ${String(error)}`);
				}
			}
			await timeout(interval);
			return attempt(retries + 1);
		}
	};
	return attempt(0);
}
