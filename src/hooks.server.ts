import { env } from '$env/dynamic/public';
import { logger } from '$lib/logger';
import type { Handle } from '@sveltejs/kit';
import { Amplify } from 'aws-amplify';

type Cookie = { name: string; value: string } | null;

const getSpecificCookie = (cookies: Cookie[], name: string) =>
	cookies
		.map((cookie) => (cookie?.name?.endsWith(name) ? cookie?.value : null))
		.filter((value) => value !== null)[0];

const getCookiePayload = (cookie: string) => {
	const payload = cookie?.split('.')[1];
	const parsedPayload = JSON.parse(atob(payload));
	return parsedPayload;
};

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

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }): Promise<Response> {
	const { cookies, locals } = event;

	const allCookies = cookies.getAll();
	const cognitoCookies = allCookies.filter(
		(cookie) => cookie.name.startsWith('CognitoIdentityServiceProvider') && cookie.value !== null
	);

	logger.info({ allCookies, cognitoCookies }, 'cookie handler');

	if (cognitoCookies?.length === 0) {
		locals.jwtAccessToken = null;
		locals.jwtIdToken = null;
		locals.idTokenPayload = null;
		locals.accessTokenPayload = null;

		locals.userId = null;
		locals.username = null;
		locals.email = null;
		locals.userGroups = null;

		logger.info('❌ no cookies:');

		return resolve(event);
	}

	const idToken = getSpecificCookie(cognitoCookies, 'idToken');
	const accessToken = getSpecificCookie(cognitoCookies, 'accessToken');
	const idTokenPayload = idToken && getCookiePayload(idToken);
	const accessTokenPayload = accessToken && getCookiePayload(accessToken);

	locals.jwtAccessToken = accessToken;
	locals.jwtIdToken = idToken;
	locals.idTokenPayload = idTokenPayload;
	locals.accessTokenPayload = accessTokenPayload;

	locals.userId = idTokenPayload?.sub;
	locals.username = idTokenPayload?.sub;
	locals.email = idTokenPayload?.email;
	locals.userGroups = idTokenPayload?.['cognito:groups'];

	logger.info({ locals }, '✅ signed-in email:');
	return resolve(event);
}
