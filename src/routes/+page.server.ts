import { logger } from '$lib/logger.js';
import { fail, type ActionFailure } from '@sveltejs/kit';
import { withSSRContext } from 'aws-amplify';
import type { CognitoUser, CognitoUserSession } from 'amazon-cognito-identity-js';
import { Auth as AmplifyAuth } from 'aws-amplify';

export type defaultActionReturnType = {
	challengeName: CognitoUser['challengeName'];
	token?: string;
	secretCode?: string;
};

export type defaultActionFailure = ActionFailure<{ name: string; message: string }>;

/** @type {import('./$types').PageLoad} */
export async function load(loadParams) {
	logger.info(loadParams, 'layout load');
	const { Auth } = withSSRContext({ req: loadParams.request });
	const session = await Auth.currentSession();
	logger.info({ session }, 'layout load session');
}

/** @type {import('./$types').Actions} */
export const actions = {
	login: async ({ cookies, request }): Promise<defaultActionReturnType | defaultActionFailure> => {
		logger.info('start signin');
		const data = await request.formData();
		const username = data.get('username') as string;
		const password = data.get('password') as string;
		logger.info({ username, password }, 'sign in data');

		try {
			const context = withSSRContext({ req: request });
			const Auth = context.Auth as typeof AmplifyAuth;

			const cognitoUser: CognitoUser = await Auth.signIn(username, password);
			logger.info('fetching session');
			const sessionPromise = new Promise<CognitoUserSession>((resolve, reject) => {
				cognitoUser.getSession((err: any, session: CognitoUserSession) => {
					if (err) {
						reject(err);
					} else {
						resolve(session);
					}
				});
			});
			const session = await sessionPromise;
			logger.info({ session }, 'sign in session');
			const token = session.getIdToken().getJwtToken();
			logger.info({ token }, 'sign in token');

			if (cognitoUser.challengeName === 'MFA_SETUP') {
				const secretCode = await Auth.setupTOTP(cognitoUser);
				return { token, secretCode, challengeName: cognitoUser.challengeName };
			}

			return { token, challengeName: cognitoUser.challengeName };
		} catch (error) {
			logger.error({ error }, 'sign in error');
			const { name, message, code } = error as { name: string; message: string; code: string };
			return fail(400, { name, message, code });
		}
	},

	'new-password': async ({
		cookies,
		request
	}): Promise<defaultActionReturnType | defaultActionFailure> => {
		logger.info('new password start');
		const data = await request.formData();
		const newPassword = data.get('newPassword') as string;
		const token = data.get('token') as string;
		logger.info({ newPassword, token }, 'new password form data');

		try {
			const context = withSSRContext({ req: request });
			const Auth = context.Auth as typeof AmplifyAuth;
			const currentUser: CognitoUser = await Auth.currentAuthenticatedUser();
			if (!currentUser) {
				throw new Error('No current user');
			}
			logger.info({ currentUser }, 'new password current user');
			const user: CognitoUser = await Auth.completeNewPassword(currentUser, newPassword);

			if (user.challengeName === 'MFA_SETUP') {
				const secretCode = await Auth.setupTOTP(user);
				return { token, secretCode, challengeName: user.challengeName };
			}

			return { token, challengeName: user.challengeName };
		} catch (error) {
			logger.error({ error }, 'new password error');
			const { name, message, code } = error as { name: string; message: string; code: string };
			return fail(400, { name, message, code });
		}
	}
};
