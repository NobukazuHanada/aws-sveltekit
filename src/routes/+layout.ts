import { Amplify, type ResourcesConfig } from 'aws-amplify';
import { env } from '$env/dynamic/public';
import { logger } from '$lib/logger';

if (!Amplify.getConfig().Auth) {
	Amplify.configure(
		{
			Auth: {
				Cognito: {
					userPoolClientId: env.PUBLIC_AUTH_USER_CLIENDT_ID!,
					userPoolId: env.PUBLIC_AUTH_USER_POOL_ID!
				}
			}
		},
		{ ssr: true }
	);
}

/** @type {import('./$types').PageLoad} */
export function load(loadParams) {
	logger.info(loadParams, 'layout load');
}
