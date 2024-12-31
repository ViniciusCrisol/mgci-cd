const path = require("path");
module.exports = {
	preset: "ts-jest",
	clearMocks: true,
	displayName: "root",
	testEnvironment: "node",
	testMatch: ["<rootDir>/src/**/*.test.ts"],
	moduleNameMapper: {
		"@src/(.*)": "<rootDir>/src/$1",
		"@test/(.*)": "<rootDir>/test/$1",
	},
	rootDir: path.resolve(__dirname),
};
