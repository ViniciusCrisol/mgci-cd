import { VMCommands } from "@src/lib/ci/mgc/commands/vm-commands";
import { CommandRunner } from "@src/lib/helpers/command-runner";
import { join } from "path";

export type MGC = {
	vm: VMCommands;
};

export type Instance = {
	id: string;
	name: string;
	status: string;
	machineType: string;
	network: {
		user: string;
		publicIP: string;
		privateIP: string;
	};
};

export enum InstanceStatus {
	COMPLETED = "completed",

	CREATING_ERROR = "creating_error",
	CREATING_ERROR_QUOTA = "creating_error_quota",
	CREATING_NETWORK_ERROR = "creating_network_error",
	CREATING_ERROR_QUOTA_RAM = "creating_error_quota_ram",
	CREATING_ERROR_QUOTA_VCPU = "creating_error_quota_vcpu",
	CREATING_ERROR_QUOTA_DISK = "creating_error_quota_disk",
	CREATING_ERROR_QUOTA_INSTANCE = "creating_error_quota_instance",
	CREATING_ERROR_QUOTA_FLOATING_IP = "creating_error_quota_floating_ip",

	RETYPING_ERROR = "retyping_error",
	RETYPING_ERROR_QUOTA = "retyping_error_quota",
}

/**
 * TODO: Refactor to use a template literal type for better clarity and type safety. Suggested approach:
 *
 * export type MachineKey = `BV${number}-${number}-${number}`;
 *
 * export const MachineType: Record<
 *   MachineKey,
 *   {
 *     cpu: number;
 *     ram: number;
 *     disk: number;
 *   }
 * >
 */
export const MachineType: {
	[key: string]: {
		cpu: number;
		ram: number;
		disk: number;
	};
} = {
	"BV1-1-10": { cpu: 1, ram: 1, disk: 10 },
	"BV1-1-20": { cpu: 1, ram: 1, disk: 20 },
	"BV1-1-40": { cpu: 1, ram: 1, disk: 40 },
	"BV1-1-100": { cpu: 1, ram: 1, disk: 100 },
	"BV1-1-150": { cpu: 1, ram: 1, disk: 150 },

	"BV1-2-10": { cpu: 1, ram: 2, disk: 10 },
	"BV1-2-20": { cpu: 1, ram: 2, disk: 20 },
	"BV1-2-40": { cpu: 1, ram: 2, disk: 40 },
	"BV1-2-100": { cpu: 1, ram: 2, disk: 100 },
	"BV1-2-150": { cpu: 1, ram: 2, disk: 150 },

	"BV1-4-10": { cpu: 1, ram: 4, disk: 10 },
	"BV1-4-20": { cpu: 1, ram: 4, disk: 20 },
	"BV1-4-40": { cpu: 1, ram: 4, disk: 40 },
	"BV1-4-100": { cpu: 1, ram: 4, disk: 100 },
	"BV1-4-150": { cpu: 1, ram: 4, disk: 150 },

	"BV2-2-10": { cpu: 2, ram: 2, disk: 10 },
	"BV2-2-20": { cpu: 2, ram: 2, disk: 20 },
	"BV2-2-40": { cpu: 2, ram: 2, disk: 40 },
	"BV2-2-100": { cpu: 2, ram: 2, disk: 100 },
	"BV2-2-150": { cpu: 2, ram: 2, disk: 150 },

	"BV2-4-10": { cpu: 2, ram: 4, disk: 10 },
	"BV2-4-20": { cpu: 2, ram: 4, disk: 20 },
	"BV2-4-40": { cpu: 2, ram: 4, disk: 40 },
	"BV2-4-100": { cpu: 2, ram: 4, disk: 100 },
	"BV2-4-150": { cpu: 2, ram: 4, disk: 150 },

	"BV2-8-10": { cpu: 2, ram: 8, disk: 10 },
	"BV2-8-20": { cpu: 2, ram: 8, disk: 20 },
	"BV2-8-40": { cpu: 2, ram: 8, disk: 40 },
	"BV2-8-100": { cpu: 2, ram: 8, disk: 100 },
	"BV2-8-150": { cpu: 2, ram: 8, disk: 150 },

	"BV4-16-10": { cpu: 4, ram: 16, disk: 10 },
	"BV4-16-20": { cpu: 4, ram: 16, disk: 20 },
	"BV4-16-40": { cpu: 4, ram: 16, disk: 40 },
	"BV4-16-100": { cpu: 4, ram: 16, disk: 100 },
	"BV4-16-150": { cpu: 4, ram: 16, disk: 150 },

	"BV4-8-10": { cpu: 4, ram: 8, disk: 10 },
	"BV4-8-20": { cpu: 4, ram: 8, disk: 20 },
	"BV4-8-40": { cpu: 4, ram: 8, disk: 40 },
	"BV4-8-100": { cpu: 4, ram: 8, disk: 100 },
	"BV4-8-150": { cpu: 4, ram: 8, disk: 150 },

	"BV8-16-10": { cpu: 8, ram: 16, disk: 10 },
	"BV8-16-20": { cpu: 8, ram: 16, disk: 20 },
	"BV8-16-40": { cpu: 8, ram: 16, disk: 40 },
	"BV8-16-100": { cpu: 8, ram: 16, disk: 100 },
	"BV8-16-150": { cpu: 8, ram: 16, disk: 150 },

	"BV8-32-10": { cpu: 8, ram: 32, disk: 10 },
	"BV8-32-20": { cpu: 8, ram: 32, disk: 20 },
	"BV8-32-40": { cpu: 8, ram: 32, disk: 40 },
	"BV8-32-100": { cpu: 8, ram: 32, disk: 100 },
	"BV8-32-150": { cpu: 8, ram: 32, disk: 150 },
};

const cliPath = join(__dirname, "embedded-cli", "linux_amd64@v0_31_0.elf");

export function init(key: string): MGC {
	const commandRunner = new CommandRunner(
		cliPath,
		["--raw", "--no-confirm", `--api-key=${key}`, "--output=json=compact"],
		(stdout) =>
			stdout
				.replace(/[\u2580-\u259F]/g, "") // Remove block characters
				.replace(/\x1b\[[0-9;]*m/g, "") // Remove ANSI scape codes
				.replace(/\(\ds\)/g, "") // Remove time indicators
				.trim(),
	);
	return {
		vm: new VMCommands(commandRunner),
	};
}
