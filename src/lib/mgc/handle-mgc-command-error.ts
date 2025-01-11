import { ExecutionError, ForbiddenError, NotFoundError, ValidationError } from "@src/lib/errors";

/**
 * Wraps the original method in a try-catch block and handles any errors
 * that occur during the execution of the method. The error is passed to
 * the handleError function along with a specified error prefix.
 */
export default function handleMGCCommandError(errorPrefix: string) {
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

// TODO: Link a documentation with the possible errors.
function handleError(error: unknown, errorPrefix: string): never {
	const errorMessage = error instanceof Error ? error.message : String(error);
	if (errorMessage.includes("404 Not Found")) {
		throw new NotFoundError(`${errorPrefix}: ${errorMessage}`);
	}
	if (errorMessage.includes("403 Forbidden")) {
		throw new ForbiddenError(`${errorPrefix}: ${errorMessage}`);
	}
	if (errorMessage.includes("409 Conflict") || errorMessage.includes("422 Unprocessable Entity")) {
		throw new ValidationError(`${errorPrefix}: ${errorMessage}`);
	}
	throw new ExecutionError(`${errorPrefix}: ${errorMessage}`);
}
