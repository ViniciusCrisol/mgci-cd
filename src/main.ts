import { CI } from "@src/lib/ci/core";

export async function main() {
	const ci = new CI("Hello World!");
	const message = await ci.execute();
	console.log(message);
}

if (process.argv.includes("execute")) {
	main();
}
