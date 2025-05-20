import { Routes } from '@angular/router';
import { ProductComponent } from './product/product.component';
import { LoginComponent } from './login/login.component';
import { AddProductComponent } from './add-product/add-product.component';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { colorOptionsResolver } from './resolvers/color-options.resolver';

export const routes: Routes = [
  {
    path: '',
    component: ProductComponent
  },
  {
    path: 'product/:id',
    component: ProductDetailsComponent,
    resolve: {
      colorOptions: colorOptionsResolver
    }
  },
  {
    path: 'add-product',
    component: AddProductComponent,
    resolve: {
      colorOptions: colorOptionsResolver
    }
  },
  {
    path: 'signin',
    component: LoginComponent
  }
];
