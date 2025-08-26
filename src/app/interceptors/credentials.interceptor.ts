import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // Only add credentials for requests to our backend API
  if (req.url.startsWith(environment.baseurl)) {
    let credentialsReq = req.clone({
      withCredentials: true
    });

    // Only set Content-Type for JSON requests or if no Content-Type is already set
    // Don't override Content-Type for FormData, multipart, or other content types
    if (!req.headers.has('Content-Type') &&
        req.body &&
        typeof req.body === 'object' &&
        !(req.body instanceof FormData) &&
        !(req.body instanceof ArrayBuffer) &&
        !(req.body instanceof Blob)) {
      credentialsReq = credentialsReq.clone({
        setHeaders: {
          'Content-Type': 'application/json'
        }
      });
    }

    return next(credentialsReq);
  }

  return next(req);
};
