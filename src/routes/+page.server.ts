import { logger } from '$lib/logger.js';
import { fail } from '@sveltejs/kit';
import { signIn, fetchAuthSession } from 'aws-amplify/auth';

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ cookies, request }) => {
		logger.info('start signin');
		const data = await request.formData();
		const username = data.get('username') as string;
		const password = data.get('password') as string;
		logger.info({ username, password }, 'sign in data');

		try {
			const { nextStep } = await signIn({
				username,
				password,
				options: {
					authFlowType: 'USER_SRP_AUTH'
				}
			});
			logger.info({ nextStep }, 'sign in next step');
			logger.info('fetching session');
			const session = await fetchAuthSession();
			const token = session.tokens?.idToken?.toString();
			if (token) {
				cookies.set('token', token, { path: '/' });
			}
			logger.info({ nextStep, session }, 'sign in success');

			if (nextStep.signInStep === 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP') {
				const secretCode = nextStep.totpSetupDetails.sharedSecret;
				return { signInStep: nextStep.signInStep, token, secretCode };
			}

			return { signInStep: nextStep.signInStep, token };
		} catch (error) {
			logger.error({ error }, 'sign in error');
			if (
				error &&
				typeof error === 'object' &&
				'code' in error &&
				'name' in error &&
				'message' in error
			) {
				const { code, name, message } = error;
				return fail(400, { code, name, message });
			} else {
				throw error;
			}
		}
	}
};
