import GetLBConfigCommandBuilder from "@src/lib/ci/command-builders/get-lb-config-command-build";

const expectedCommand = `bash -c -e '
cat /config.json
'`;

describe("GetLBConfigCommandBuilder tests", () => {
	it("should replace placeholders with provided values using real file", () => {
		const builder = new GetLBConfigCommandBuilder();
		const command = builder.build();
		expect(command).toBe(expectedCommand);
	});
});
