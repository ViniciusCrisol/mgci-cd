import GetLBConfigCommandBuilder from "@src/lib/ci/command-builders/get-lb-config-command-build";

const expectedCommand = `bash -c -e '
cat /config.json
'`;

describe("GetLBConfigCommandBuilder tests", () => {
	it("should replace placeholders with provided values using real file", () => {
		const setupLBCommandBuilder = new GetLBConfigCommandBuilder();
		const setupLBCommand = setupLBCommandBuilder.build();
		expect(setupLBCommand).toBe(expectedCommand);
	});
});
