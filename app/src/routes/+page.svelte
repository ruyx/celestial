<script lang="ts">
	/**
	 * Home Page - Retea Design System Showcase
	 * Muestra todos los componentes del sistema de diseño
	 */

	import { Button, Card, Input, Badge } from '$lib/components/ui';
	import { Header, Sidebar } from '$lib/components/layout';

	let inputValue = $state('');
	let showSidebar = $state(false);
</script>

<svelte:head>
	<title>Retea - Design System Showcase</title>
</svelte:head>

<div class="app-container">
	<Header userRole="admin" userName="Admin Usuario" />

	{#if showSidebar}
		<Sidebar userRole="admin" activeRoute="/dashboard" />
	{/if}

	<main class="main-content" class:with-sidebar={showSidebar}>
		<div class="content-wrapper">
			<!-- Hero -->
			<section class="hero">
				<h1>Retea Design System</h1>
				<p class="text-muted">
					Sistema de componentes para el marketplace de instalaciones
				</p>

				<div class="hero-actions">
					<Button onclick={() => showSidebar = !showSidebar}>
						{showSidebar ? 'Ocultar' : 'Mostrar'} Sidebar
					</Button>
					<Button variant="secondary">
						Documentación
					</Button>
				</div>
			</section>

			<!-- Buttons -->
			<section class="showcase-section">
				<h2>Botones</h2>

				<div class="component-group">
					<h4>Variantes</h4>
					<div class="flex gap-4">
						<Button variant="primary">Primary</Button>
						<Button variant="secondary">Secondary</Button>
						<Button variant="tertiary">Tertiary</Button>
						<Button variant="danger">Danger</Button>
						<Button disabled>Disabled</Button>
					</div>
				</div>

				<div class="component-group">
					<h4>Tamaños</h4>
					<div class="flex gap-4">
						<Button size="sm">Small</Button>
						<Button size="md">Medium</Button>
						<Button size="lg">Large</Button>
					</div>
				</div>
			</section>

			<!-- Cards -->
			<section class="showcase-section">
				<h2>Cards</h2>

				<div class="grid grid-cols-3 gap-6">
					<Card>
						<h3>Card Default</h3>
						<p>Contenido del card básico con padding y sombra sutil.</p>
					</Card>

					<Card variant="campaign">
						<h3>Card Campaña</h3>
						<p>Card especial para campañas con gradiente de marca.</p>
					</Card>

					<Card variant="success">
						<h3>Card Success</h3>
						<p>Para indicar estados exitosos o completados.</p>
					</Card>

					<Card variant="warning">
						<h3>Card Warning</h3>
						<p>Para advertencias o estados pendientes.</p>
					</Card>

					<Card variant="danger">
						<h3>Card Danger</h3>
						<p>Para errores o estados críticos.</p>
					</Card>

					<Card clickable onclick={() => alert('Card clickeado!')}>
						<h3>Card Clickable</h3>
						<p>Click para interactuar. Tiene hover y active states.</p>
					</Card>
				</div>
			</section>

			<!-- Inputs -->
			<section class="showcase-section">
				<h2>Inputs</h2>

				<div class="component-group max-w-lg">
					<h4>Estados</h4>
					<div class="flex flex-col gap-4">
						<Input
							placeholder="Input normal"
							bind:value={inputValue}
						/>
						<Input
							placeholder="Input con error"
							state="error"
						/>
						<Input
							placeholder="Input con success"
							state="success"
						/>
						<Input
							placeholder="Input deshabilitado"
							disabled
						/>
					</div>
				</div>

				<div class="component-group max-w-lg">
					<h4>Tamaños</h4>
					<div class="flex flex-col gap-4">
						<Input size="sm" placeholder="Small input" />
						<Input size="md" placeholder="Medium input" />
						<Input size="lg" placeholder="Large input" />
					</div>
				</div>
			</section>

			<!-- Badges -->
			<section class="showcase-section">
				<h2>Badges</h2>

				<div class="component-group">
					<h4>Outlined (default)</h4>
					<div class="flex gap-3">
						<Badge variant="success">Success</Badge>
						<Badge variant="warning">Warning</Badge>
						<Badge variant="error">Error</Badge>
						<Badge variant="info">Info</Badge>
						<Badge variant="primary">Primary</Badge>
						<Badge variant="neutral">Neutral</Badge>
					</div>
				</div>

				<div class="component-group">
					<h4>Solid</h4>
					<div class="flex gap-3">
						<Badge variant="success" style="solid">Success</Badge>
						<Badge variant="warning" style="solid">Warning</Badge>
						<Badge variant="error" style="solid">Error</Badge>
						<Badge variant="primary" style="solid">Primary</Badge>
					</div>
				</div>
			</section>

			<!-- Typography -->
			<section class="showcase-section">
				<h2>Tipografía</h2>

				<div class="component-group">
					<h1>Heading 1 - 3.75rem</h1>
					<h2>Heading 2 - 3rem</h2>
					<h3>Heading 3 - 2.25rem</h3>
					<h4>Heading 4 - 1.875rem</h4>
					<h5>Heading 5 - 1.5rem</h5>
					<h6>Heading 6 - 1.25rem</h6>
					<p class="text-base">Paragraph text - 1rem base size</p>
					<p class="text-sm text-muted">Small muted text - 0.875rem</p>
				</div>
			</section>

			<!-- Colors -->
			<section class="showcase-section">
				<h2>Colores</h2>

				<div class="component-group">
					<h4>Primary (Brand Teal)</h4>
					<div class="color-palette">
						<div class="color-swatch bg-primary-50">50</div>
						<div class="color-swatch bg-primary-100">100</div>
						<div class="color-swatch bg-primary-200">200</div>
						<div class="color-swatch bg-primary text-white">500 (Default)</div>
						<div class="color-swatch bg-primary-600 text-white">600</div>
						<div class="color-swatch bg-primary-700 text-white">700</div>
						<div class="color-swatch bg-primary-800 text-white">800</div>
						<div class="color-swatch bg-primary-900 text-white">900</div>
					</div>
				</div>

				<div class="component-group">
					<h4>Semantic Colors</h4>
					<div class="grid grid-cols-4 gap-4">
						<div class="color-block bg-success text-white">
							<span>Success</span>
							<code>#10b981</code>
						</div>
						<div class="color-block bg-warning text-white">
							<span>Warning</span>
							<code>#f59e0b</code>
						</div>
						<div class="color-block bg-error text-white">
							<span>Error</span>
							<code>#ef4444</code>
						</div>
						<div class="color-block bg-info text-white">
							<span>Info</span>
							<code>#3b82f6</code>
						</div>
					</div>
				</div>
			</section>

			<!-- Footer -->
			<footer class="showcase-footer">
				<p class="text-sm text-muted">
					Retea Design System · Sprint 1-2: Fundación
				</p>
			</footer>
		</div>
	</main>
</div>

<style>
	.app-container {
		min-height: 100vh;
		background: var(--color-neutral-50, #f9fafb);
	}

	.main-content {
		margin-top: 90px; /* Altura del header */
		padding: var(--spacing-8, 2rem);
		transition: margin-left 250ms;
	}

	.main-content.with-sidebar {
		margin-left: 274px; /* Ancho del sidebar */
	}

	.content-wrapper {
		max-width: 1280px;
		margin: 0 auto;
	}

	/* Hero */
	.hero {
		text-align: center;
		padding: var(--spacing-16, 4rem) 0;
	}

	.hero h1 {
		margin-bottom: var(--spacing-4, 1rem);
		color: var(--color-primary, #3aa7a3);
	}

	.text-muted {
		color: var(--color-neutral-600, #6b7280);
	}

	.hero-actions {
		margin-top: var(--spacing-8, 2rem);
		display: flex;
		justify-content: center;
		gap: var(--spacing-4, 1rem);
	}

	/* Sections */
	.showcase-section {
		margin-bottom: var(--spacing-16, 4rem);
		padding: var(--spacing-8, 2rem);
		background: white;
		border-radius: var(--radius-lg, 0.75rem);
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	.showcase-section h2 {
		margin-bottom: var(--spacing-8, 2rem);
		padding-bottom: var(--spacing-4, 1rem);
		border-bottom: 2px solid var(--color-neutral-200, #e5e7eb);
	}

	.component-group {
		margin-bottom: var(--spacing-8, 2rem);
	}

	.component-group:last-child {
		margin-bottom: 0;
	}

	.component-group h4 {
		margin-bottom: var(--spacing-4, 1rem);
		color: var(--color-neutral-700, #374151);
	}

	/* Utility classes */
	.flex {
		display: flex;
	}

	.flex-col {
		flex-direction: column;
	}

	.gap-3 {
		gap: var(--spacing-3, 0.75rem);
	}

	.gap-4 {
		gap: var(--spacing-4, 1rem);
	}

	.gap-6 {
		gap: var(--spacing-6, 1.5rem);
	}

	.grid {
		display: grid;
	}

	.grid-cols-3 {
		grid-template-columns: repeat(3, 1fr);
	}

	.grid-cols-4 {
		grid-template-columns: repeat(4, 1fr);
	}

	.max-w-lg {
		max-width: 32rem;
	}

	/* Colors showcase */
	.color-palette {
		display: flex;
		gap: var(--spacing-2, 0.5rem);
		flex-wrap: wrap;
	}

	.color-swatch {
		width: 100px;
		height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm, 0.25rem);
		font-size: 0.75rem;
		font-weight: 600;
		border: 1px solid var(--color-neutral-200, #e5e7eb);
	}

	.color-block {
		padding: var(--spacing-6, 1.5rem);
		border-radius: var(--radius-md, 0.5rem);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2, 0.5rem);
		align-items: center;
		justify-content: center;
		min-height: 120px;
	}

	.color-block span {
		font-weight: 600;
		font-size: 1rem;
	}

	.color-block code {
		font-size: 0.75rem;
		opacity: 0.9;
	}

	/* Footer */
	.showcase-footer {
		text-align: center;
		padding: var(--spacing-8, 2rem) 0;
		margin-top: var(--spacing-16, 4rem);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.grid-cols-3,
		.grid-cols-4 {
			grid-template-columns: 1fr;
		}

		.main-content.with-sidebar {
			margin-left: 0;
		}
	}
</style>