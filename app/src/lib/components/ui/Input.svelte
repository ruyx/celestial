<script lang="ts">
	/**
	 * Input Component - Retea Design System
	 * Input de texto reutilizable con estados
	 */

	type InputSize = 'sm' | 'md' | 'lg';
	type InputState = 'default' | 'error' | 'success';

	interface Props {
		value?: string;
		placeholder?: string;
		type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
		size?: InputSize;
		state?: InputState;
		disabled?: boolean;
		required?: boolean;
		class?: string;
		oninput?: (e: Event) => void;
		onchange?: (e: Event) => void;
		onblur?: (e: Event) => void;
	}

	let {
		value = $bindable(''),
		placeholder = '',
		type = 'text',
		size = 'md',
		state = 'default',
		disabled = false,
		required = false,
		class: className = '',
		oninput,
		onchange,
		onblur
	}: Props = $props();

	const classes = $derived(() => {
		const base = 'input';
		const sizeClass = size !== 'md' ? `input-${size}` : '';
		const stateClass = state !== 'default' ? `input-${state}` : '';

		return [base, sizeClass, stateClass, className]
			.filter(Boolean)
			.join(' ');
	});
</script>

<input
	{type}
	{placeholder}
	{disabled}
	{required}
	class={classes()}
	bind:value
	oninput={oninput}
	onchange={onchange}
	onblur={onblur}
/>

<style>
	/* Estilos adicionales si necesario */
</style>
