import { Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private readonly http: HttpClient) { }

  signin(formData: MyFormData): Observable<any> {
    console.log('environment', environment);
    return this.http.post(
      `${environment.baseurl}/auth/signin`,
      { email: formData.email, password: formData.password },
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      }
    );
  }
}

export interface MyFormData {
  email: string;
  password: string;
}
