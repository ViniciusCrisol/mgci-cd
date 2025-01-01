import { SetupLBCommandBuilder } from "@src/lib/ci/command-builders/setup-lb-command-builder";

const expectedCommand = `bash -c -e '
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y 2> /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get install nginx -y 2> /dev/null

cat <<EOF | sudo tee /version_config.json > /dev/null
{
    "ips": [],
    "rollout": {
        "size": 5,
        "interval": 5000
    }
}
EOF
'`;

describe("SetupLBCommandBuilder acceptance tests", () => {
	it("should replace placeholders with provided values using real file", () => {
		const setupLBCommandBuilder = new SetupLBCommandBuilder(5, 5000);
		const setupLBCommand = setupLBCommandBuilder.build();
		expect(setupLBCommand).toBe(expectedCommand);
	});
});
