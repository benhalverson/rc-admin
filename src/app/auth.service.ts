import { Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private readonly http: HttpClient) { }

  signin(formData: FormData) {
    return this.http.post(
      `${environment.baseurl}/signin`,
      { email: formData.email, password: formData.password },
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      }
    );
  }
}

export interface FormData {
  email: string;
  password: string;
}
