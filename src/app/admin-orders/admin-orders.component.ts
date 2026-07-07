import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize, firstValueFrom } from 'rxjs';
import {
	type AdminOrderDetail,
	type AdminOrderFilters,
	type AdminOrderListItem,
	AdminOrdersService,
} from './admin-orders.service';

@Component({
	selector: 'app-admin-orders',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './admin-orders.component.html',
	styleUrl: './admin-orders.component.css',
})
export class AdminOrdersComponent implements OnInit {
	private readonly ordersService = inject(AdminOrdersService);
	private readonly toastr = inject(ToastrService);

	orders = signal<AdminOrderListItem[]>([]);
	selectedOrder = signal<AdminOrderDetail | null>(null);
	isLoading = signal(false);
	isDetailLoading = signal(false);
	error = signal<string | null>(null);
	activeAction = signal<string | null>(null);

	filters: AdminOrderFilters = {
		q: '',
		status: '',
		slantStatus: '',
		email: '',
		orderNumber: '',
	};
	cancelReason = '';
	cancelOverride = false;

	visibleEvents = computed(() => this.selectedOrder()?.events ?? []);

	ngOnInit(): void {
		this.loadOrders();
	}

	loadOrders(): void {
		this.isLoading.set(true);
		this.error.set(null);

		this.ordersService
			.listOrders(this.filters)
			.pipe(finalize(() => this.isLoading.set(false)))
			.subscribe({
				next: (response) => {
					this.orders.set(response.orders);
					const selectedId = this.selectedOrder()?.id;
					if (
						selectedId &&
						!response.orders.some((order) => order.id === selectedId)
					) {
						this.selectedOrder.set(null);
					}
				},
				error: (error) => {
					this.error.set(this.errorMessage(error, 'Unable to load orders'));
				},
			});
	}

	clearFilters(): void {
		this.filters = {
			q: '',
			status: '',
			slantStatus: '',
			email: '',
			orderNumber: '',
		};
		this.loadOrders();
	}

	selectOrder(order: AdminOrderListItem): void {
		this.isDetailLoading.set(true);
		this.error.set(null);

		this.ordersService
			.getOrder(order.id)
			.pipe(finalize(() => this.isDetailLoading.set(false)))
			.subscribe({
				next: (detail) => {
					this.selectedOrder.set(detail);
				},
				error: (error) => {
					this.error.set(this.errorMessage(error, 'Unable to load order'));
				},
			});
	}

	isSelected(order: AdminOrderListItem): boolean {
		return this.selectedOrder()?.id === order.id;
	}

	async retrySelected(): Promise<void> {
		await this.runSelectedAction('retry', 'Retry queued', async (orderId) => {
			await firstValueFrom(this.ordersService.retryOrder(orderId));
		});
	}

	async reconcileSelected(): Promise<void> {
		await this.runSelectedAction(
			'reconcile',
			'Order reconciled',
			async (orderId) => {
				const result = await firstValueFrom(
					this.ordersService.reconcileOrder(orderId),
				);
				if (result.recommendedAction) {
					this.toastr.warning(result.recommendedAction, 'Reconciliation');
				}
			},
		);
	}

	async resendSelectedNotification(): Promise<void> {
		await this.runSelectedAction(
			'resend-notification',
			'Notification resent',
			async (orderId) => {
				await firstValueFrom(this.ordersService.resendNotification(orderId));
			},
		);
	}

	async cancelRefundSelected(): Promise<void> {
		await this.runSelectedAction(
			'cancel-refund',
			'Order canceled and refunded',
			async (orderId) => {
				await firstValueFrom(
					this.ordersService.cancelRefundOrder(orderId, {
						reason: this.cancelReason.trim() || undefined,
						override: this.cancelOverride,
					}),
				);
				this.cancelReason = '';
				this.cancelOverride = false;
			},
		);
	}

	isActionRunning(action: string): boolean {
		return this.activeAction() === action;
	}

	statusTone(status: string | null): string {
		const base =
			'inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold uppercase';
		switch ((status ?? '').toLowerCase()) {
			case 'paid':
			case 'processing':
			case 'retrying':
				return `${base} border-[#00A7B5]/30 bg-[#00A7B5]/10 text-[#006F78]`;
			case 'shipped':
			case 'delivered':
			case 'fulfilled':
			case 'completed':
				return `${base} border-emerald-200 bg-emerald-50 text-emerald-800`;
			case 'failed':
			case 'error':
				return `${base} border-red-200 bg-red-50 text-[#C2410C]`;
			case 'canceled':
			case 'cancelled':
				return `${base} border-[#B8B2A3] bg-[#ECEAE1] text-neutral-700`;
			default:
				return `${base} border-amber-200 bg-amber-50 text-amber-800`;
		}
	}

	private async runSelectedAction(
		action: string,
		successMessage: string,
		execute: (orderId: number) => Promise<void>,
	): Promise<void> {
		const order = this.selectedOrder();
		if (!order) {
			return;
		}

		this.activeAction.set(action);
		this.error.set(null);

		try {
			await execute(order.id);
			this.toastr.success(successMessage);
			this.loadOrders();
			this.selectOrder(order);
		} catch (error) {
			const message = this.errorMessage(error, 'Action failed');
			this.error.set(message);
			this.toastr.error(message);
		} finally {
			this.activeAction.set(null);
		}
	}

	private errorMessage(error: unknown, fallback: string): string {
		if (
			error &&
			typeof error === 'object' &&
			'error' in error &&
			error.error &&
			typeof error.error === 'object' &&
			'error' in error.error &&
			typeof error.error.error === 'string'
		) {
			return error.error.error;
		}

		if (error instanceof Error) {
			return error.message;
		}

		return fallback;
	}
}
