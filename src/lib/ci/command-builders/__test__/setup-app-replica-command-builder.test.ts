import { SetupAppReplicaCommandBuilder } from "@src/lib/ci/command-builders/setup-app-replica-command-builder";

const expectedCommand = `bash -c -e '
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y 2> /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get install nginx -y 2> /dev/null

# This script assumes that the system packages have been previously
# updated. Make sure to run the update beforehand to avoid potential
# compatibility issues or outdated packages.

sudo DEBIAN_FRONTEND=noninteractive apt-get install curl -y 2> /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get install ca-certificates -y 2> /dev/null

sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo echo \\
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \\
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \\
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo DEBIAN_FRONTEND=noninteractive apt-get update -y 2> /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get install docker-ce -y 2> /dev/null

sudo docker pull name:v1.0.0
sudo docker run -d -p 1250:1250 -e MESSAGE=teste name:v1.0.0

sudo cat <<EOF | sudo tee /etc/nginx/sites-available/default > /dev/null
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    location / {
        proxy_pass http://localhost:1250;
    }
}
EOF

sudo service nginx restart
'`;

describe("SetupAppReplicaCommandBuilder tests", () => {
	it("should replace placeholders with provided values using real file", () => {
		const setupLBCommandBuilder = new SetupAppReplicaCommandBuilder({
			port: "1250",
			image: "name:v1.0.0",
			replicas: 2,
		});
		const setupLBCommand = setupLBCommandBuilder.build();
		expect(setupLBCommand).toBe(expectedCommand);
	});
});
