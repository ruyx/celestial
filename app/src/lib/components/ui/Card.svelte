<script lang="ts">
	/**
	 * Card Component - Retea Design System
	 * Contenedor reutilizable para contenido
	 */

	type CardSize = 'sm' | 'md' | 'lg';
	type CardVariant = 'default' | 'campaign' | 'success' | 'warning' | 'danger';

	interface Props {
		size?: CardSize;
		variant?: CardVariant;
		clickable?: boolean;
		class?: string;
		onclick?: () => void;
		children?: any;
	}

	let {
		size = 'md',
		variant = 'default',
		clickable = false,
		class: className = '',
		onclick,
		children
	}: Props = $props();

	const classes = $derived(() => {
		const base = 'card';
		const sizeClass = size !== 'md' ? `card-${size}` : '';
		const variantClass = variant !== 'default' ? `card-${variant}` : '';
		const clickableClass = clickable ? 'card-clickable' : '';

		return [base, sizeClass, variantClass, clickableClass, className]
			.filter(Boolean)
			.join(' ');
	});
</script>

<div
	class={classes()}
	onclick={clickable ? onclick : undefined}
	role={clickable ? 'button' : undefined}
	tabindex={clickable ? 0 : undefined}
>
	{@render children?.()}
</div>

<style>
	/* Estilos adicionales si necesario */
</style>
