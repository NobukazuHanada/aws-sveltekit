<script lang="ts">
	import { Amplify } from 'aws-amplify';
	import { env } from '$env/dynamic/public';
	import { logger } from '$lib/logger';

	logger.info('layout page loaded with amplify configuration');
	Amplify.configure({
		Auth: {
			userPoolWebClientId: env.PUBLIC_AUTH_USER_CLIENDT_ID!,
			userPoolId: env.PUBLIC_AUTH_USER_POOL_ID!,
			authenticationFlowType: 'USER_SRP_AUTH'
		},
		ssr: true
	});
</script>

<slot></slot>
