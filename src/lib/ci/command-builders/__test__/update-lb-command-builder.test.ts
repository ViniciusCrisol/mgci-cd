import UpdateLBCommandBuilder from "@src/lib/ci/command-builders/update-lb-command-builder";

const expectedCommand = `bash -c -e '
sudo cat <<EOF | sudo tee /config.json > /dev/null
{
    "file": "/config.json",
    "replicaIDs": [
        "1"
    ],
    "replicaIPs": [
        "192.168.1.1"
    ],
    "rollout": {
        "size": 5,
        "interval": 5000
    }
}
EOF

cat <<EOF | sudo tee /etc/nginx/sites-available/default > /dev/null
upstream target {
    server 192.168.1.1;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    location / {
        proxy_pass http://target;

        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        proxy_redirect off;
    }
}
EOF

sudo service nginx restart
'`;

describe("UpdateLBCommandBuilder tests", () => {
	it("should replace placeholders with provided values using real file", () => {
		const builder = new UpdateLBCommandBuilder({
			file: "/config.json",
			replicaIDs: ["1"],
			replicaIPs: ["192.168.1.1"],
			rollout: {
				size: 5,
				interval: 5000,
			},
		});
		const command = builder.build();
		expect(command).toBe(expectedCommand);
	});
});
