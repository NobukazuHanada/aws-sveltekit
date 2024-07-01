// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			jwtAccessToken: string | null;
			jwtIdToken: string | null;
			idTokenPayload: string | null;
			accessTokenPayload: string | null;

			userId: string | null;
			username: string | null;
			email: string | null;
			userGroups: string | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
