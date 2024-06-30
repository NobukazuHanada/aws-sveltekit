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
import { logger } from './logger';

export const getAmplifyConfig = () => Amplify.getConfig().Auth!;

export function createKeyValueStorage(cookies: Cookies) {
	return createKeyValueStorageFromCookieStorageAdapter({
		get(name) {
			const value = cookies.get(name);
			logger.info({ name, value }, 'get cookie');
			return { name, value };
		},
		getAll() {
			logger.info(cookies.getAll(), 'get all cookies');
			return cookies.getAll();
		},
		set(name, value) {
			logger.info({ name, value }, 'set cookie');
			cookies.set(name, value, { path: '/' });
		},
		delete(name) {
			logger.info({ name }, 'delete cookie');
			cookies.delete(name, { path: '/' });
		}
	});
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
