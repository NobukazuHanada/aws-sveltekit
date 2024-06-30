import pino from 'pino';

const logLevel = process.env.PINO_LOG_LEVEL ?? 'debug';

export const logger = pino({
	level: logLevel,
	browser: {
		asObject: true,
		serialize: true
	}
});
