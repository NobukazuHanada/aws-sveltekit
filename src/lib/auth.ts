import { env } from '$env/dynamic/public';
import type { Cookies } from '@sveltejs/kit';
import { Amplify } from 'aws-amplify';
import {
	createKeyValueStorageFromCookieStorageAdapter,
	createUserPoolsTokenProvider,
	createAWSCredentialsAndIdentityIdProvider,
	runWithAmplifyServerContext
} from 'aws-amplify/adapter-core';
import type { LibraryOptions, FetchAuthSessionOptions } from '@aws-amplify/core';
import { fetchAuthSession as serverFetchAuthSession } from 'aws-amplify/auth/server';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { JwtExpiredError } from 'aws-jwt-verify/error';
import { logger } from './logger';

export const getAmplifyConfig = () => Amplify.getConfig().Auth!;

export const isValidCognitoToken = async (input: {
	token: string;
	userPoolId: string;
	clientId: string;
	tokenType: 'id' | 'access';
}): Promise<boolean> => {
	const { userPoolId, clientId, tokenType, token } = input;

	try {
		const verifier = CognitoJwtVerifier.create({
			userPoolId,
			tokenUse: tokenType,
			clientId
		});
		await verifier.verify(token);

		return true;
	} catch (error) {
		// When `JwtExpiredError` is thrown, the token should have valid signature
		// but expired. So, we can consider it as a valid token.
		// Reference https://github.com/awslabs/aws-jwt-verify/blob/8d8f714d7281913ecd660147f5c30311479601c1/src/jwt-rsa.ts#L290-L301
		if (error instanceof JwtExpiredError) {
			return true;
		}

		// TODO (ashwinkumar6): surface invalid cognito token error to customer
		// TODO: clear invalid tokens from Storage
		return false;
	}
};

export function createKeyValueStorage(cookies: Cookies) {
	return createKeyValueStorageFromCookieStorageAdapter(
		{
			get(name) {
				const value = cookies.get(name);
				logger.info({ name, value }, 'get cookie');
				if (value) {
					return { name, value };
				} else {
					return undefined;
				}
			},
			getAll() {
				logger.info(cookies.getAll(), 'get all cookies');
				return cookies.getAll();
			},
			set(name, value) {
				logger.info({ name, value }, 'set cookie');
				const expires = new Date();
				expires.setDate(expires.getDate() + 30);
				cookies.set(name, value, { path: '/', sameSite: 'lax', secure: true, expires });
			},
			delete(name) {
				logger.info({ name }, 'delete cookie');
				cookies.delete(name, { path: '/' });
			}
		},
		{
			// validate access, id tokens
			getItem: async (key: string, value: string): Promise<boolean> => {
				const tokenType = key.includes('.accessToken')
					? 'access'
					: key.includes('.idToken')
						? 'id'
						: null;
				if (!tokenType) return true;

				return isValidCognitoToken({
					clientId: env.PUBLIC_AUTH_USER_CLIENDT_ID!,
					userPoolId: env.PUBLIC_AUTH_USER_POOL_ID!,
					tokenType,
					token: value
				});
			}
		}
	);
}

export function createTokenProvider(cookies: Cookies) {
	return createUserPoolsTokenProvider(getAmplifyConfig(), createKeyValueStorage(cookies));
}

export function createCredentialsProvider(cookies: Cookies) {
	return createAWSCredentialsAndIdentityIdProvider(
		getAmplifyConfig(),
		createKeyValueStorage(cookies)
	);
}

export function createLibraryOptions(cookies: Cookies): LibraryOptions {
	return {
		Auth: {
			tokenProvider: createTokenProvider(cookies),
			credentialsProvider: createCredentialsProvider(cookies)
		}
	};
}

export function fetchAuthSession(cookies: Cookies, options?: FetchAuthSessionOptions) {
	return runWithAmplifyServerContext(
		Amplify.getConfig(),
		createLibraryOptions(cookies),
		async (contextSpec) => {
			return serverFetchAuthSession(contextSpec, options);
		}
	);
}
