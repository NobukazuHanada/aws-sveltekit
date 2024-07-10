import { logger } from '$lib/logger';

/** @type {import('./$types').PageLoad} */
export function load(loadParams) {
	logger.info(loadParams, 'layout load');
}
