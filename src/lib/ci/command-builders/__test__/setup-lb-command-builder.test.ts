import { SetupLBCommandBuilder } from "@src/lib/ci/command-builders/setup-lb-command-builder";
import { readFileSync } from "fs";
import { join } from "path";

jest.mock("fs");

describe("SetupLBCommandBuilder tests", () => {
	const setupLBCommandPath = join(__dirname, "..", "commands", "setup-lb-command.sh");

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it("should replace placeholders with provided values", () => {
		const mockCommandContent = "rollout size: {{rollout_size}}, interval: {{rollout_interval}}";
		(readFileSync as jest.Mock).mockReturnValue(mockCommandContent);

		const setupLBCommandBuilder = new SetupLBCommandBuilder(5, 5000);
		const setupLBCommand = setupLBCommandBuilder.build();

		expect(readFileSync).toHaveBeenCalledWith(setupLBCommandPath, "utf-8");
		expect(setupLBCommand).toBe("bash -c -e '\nrollout size: 5, interval: 5000'");
	});

	it("should replace multiple placeholders with provided values", () => {
		const mockCommandContent =
			"rollout size: {{rollout_size}}, interval: {{rollout_interval}}, timeout: {{rollout_interval}}";
		(readFileSync as jest.Mock).mockReturnValue(mockCommandContent);

		const setupLBCommandBuilder = new SetupLBCommandBuilder(20, 3000);
		const setupLBCommand = setupLBCommandBuilder.build();

		expect(readFileSync).toHaveBeenCalledWith(setupLBCommandPath, "utf-8");
		expect(setupLBCommand).toBe("bash -c -e '\nrollout size: 20, interval: 3000, timeout: 3000'");
	});
});
