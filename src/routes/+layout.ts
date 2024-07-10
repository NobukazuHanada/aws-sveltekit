import { Amplify } from 'aws-amplify';
import { env } from '$env/dynamic/public';
import { logger } from '$lib/logger';

Amplify.configure({
	Auth: {
		Cognito: {
			userPoolClientId: env.PUBLIC_AUTH_USER_CLIENDT_ID!,
			userPoolId: env.PUBLIC_AUTH_USER_POOL_ID!
		}
	}
});

/** @type {import('./$types').PageLoad} */
export function load(loadParams) {
	logger.info(loadParams, 'layout load');
}
