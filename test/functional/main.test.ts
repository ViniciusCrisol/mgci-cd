import { main } from "@src/main";

describe("CI functional tests", () => {
	it("should log the expected message", async () => {
		const consoleSpy = jest.spyOn(console, "log");
		await main();
		expect(consoleSpy).toHaveBeenCalledWith("Hello World!");
	});
});
