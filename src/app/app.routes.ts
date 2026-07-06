import type { Routes } from '@angular/router';
import { AddProductComponent } from './add-product/add-product.component';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { LoginComponent } from './login/login.component';
import { ProductComponent } from './product/product.component';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { colorOptionsResolver } from './resolvers/color-options.resolver';

export const routes: Routes = [
	{
		path: '',
		component: ProductComponent,
		canActivate: [authGuard],
	},
	{
		path: 'product/:id',
		component: ProductDetailsComponent,
		canActivate: [authGuard],
		resolve: {
			colorOptions: colorOptionsResolver,
		},
	},
	{
		path: 'add-product',
		component: AddProductComponent,
		canActivate: [authGuard],
	},
	{
		path: 'orders',
		loadComponent: () =>
			import('./admin-orders/admin-orders.component').then(
				(m) => m.AdminOrdersComponent,
			),
		canActivate: [authGuard],
	},
	{
		path: 'signin',
		component: LoginComponent,
		canActivate: [guestGuard],
	},
	{
		path: '**',
		redirectTo: '/signin',
	},
];
