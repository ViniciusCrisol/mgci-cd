const { join } = require("path");
const { readFileSync, writeFileSync } = require("fs");

const availableMachineTypesTemplatePath = join(__dirname, "templates", "available-machine-types.md");
const availableMachineTypesPath = join(__dirname, "..", "..", "docs", "available-machine-types.md");
const { MACHINE_TYPE } = require(__dirname + "/../../dist/src/lib/ci/mgc/index.js");

const header =
	"| MACHINE_TYPE | CPU | RAM | DISK |\n" +
	"| ------------ | --- | --- | ---- |\n";
const lines = Object.entries(MACHINE_TYPE).map(([machineType, { cpu, ram, disk }]) => {
	const cpuColumn = cpu + " ".repeat(3 - cpu.toString().length);
	const ramColumn = ram + " ".repeat(3 - ram.toString().length);
	const diskColumn = disk + " ".repeat(4 - disk.toString().length);
	const machineTypeColumn = machineType + " ".repeat(12 - machineType.length);
	return `| ${machineTypeColumn} | ${cpuColumn} | ${ramColumn} | ${diskColumn} |`;
});
const machineTypesTable = header + lines.join("\n");

writeFileSync(
	availableMachineTypesPath,
	readFileSync(availableMachineTypesTemplatePath, "utf-8").replace(/{{machine_types_table}}/g, machineTypesTable),
);
