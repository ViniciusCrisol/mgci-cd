import { ExecutionError, ForbiddenError, NotFoundError, ValidationError } from "@src/lib/errors";

/**
 * Wraps the original method in a try-catch block and handles any errors
 * that occur during the execution of the method. The error is passed to
 * the handleError function along with a specified error prefix.
 */
export default function mgcErrorHandler(errorPrefix: string) {
	return (_target: any, _propertyKey: string, propertyDescriptor: PropertyDescriptor) => {
		// The value is overwritten to replace the original method
		// with a new function that includes error handling logic.
		const originalMethod = propertyDescriptor.value;

		propertyDescriptor.value = async function (...args: any[]) {
			try {
				return await originalMethod.apply(this, args);
			} catch (error) {
				handleError(error, errorPrefix);
			}
		};
		return propertyDescriptor;
	};
}
function handleError(error: unknown, errorPrefix: string): never {
	const errorMessage = error instanceof Error ? error.message : String(error);
	const errorMapping = {
		"400 Bad Request": ValidationError,
		"401 Unauthorized": ForbiddenError,
		"403 Forbidden": ForbiddenError,
		"404 Not Found": NotFoundError,
		"409 Conflict": ValidationError,
		"422 Unprocessable Entity": ValidationError,
	};
	for (const [slug, ErrorType] of Object.entries(errorMapping)) {
		if (errorMessage.includes(slug)) {
			throw new ErrorType(`${errorPrefix}: ${errorMessage}`);
		}
	}
	throw new ExecutionError(`${errorPrefix}: ${errorMessage}`);
}
