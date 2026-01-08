import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { AuthState } from '../../shared/states/auth-states';
import { Logout } from '../../actions/auth-actions';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private store: Store, private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // 🔹 Récupère le token du store
    let token = this.store.selectSnapshot(AuthState.token);

    // 🔹 Fallback: si NGXS n'a pas encore restauré le state, lire la clé persistée 'auth' dans localStorage
    if (!token) {
      try {
        const raw = localStorage.getItem('auth');
        if (raw) {
          const parsed = JSON.parse(raw);
          token = parsed?.token || null;
        }
      } catch (e) {
        // ignore parse errors
      }
    }

    // 🔹 Si token existe, l'ajoute au header Authorization
    if (token) {
      // eslint-disable-next-line no-console
      console.debug('AuthInterceptor: attaching token', token ? 'present' : 'missing');
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // 🔹 Si 401 (Unauthorized) → token expiré, logout
        if (error.status === 401) {
          console.warn('⚠️ Token expiré, déconnexion...');
          this.store.dispatch(new Logout());
          this.router.navigate(['/login']);
        }

        return throwError(() => error);
      })
    );
  }
}
