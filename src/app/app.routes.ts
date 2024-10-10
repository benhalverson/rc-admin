import { Routes } from '@angular/router';
import { ProductComponent } from './product/product.component';
import { LoginComponent } from './login/login.component';
import { AddProductComponent } from './add-product/add-product.component';

export const routes: Routes = [
  {
    path: '',
    component: ProductComponent
  },
  {
    path: 'add-product',
    component: AddProductComponent
  },
  {
    path: 'login',
    component: LoginComponent
  }
];
