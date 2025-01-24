import { SetupLBCommandBuilder } from "@src/lib/ci/command-builders/setup-lb-command-builder";

const expectedCommand = `bash -c -e '
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y 2> /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get install nginx -y 2> /dev/null

sudo cat <<EOF | sudo tee /config.json > /dev/null
{
    "file": "/config.json",
    "replicaIDs": [],
    "replicaIPs": [],
    "rollout": {
        "size": 5,
        "interval": 5000
    }
}
EOF
'`;

describe("SetupLBCommandBuilder tests", () => {
	it("should replace placeholders with provided values using real file", () => {
		const setupLBCommandBuilder = new SetupLBCommandBuilder({
			file: "/config.json",
			replicaIDs: [],
			replicaIPs: [],
			rollout: {
				size: 5,
				interval: 5000,
			},
		});
		const setupLBCommand = setupLBCommandBuilder.build();
		expect(setupLBCommand).toBe(expectedCommand);
	});
});
