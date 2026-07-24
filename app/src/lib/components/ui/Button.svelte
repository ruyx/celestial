<script lang="ts">
	/**
	 * Button Component - Retea Design System
	 * Usa las clases base de app.css
	 */

	type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
	type ButtonSize = 'sm' | 'md' | 'lg';

	interface Props {
		variant?: ButtonVariant;
		size?: ButtonSize;
		iconOnly?: boolean;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		onclick?: () => void;
		children?: any;
	}

	let {
		variant = 'primary',
		size = 'md',
		iconOnly = false,
		disabled = false,
		type = 'button',
		class: className = '',
		onclick,
		children
	}: Props = $props();

	// Compose classes based on props
	const classes = $derived(() => {
		const base = 'btn';
		const variantClass = `btn-${variant}`;
		const sizeClass = size !== 'md' ? `btn-${size}` : '';
		const iconClass = iconOnly ? 'btn-icon-only' : '';

		return [base, variantClass, sizeClass, iconClass, className]
			.filter(Boolean)
			.join(' ');
	});
</script>

<button
	{type}
	{disabled}
	class={classes()}
	onclick={onclick}
>
	{@render children?.()}
</button>

<style>
	/* Estilos adicionales específicos si necesario */
	/* La mayoría viene de app.css */
</style>
