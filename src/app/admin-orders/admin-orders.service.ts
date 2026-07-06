import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminOrderListItem {
	id: number;
	orderNumber: string;
	userId: string;
	status: string | null;
	slantStatus: string | null;
	slantPublicOrderId: string | null;
	customerEmail: string | null;
	createdAt: string | null;
}

export interface AdminOrderEvent {
	id: number;
	type: string;
	detail: string | null;
	actor: string | null;
	createdAt: string;
}

export interface AdminOrderDetail extends AdminOrderListItem {
	filename: string | null;
	fileURL: string;
	stripeCheckoutSessionId: string | null;
	stripePaymentIntentId: string | null;
	shipToName: string;
	shipToStreet1: string;
	shipToStreet2: string | null;
	shipToCity: string;
	shipToState: string;
	shipToZip: string;
	shipToCountryISO: string;
	billToStreet1: string | null;
	billToStreet2: string | null;
	billToCity: string | null;
	billToState: string | null;
	billToZip: string | null;
	billToCountryISO: string | null;
	updatedAt: string | null;
	events: AdminOrderEvent[];
}

export interface AdminOrderFilters {
	q?: string;
	status?: string;
	slantStatus?: string;
	email?: string;
	orderNumber?: string;
}

export interface AdminOrderListResponse {
	orders: AdminOrderListItem[];
}

export interface AdminOrderActionResponse {
	success: boolean;
	event?: AdminOrderEvent;
	duplicate?: boolean;
	orderId?: number;
	status?: string;
	slantStatus?: string | null;
	stripeRefundId?: string | null;
	stripeRefundStatus?: string | null;
}

export interface AdminOrderReconcileResponse {
	success: boolean;
	orderId: number;
	resultStatus: string;
	detectedIssues: string[];
	actionsTaken: string[];
	recommendedAction: string | null;
	localStatus: string | null;
	slantStatus: string | null;
}

export interface CancelRefundRequest {
	reason?: string;
	override?: boolean;
}

@Injectable({
	providedIn: 'root',
})
export class AdminOrdersService {
	private readonly http = inject(HttpClient);
	readonly baseUrl = environment.baseurl;

	listOrders(
		filters: AdminOrderFilters = {},
	): Observable<AdminOrderListResponse> {
		return this.http.get<AdminOrderListResponse>(
			`${this.baseUrl}/admin/orders`,
			{
				params: this.toParams(filters),
			},
		);
	}

	getOrder(id: number): Observable<AdminOrderDetail> {
		return this.http.get<AdminOrderDetail>(
			`${this.baseUrl}/admin/orders/${id}`,
		);
	}

	retryOrder(id: number): Observable<AdminOrderActionResponse> {
		return this.http.post<AdminOrderActionResponse>(
			`${this.baseUrl}/admin/orders/${id}/retry`,
			{},
		);
	}

	cancelRefundOrder(
		id: number,
		request: CancelRefundRequest,
	): Observable<AdminOrderActionResponse> {
		return this.http.post<AdminOrderActionResponse>(
			`${this.baseUrl}/admin/orders/${id}/cancel-refund`,
			request,
		);
	}

	reconcileOrder(id: number): Observable<AdminOrderReconcileResponse> {
		return this.http.post<AdminOrderReconcileResponse>(
			`${this.baseUrl}/admin/orders/${id}/reconcile`,
			{},
		);
	}

	resendNotification(id: number): Observable<AdminOrderActionResponse> {
		return this.http.post<AdminOrderActionResponse>(
			`${this.baseUrl}/admin/orders/${id}/resend-notification`,
			{},
		);
	}

	private toParams(filters: AdminOrderFilters): HttpParams {
		let params = new HttpParams();
		for (const [key, value] of Object.entries(filters)) {
			const trimmed = value?.trim();
			if (trimmed) {
				params = params.set(key, trimmed);
			}
		}
		return params;
	}
}
