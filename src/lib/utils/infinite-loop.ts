import { ExecutionError } from "@src/lib/utils/errors";

export async function infiniteLoop<T>(
	fn: () => Promise<T>,
	interval: number = 300,
	maxRetries: number = 200,
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
			await delay(interval);
			return attempt(retries + 1);
		}
	};
	return attempt(0);
}

async function delay(ms: number) {
	await new Promise((resolve) => setTimeout(resolve, ms));
}
