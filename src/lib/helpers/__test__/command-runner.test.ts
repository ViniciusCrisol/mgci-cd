import { ExecutionError } from "@src/lib/errors";
import { CommandRunner } from "@src/lib/helpers/command-runner";
import { execFile } from "child_process";

jest.mock("child_process");

describe("CommandRunner tests", () => {
	const cliPath = "/path/to/cli";
	const globalArgs = ["--global", "arg"];
	const postProcessor = (result: string) => result.trim();

	let commandRunner: CommandRunner;

	beforeEach(() => {
		commandRunner = new CommandRunner(cliPath, globalArgs, postProcessor);
	});

	it("should run the command and return processed output", async () => {
		const stdout = "output\n";
		const commandArgs = ["--command", "arg"];
		(execFile as unknown as jest.Mock).mockImplementation((_path, _args, callback) => {
			callback(null, stdout, "");
		});

		const result = await commandRunner.run(commandArgs);

		expect(result).toBe("output");
		expect(execFile).toHaveBeenCalledWith(cliPath, [...commandArgs, ...globalArgs], expect.any(Function));
	});

	it("should reject if execFile returns stderr", async () => {
		const stderr = "error";

		(execFile as unknown as jest.Mock).mockImplementation((_path, _args, callback) => {
			callback(null, "", stderr);
		});

		await expect(commandRunner.run(["--command", "arg"])).rejects.toThrow(new ExecutionError(stderr));
	});

	it("should reject if execFile returns an error", async () => {
		const error = new Error("error");

		(execFile as unknown as jest.Mock).mockImplementation((_path, _args, callback) => {
			callback(error, "", "");
		});

		await expect(commandRunner.run(["--command", "arg"])).rejects.toThrow(new ExecutionError(error.message));
	});
});
