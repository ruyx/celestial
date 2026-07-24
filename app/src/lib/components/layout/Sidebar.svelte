<script lang="ts">
	/**
	 * Sidebar Component - Retea App
	 * Navegación lateral para admin/installer/client
	 */

	interface NavItem {
		label: string;
		href: string;
		icon?: string;
		badge?: string;
	}

	interface Props {
		userRole?: 'admin' | 'installer' | 'client';
		activeRoute?: string;
	}

	let {
		userRole = 'admin',
		activeRoute = '/dashboard'
	}: Props = $props();

	// Navigation items based on role
	const navItems: Record<string, NavItem[]> = {
		admin: [
			{ label: 'Dashboard', href: '/dashboard' },
			{ label: 'Campañas', href: '/campaigns' },
			{ label: 'Instaladores', href: '/installers' },
			{ label: 'Clientes', href: '/clients' },
			{ label: 'Configuración', href: '/settings' }
		],
		installer: [
			{ label: 'Mis Trabajos', href: '/dashboard' },
			{ label: 'Historial', href: '/history' },
			{ label: 'Perfil', href: '/profile' }
		],
		client: [
			{ label: 'Mis Campañas', href: '/dashboard' },
			{ label: 'Nueva Campaña', href: '/campaigns/new' },
			{ label: 'Informes', href: '/reports' },
			{ label: 'Configuración', href: '/settings' }
		]
	};

	const items = $derived(navItems[userRole] || []);
</script>

<aside class="sidebar">
	<nav class="sidebar-nav">
		{#each items as item}
			<a
				href={item.href}
				class="sidebar-link"
				class:active={activeRoute === item.href}
			>
				<span class="sidebar-link-label">{item.label}</span>
				{#if item.badge}
					<span class="sidebar-link-badge badge badge-primary">
						{item.badge}
					</span>
				{/if}
			</a>
		{/each}
	</nav>
</aside>

<style>
	.sidebar {
		position: fixed;
		top: 90px; /* Debajo del header */
		left: 0;
		width: 274px;
		height: calc(100vh - 90px);
		background: var(--color-neutral-0, #ffffff);
		border-right: 1px solid var(--color-neutral-200, #e5e7eb);
		overflow-y: auto;
		z-index: 50;
	}

	.sidebar-nav {
		display: flex;
		flex-direction: column;
		padding: var(--spacing-6, 1.5rem) var(--spacing-4, 1rem);
		gap: var(--spacing-2, 0.5rem);
	}

	.sidebar-link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-3, 0.75rem) var(--spacing-4, 1rem);
		border-radius: var(--radius-md, 0.5rem);
		font-family: var(--font-body);
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-neutral-700, #374151);
		text-decoration: none;
		transition: all 150ms;
	}

	.sidebar-link:hover {
		background: var(--color-neutral-100, #f3f4f6);
		color: var(--color-primary, #3aa7a3);
	}

	.sidebar-link.active {
		background: var(--color-primary-50, #9dd9d2);
		color: var(--color-primary, #3aa7a3);
		font-weight: 600;
	}

	.sidebar-link-label {
		flex: 1;
	}

	.sidebar-link-badge {
		font-size: 0.75rem;
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.sidebar {
			transform: translateX(-100%);
			transition: transform 250ms;
		}

		.sidebar.open {
			transform: translateX(0);
		}
	}
</style>
