<script lang="ts">
	/**
	 * Badge Component - Retea Design System
	 * Para estados, etiquetas y categorías
	 */

	type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'primary' | 'neutral';
	type BadgeStyle = 'outlined' | 'solid';

	interface Props {
		variant?: BadgeVariant;
		style?: BadgeStyle;
		class?: string;
		children?: any;
	}

	let {
		variant = 'neutral',
		style = 'outlined',
		class: className = '',
		children
	}: Props = $props();

	const classes = $derived(() => {
		const base = 'badge';
		const variantClass = style === 'solid'
			? `badge-solid-${variant}`
			: `badge-${variant}`;

		return [base, variantClass, className]
			.filter(Boolean)
			.join(' ');
	});
</script>

<span class={classes()}>
	{@render children?.()}
</span>

<style>
	/* Estilos adicionales si necesario */
</style>
