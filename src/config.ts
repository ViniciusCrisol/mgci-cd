export default {
	infiniteLoop: {
		interval: Number(process.env["INFINITE_LOOP_INTERVAL"] || 300),
		maxRetries: Number(process.env["INFINITE_LOOP_MAX_RETRIES"] || 200),
	},
};
