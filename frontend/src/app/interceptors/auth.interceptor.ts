import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Store } from '@ngxs/store';
import { AuthState } from '../../shared/states/auth-states';
import { Logout } from '../../actions/auth-actions';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);
  const router = inject(Router);

  // ✅ SOURCE UNIQUE : NGXS STORE
  const token = store.selectSnapshot(AuthState.token);

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('JWT invalide ou expiré → logout');
        store.dispatch(new Logout());
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
