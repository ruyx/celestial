<script lang="ts">
	/**
	 * Header Component - Retea App
	 * Header principal con logo, navegación y usuario
	 */

	import logo from '$lib/assets/logo.svg';

	interface Props {
		userRole?: 'admin' | 'installer' | 'client' | null;
		userName?: string;
	}

	let {
		userRole = null,
		userName = ''
	}: Props = $props();

	const isLoggedIn = $derived(userRole !== null);
</script>

<header class="header-top">
	<div class="header-container">
		<!-- Logo -->
		<a href="/" class="header-logo">
			<img src={logo} alt="Retea" />
			<span class="header-logo-text">Retea</span>
		</a>

		<!-- Navigation (si está logueado) -->
		{#if isLoggedIn}
			<nav class="header-nav">
				{#if userRole === 'admin'}
					<a href="/dashboard" class="nav-link">Dashboard</a>
					<a href="/campaigns" class="nav-link">Campañas</a>
					<a href="/installers" class="nav-link">Instaladores</a>
				{:else if userRole === 'installer'}
					<a href="/dashboard" class="nav-link">Mis Trabajos</a>
					<a href="/profile" class="nav-link">Perfil</a>
				{:else if userRole === 'client'}
					<a href="/dashboard" class="nav-link">Mis Campañas</a>
					<a href="/reports" class="nav-link">Informes</a>
				{/if}
			</nav>

			<!-- User menu -->
			<div class="header-user">
				<span class="user-name">{userName}</span>
				<button class="btn-tertiary btn-sm">
					Cerrar sesión
				</button>
			</div>
		{:else}
			<!-- Login button si no está logueado -->
			<div class="header-actions">
				<a href="/auth/login" class="btn-secondary btn-sm">
					Iniciar sesión
				</a>
			</div>
		{/if}
	</div>
</header>

<style>
	.header-top {
		position: sticky;
		top: 0;
		left: 0;
		right: 0;
		height: 90px;
		background: var(--color-neutral-0, #ffffff);
		border-bottom: 1px solid var(--color-neutral-200, #e5e7eb);
		filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.02));
		z-index: 99;
	}

	.header-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 100%;
		max-width: 1536px;
		margin: 0 auto;
		padding: 0 var(--spacing-6, 1.5rem);
	}

	.header-logo {
		display: flex;
		align-items: center;
		gap: var(--spacing-3, 0.75rem);
		text-decoration: none;
		transition: opacity 150ms;
	}

	.header-logo:hover {
		opacity: 0.8;
	}

	.header-logo img {
		height: 40px;
		width: auto;
	}

	.header-logo-text {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-primary, #3aa7a3);
	}

	.header-nav {
		display: flex;
		align-items: center;
		gap: var(--spacing-6, 1.5rem);
		flex: 1;
		margin-left: var(--spacing-12, 3rem);
	}

	.nav-link {
		font-family: var(--font-body);
		font-size: 1rem;
		font-weight: 500;
		color: var(--color-neutral-700, #374151);
		text-decoration: none;
		padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
		border-radius: var(--radius-sm, 0.25rem);
		transition: all 150ms;
	}

	.nav-link:hover {
		background: var(--color-primary-50, #9dd9d2);
		color: var(--color-primary, #3aa7a3);
	}

	.header-user {
		display: flex;
		align-items: center;
		gap: var(--spacing-4, 1rem);
	}

	.user-name {
		font-family: var(--font-body);
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-neutral-700, #374151);
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--spacing-3, 0.75rem);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.header-nav {
			display: none; /* Mobile menu pendiente */
		}

		.user-name {
			display: none;
		}
	}
</style>
