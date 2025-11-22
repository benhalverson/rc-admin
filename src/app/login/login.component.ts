import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { AuthService, MyFormData } from '../auth.service';

@Component({
	selector: 'app-login',
	imports: [ReactiveFormsModule, CommonModule],
	templateUrl: './login.component.html',
	styleUrl: './login.component.css',
})
export class LoginComponent {
	loginForm: FormGroup;
	private returnUrl: string = '/';

	constructor(
		private readonly router: Router,
		private readonly route: ActivatedRoute,
		private readonly auth: AuthService,
		private readonly fb: FormBuilder,
		private readonly toastr: ToastrService,
	) {
		this.loginForm = this.fb.group({
			email: ['', [Validators.required, Validators.email]],
			password: ['', Validators.required],
		});

		// Get the return URL from query params or default to '/'
		this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
	}

	async onSubmit() {
		if (!this.loginForm.valid) return;
		const formData: MyFormData = { ...this.loginForm.value };
		try {
			const result = await firstValueFrom(this.auth.signin(formData));
			const message = (result as { message?: string } | undefined)?.message;
			this.toastr.success(message || 'Login successful');
			this.router.navigateByUrl(this.returnUrl);
		} catch (error: unknown) {
			const err = error as { error?: { error?: string; details?: string } };
			this.toastr.error(
				`Failed to login. ${err.error?.error || err.error?.details || 'Unknown error'}`,
			);
		}
	}
}
