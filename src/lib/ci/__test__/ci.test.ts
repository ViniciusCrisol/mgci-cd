import { CI } from "@src/lib/ci";

describe("CI tests", () => {
	it("should return the expected message", async () => {
		const expectedMessage = "mgci-cd";
		const ci = new CI(expectedMessage);
		const message = await ci.execute();
		expect(message).toEqual(expectedMessage);
	});
});
