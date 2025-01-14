export default {
	specsPath: process.env["SPECS_PATH"] || "",
	ssh: {
		port: 22,
		privateKey: process.env["SSH_PRIVATE_KEY"] || "",
	},
	mgc: {
		token: process.env["MGC_TOKEN"] || "",
		instanceUser: process.env["MGC_INSTANCE_USER"] || "ubuntu",
		instanceImage: process.env["MGC_INSTANCE_IMAGE"] || "cloud-ubuntu-24.04 LTS",
	},
	infiniteLoop: {
		interval: Number(process.env["INFINITE_LOOP_INTERVAL"] || 300),
		maxRetries: Number(process.env["INFINITE_LOOP_MAX_RETRIES"] || 200),
	},
};
