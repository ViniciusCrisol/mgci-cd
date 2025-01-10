import { ExecutionError, ForbiddenError, NotFoundError, ValidationError } from "@src/lib/errors";
import handleErrors from "../handle-mgc-command-error";

class TestClass {
	@handleErrors("TestClass")
	async methodThatSucceeds() {
		return "success";
	}

	@handleErrors("TestClass")
	async methodThatThrows403() {
		throw new Error("403 Forbidden");
	}

	@handleErrors("TestClass")
	async methodThatThrows404() {
		throw new Error("404 Not Found");
	}

	@handleErrors("TestClass")
	async methodThatThrowsOtherError() {
		throw new Error("Some other error");
	}

	@handleErrors("TestClass")
	async methodThatThrows409() {
		throw new Error("409 Conflict");
	}

	@handleErrors("TestClass")
	async methodThatThrowsString() {
		throw "A string error";
	}
}

describe("handleMGCCommandError tests", () => {
	let testInstance: TestClass;

	beforeEach(() => {
		testInstance = new TestClass();
	});

	it("should return the result if no error is thrown", async () => {
		await expect(testInstance.methodThatSucceeds()).resolves.toBe("success");
	});

	it("should throw ForbiddenError for 403 Forbidden error", async () => {
		await expect(testInstance.methodThatThrows403()).rejects.toThrow(ForbiddenError);
		await expect(testInstance.methodThatThrows403()).rejects.toThrow("TestClass: 403 Forbidden");
	});

	it("should throw NotFoundError for 404 Not Found error", async () => {
		await expect(testInstance.methodThatThrows404()).rejects.toThrow(NotFoundError);
		await expect(testInstance.methodThatThrows404()).rejects.toThrow("TestClass: 404 Not Found");
	});

	it("should throw ValidationError for 409 Conflict error", async () => {
		await expect(testInstance.methodThatThrows409()).rejects.toThrow(ValidationError);
		await expect(testInstance.methodThatThrows409()).rejects.toThrow("TestClass: 409 Conflict");
	});

	it("should throw ExecutionError for other errors", async () => {
		await expect(testInstance.methodThatThrowsOtherError()).rejects.toThrow(ExecutionError);
		await expect(testInstance.methodThatThrowsOtherError()).rejects.toThrow("TestClass: Some other error");
	});

	it("should throw ExecutionError for string errors", async () => {
		await expect(testInstance.methodThatThrowsString()).rejects.toThrow(ExecutionError);
		await expect(testInstance.methodThatThrowsString()).rejects.toThrow("TestClass: A string error");
	});
});
