import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ProductComponent } from './product.component';

describe('ProductComponent', () => {
	let component: ProductComponent;
	let fixture: ComponentFixture<ProductComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ProductComponent, HttpClientTestingModule, RouterTestingModule],
			schemas: [NO_ERRORS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(ProductComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
