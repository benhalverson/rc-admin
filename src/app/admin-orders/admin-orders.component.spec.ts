import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { AdminOrdersComponent } from './admin-orders.component';
import {
	type AdminOrderDetail,
	type AdminOrderListItem,
	AdminOrdersService,
} from './admin-orders.service';

describe('AdminOrdersComponent', () => {
	let component: AdminOrdersComponent;
	let fixture: ComponentFixture<AdminOrdersComponent>;
	let service: {
		listOrders: ReturnType<typeof vi.fn>;
		getOrder: ReturnType<typeof vi.fn>;
		retryOrder: ReturnType<typeof vi.fn>;
		cancelRefundOrder: ReturnType<typeof vi.fn>;
		reconcileOrder: ReturnType<typeof vi.fn>;
		resendNotification: ReturnType<typeof vi.fn>;
	};
	let toastr: {
		success: ReturnType<typeof vi.fn>;
		error: ReturnType<typeof vi.fn>;
		warning: ReturnType<typeof vi.fn>;
	};

	const order: AdminOrderListItem = {
		id: 12,
		orderNumber: 'ORD-12',
		userId: 'user_12',
		status: 'paid',
		slantStatus: 'PROCESSING',
		slantPublicOrderId: 'slant_12',
		customerEmail: 'buyer@example.com',
		createdAt: '2026-07-06T00:00:00.000Z',
	};

	const detail: AdminOrderDetail = {
		...order,
		filename: 'part.stl',
		fileURL: 'https://example.com/part.stl',
		stripeCheckoutSessionId: 'cs_test',
		stripePaymentIntentId: 'pi_test',
		shipToName: 'Buyer',
		shipToStreet1: '1 Main St',
		shipToStreet2: null,
		shipToCity: 'Phoenix',
		shipToState: 'AZ',
		shipToZip: '85001',
		shipToCountryISO: 'US',
		billToStreet1: null,
		billToStreet2: null,
		billToCity: null,
		billToState: null,
		billToZip: null,
		billToCountryISO: null,
		updatedAt: '2026-07-06T00:05:00.000Z',
		events: [
			{
				id: 1,
				type: 'created',
				detail: 'Order created',
				actor: 'system',
				createdAt: '2026-07-06T00:00:00.000Z',
			},
		],
	};

	beforeEach(async () => {
		service = {
			listOrders: vi.fn(),
			getOrder: vi.fn(),
			retryOrder: vi.fn(),
			cancelRefundOrder: vi.fn(),
			reconcileOrder: vi.fn(),
			resendNotification: vi.fn(),
		};
		toastr = {
			success: vi.fn(),
			error: vi.fn(),
			warning: vi.fn(),
		};

		service.listOrders.mockReturnValue(of({ orders: [order] }));
		service.getOrder.mockReturnValue(of(detail));
		service.retryOrder.mockReturnValue(of({ success: true }));
		service.cancelRefundOrder.mockReturnValue(of({ success: true }));
		service.reconcileOrder.mockReturnValue(
			of({
				success: true,
				orderId: order.id,
				resultStatus: 'recovered',
				detectedIssues: [],
				actionsTaken: [],
				recommendedAction: null,
				localStatus: 'paid',
				slantStatus: 'PROCESSING',
			}),
		);
		service.resendNotification.mockReturnValue(of({ success: true }));

		await TestBed.configureTestingModule({
			imports: [AdminOrdersComponent],
			providers: [
				{ provide: AdminOrdersService, useValue: service },
				{ provide: ToastrService, useValue: toastr },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(AdminOrdersComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('loads orders on init', () => {
		expect(service.listOrders).toHaveBeenCalled();
		expect(component.orders()).toEqual([order]);
		expect(fixture.nativeElement.textContent).toContain('ORD-12');
	});

	it('loads selected order detail', () => {
		const row = fixture.debugElement.query(By.css('tbody tr'));
		row.triggerEventHandler('click');
		fixture.detectChanges();

		expect(service.getOrder).toHaveBeenCalledWith(12);
		expect(component.selectedOrder()).toEqual(detail);
		expect(fixture.nativeElement.textContent).toContain('pi_test');
	});

	it('sends cancel and refund action for selected order', async () => {
		component.selectedOrder.set(detail);
		component.cancelReason = 'Customer request';
		component.cancelOverride = true;

		await component.cancelRefundSelected();

		expect(service.cancelRefundOrder).toHaveBeenCalledWith(12, {
			reason: 'Customer request',
			override: true,
		});
		expect(toastr.success).toHaveBeenCalledWith('Order canceled and refunded');
	});
});
