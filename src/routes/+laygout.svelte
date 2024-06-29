<script lang="ts">
	import { Amplify } from 'aws-amplify';
	import { env } from '$env/dynamic/public';
	console.log(env.PUBLIC_TEST_ENV);
</script>

<slot></slot>
