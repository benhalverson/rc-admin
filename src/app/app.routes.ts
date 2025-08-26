import { Routes } from '@angular/router';
import { ProductComponent } from './product/product.component';
import { LoginComponent } from './login/login.component';
import { AddProductComponent } from './add-product/add-product.component';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    component: ProductComponent,
    canActivate: [authGuard]
  },
  {
    path: 'product/:id',
    component: ProductDetailsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'add-product',
    component: AddProductComponent,
    canActivate: [authGuard]
  },
  {
    path: 'signin',
    component: LoginComponent,
    canActivate: [guestGuard]
  },
  {
    path: '**',
    redirectTo: '/signin'
  }
];
