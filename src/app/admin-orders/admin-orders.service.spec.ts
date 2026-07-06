import {
	HttpClientTestingModule,
	HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { AdminOrdersService } from './admin-orders.service';

describe('AdminOrdersService', () => {
	let service: AdminOrdersService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [AdminOrdersService],
		});

		service = TestBed.inject(AdminOrdersService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('lists orders with non-empty filters', () => {
		service
			.listOrders({ q: 'abc', status: ' paid ', email: '' })
			.subscribe((response) => {
				expect(response.orders).toEqual([]);
			});

		const req = httpMock.expectOne(
			`${environment.baseurl}/admin/orders?q=abc&status=paid`,
		);
		expect(req.request.method).toBe('GET');
		req.flush({ orders: [] });
	});

	it('loads order detail', () => {
		service.getOrder(12).subscribe((response) => {
			expect(response.id).toBe(12);
		});

		const req = httpMock.expectOne(`${environment.baseurl}/admin/orders/12`);
		expect(req.request.method).toBe('GET');
		req.flush({ id: 12, events: [] });
	});

	it('requests cancel and refund with reason and override', () => {
		service
			.cancelRefundOrder(12, { reason: 'Customer request', override: true })
			.subscribe((response) => {
				expect(response.success).toBe(true);
			});

		const req = httpMock.expectOne(
			`${environment.baseurl}/admin/orders/12/cancel-refund`,
		);
		expect(req.request.method).toBe('POST');
		expect(req.request.body).toEqual({
			reason: 'Customer request',
			override: true,
		});
		req.flush({ success: true });
	});

	it('posts reconcile, retry, and resend actions', () => {
		service.reconcileOrder(12).subscribe();
		let req = httpMock.expectOne(
			`${environment.baseurl}/admin/orders/12/reconcile`,
		);
		expect(req.request.method).toBe('POST');
		req.flush({ success: true });

		service.retryOrder(12).subscribe();
		req = httpMock.expectOne(`${environment.baseurl}/admin/orders/12/retry`);
		expect(req.request.method).toBe('POST');
		req.flush({ success: true });

		service.resendNotification(12).subscribe();
		req = httpMock.expectOne(
			`${environment.baseurl}/admin/orders/12/resend-notification`,
		);
		expect(req.request.method).toBe('POST');
		req.flush({ success: true });
	});
});
