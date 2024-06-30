import { Amplify, type ResourcesConfig } from 'aws-amplify';
import { env } from '$env/dynamic/public';

logger.info('configure at +layout.ts');
Amplify.configure({
	Auth: {
		Cognito: {
			userPoolClientId: env.PUBLIC_AUTH_USER_CLIENDT_ID!,
			userPoolId: env.PUBLIC_AUTH_USER_POOL_ID!
		}
	}
});
