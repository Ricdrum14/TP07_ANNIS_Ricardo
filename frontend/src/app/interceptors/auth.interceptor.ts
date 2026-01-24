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

  const token = store.selectSnapshot(AuthState.token);

  // ✅ Ne pas envoyer Authorization si pas de token valide
  if (typeof token === 'string' && token.trim().length > 0) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // ✅ Ton backend renvoie 403 quand token expiré/invalide
      if (error.status === 401 || error.status === 403) {
        console.warn('JWT invalide/expiré → logout');
        store.dispatch(new Logout());
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
