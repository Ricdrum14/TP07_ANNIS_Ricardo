import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { AuthStateModel } from './auth-states-model';
import { Login, Logout } from '../../actions/auth-actions';
import { UtilisateurService } from '../../app/services/utilisateur.service';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ClearFavorites } from '../../actions/favorite-actions';

@State<AuthStateModel>({
  name: 'auth',
  defaults: {
    isConnected: false,
    user: null,
    token: null,
    error: null,
    isLoading: false
  }
})
@Injectable()
export class AuthState {

  constructor(private utilisateurService: UtilisateurService) {}

  // =======================
  // SELECTORS
  // =======================
  @Selector()
  static isConnected(state: AuthStateModel) {
    return state.isConnected;
  }

  @Selector()
  static currentUser(state: AuthStateModel) {
    return state.user;
  }

  @Selector()
  static token(state: AuthStateModel) {
    return state.token;
  }

  @Selector()
  static isLoading(state: AuthStateModel) {
    return state.isLoading;
  }

  @Selector()
  static error(state: AuthStateModel) {
    return state.error;
  }

  // =======================
  // LOGIN
  // =======================
  @Action(Login)
  login(ctx: StateContext<AuthStateModel>, { payload }: Login) {
    ctx.patchState({ isLoading: true, error: null });

    return this.utilisateurService.login(payload.email, payload.password).pipe(
      tap((response: any) => {
        const token = response.accessToken ?? response.token;
        const user = response.user ?? response;

        ctx.patchState({
          isConnected: true,
          user,
          token,
          isLoading: false,
          error: null
        });
      }),
      catchError(err => {
        ctx.patchState({
          isConnected: false,
          user: null,
          token: null,
          isLoading: false,
          error: err?.error?.message || 'Erreur de connexion'
        });
        return of(null);
      })
    );
  }

  // =======================
  // LOGOUT
  // =======================
  @Action(Logout)
  logout(ctx: StateContext<AuthStateModel>) {
    ctx.dispatch(new ClearFavorites());

    // ✅ reset du state → NGXS Storage écrase automatiquement le storage
    ctx.setState({
      isConnected: false,
      user: null,
      token: null,
      error: null,
      isLoading: false
    });
  }
}
