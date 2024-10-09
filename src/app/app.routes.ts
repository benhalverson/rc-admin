import { Routes } from '@angular/router';
import { ProductComponent } from './product/product.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
  {
    path: '',
    component: ProductComponent
  },
  {
    path: 'add-product',
    component: ProductComponent
  },
  {
    path: 'login',
    component: LoginComponent
  }
];
