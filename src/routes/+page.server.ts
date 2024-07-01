import { logger } from '$lib/logger.js';
import { fail, type ActionFailure } from '@sveltejs/kit';
import {
	signIn,
	AuthError,
	confirmSignIn,
	fetchAuthSession as amplifyFetchAuthSession
} from 'aws-amplify/auth';
import { createLibraryOptions, fetchAuthSession, getAmplifyConfig } from '$lib/auth.js';
import { runWithAmplifyServerContext } from 'aws-amplify/adapter-core';
import { Amplify } from 'aws-amplify';

export type defaultActionReturnType = {
	signInStep:
		| 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE'
		| 'CONTINUE_SIGN_IN_WITH_MFA_SELECTION'
		| 'CONFIRM_SIGN_IN_WITH_SMS_CODE'
		| 'CONFIRM_SIGN_IN_WITH_TOTP_CODE'
		| 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP'
		| 'CONFIRM_SIGN_UP'
		| 'RESET_PASSWORD'
		| 'DONE'
		| 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED';
	token?: string;
	secretCode?: string;
};

export type defaultActionFailure = ActionFailure<{ name: string; message: string }>;

/** @type {import('./$types').PageLoad} */
export function load(loadParams) {
	logger.info(loadParams, 'layout load');
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
			const { nextStep } = await runWithAmplifyServerContext(
				Amplify.getConfig(),
				createLibraryOptions(cookies),
				async (contextSpec) =>
					signIn({
						username,
						password,
						options: { authFlowType: 'USER_SRP_AUTH' }
					})
			);
			logger.info({ nextStep }, 'sign in next step');
			logger.info('fetching session');

			const session = await fetchAuthSession(cookies);
			const token = session.tokens?.idToken?.toString();
			logger.info({ nextStep, token }, 'sign in success');
			logger.info(cookies.getAll(), 'cookies');

			if (nextStep.signInStep === 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP') {
				const secretCode = nextStep.totpSetupDetails.sharedSecret;
				return { signInStep: nextStep.signInStep, token, secretCode };
			}

			return { signInStep: nextStep.signInStep, token };
		} catch (error) {
			logger.error({ error }, 'sign in error');
			if (error instanceof AuthError) {
				const { name, message } = error;
				return fail(400, { name, message });
			} else {
				throw error;
			}
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

		const session = await fetchAuthSession(cookies);
		logger.info({ token: session.tokens?.idToken?.toString() }, 'new password session');

		try {
			const confirmSignInOutput = await confirmSignIn({ challengeResponse: newPassword });
			logger.info({ confirmSignInOutput }, 'new password success');
			const nextStep = confirmSignInOutput.nextStep;
			if (nextStep.signInStep === 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP') {
				const secretCode = nextStep.totpSetupDetails.sharedSecret;
				return {
					signInStep: nextStep.signInStep,
					token: session.tokens?.idToken?.toString(),
					secretCode
				};
			}
			return {
				signInStep: nextStep.signInStep,
				token: session.tokens?.idToken?.toString()
			};
		} catch (error) {
			logger.error({ error }, 'new password error');
			if (error instanceof AuthError) {
				const { name, message } = error;
				return fail(400, { name, message });
			} else {
				throw error;
			}
		}
	}
};
