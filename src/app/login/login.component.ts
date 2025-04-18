import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginForm: FormGroup;
  constructor(
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly fb: FormBuilder,
    private readonly toastr: ToastrService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      const formData = {
        ...this.loginForm.value,
      };
      try {
         await firstValueFrom(this.auth.signin(formData)).then((response: any) => {
          this.toastr.success(`${response.message}`);
         }).catch((error) => {
          this.toastr.error(`Failed to login. ${error.error.error}`);
         });
         this.router.navigate(['/add-product']);

      } catch (error: any) {
        this.toastr.error(`Failed to login. ${error.details}`);
      }
    }
  }
}
