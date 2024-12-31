import { ExecutionError } from "@src/lib/utils/errors";
import { infiniteLoop } from "@src/lib/utils/infinite-loop";

describe("infiniteLoop tests", () => {
	it("should resolve the promise if the function succeeds", async () => {
		const mockFn = jest.fn().mockResolvedValue("success");
		const result = await infiniteLoop(mockFn);
		expect(mockFn).toHaveBeenCalledTimes(1);
		expect(result).toBe("success");
	});

	it("should retry the function if it fails and eventually succeed", async () => {
		const mockFn = jest.fn().mockRejectedValueOnce(new Error("fail")).mockResolvedValueOnce("success");
		const result = await infiniteLoop(mockFn, 100, 2);
		expect(mockFn).toHaveBeenCalledTimes(2);
		expect(result).toBe("success");
	});

	it("should throw ExecutionError after max retries", async () => {
		const mockFn = jest.fn().mockRejectedValue(new Error("fail"));
		await expect(infiniteLoop(mockFn, 100, 2)).rejects.toThrow(ExecutionError);
		expect(mockFn).toHaveBeenCalledTimes(3);
	});

	it("should throw ExecutionError with non-Error object after max retries", async () => {
		const mockFn = jest.fn().mockRejectedValue("fail");
		await expect(infiniteLoop(mockFn, 100, 2)).rejects.toThrow(ExecutionError);
		expect(mockFn).toHaveBeenCalledTimes(3);
	});
});
