export default {
	mgc: {
		instanceUser: process.env["INSTANCE_USER"] || "ubuntu",
		instanceImage: process.env["INSTANCE_IMAGE"] || "cloud-ubuntu-24.04 LTS",
	},
	infiniteLoop: {
		interval: Number(process.env["INFINITE_LOOP_INTERVAL"] || 300),
		maxRetries: Number(process.env["INFINITE_LOOP_MAX_RETRIES"] || 200),
	},
};
