const path = require("path");
const root = path.resolve(__dirname, "..");
const rootConfig = require(`${root}/jest.config.js`);
module.exports = {
	...rootConfig,
	rootDir: root,
	displayName: "functional",
	testMatch: ["<rootDir>/test/**/*.test.ts"],
};
