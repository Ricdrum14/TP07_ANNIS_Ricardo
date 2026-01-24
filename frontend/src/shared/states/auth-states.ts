import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { AuthStateModel } from './auth-states-model';
import { Login, Logout } from '../../actions/auth-actions';
import { UtilisateurService } from '../../app/services/utilisateur.service';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ClearFavoritesForCurrentUser } from '../../actions/favorite-actions';

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
        // Supporte backend {accessToken,user} ou {token,user}
        const token = response?.accessToken ?? response?.token ?? null;

        // Supporte backend { token, user } OU backend qui renvoie direct l'user
        // (si response.user existe => user = response.user, sinon response)
        const candidateUser = response?.user ?? response ?? null;

        // On vérifie que candidateUser ressemble à un user
        const user =
          candidateUser && typeof candidateUser === 'object' && 'id' in candidateUser
            ? candidateUser
            : null;

        if (!token || !user) {
          ctx.patchState({
            isConnected: false,
            user: null,
            token: null,
            isLoading: false,
            error: 'Réponse login invalide (token/user manquant)'
          });
          return;
        }

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
          error: err?.error?.message || err?.message || 'Erreur de connexion'
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
    // ✅ vide uniquement les favoris du user courant (guest/userId)
    ctx.dispatch(new ClearFavoritesForCurrentUser());

    ctx.setState({
      isConnected: false,
      user: null,
      token: null,
      error: null,
      isLoading: false
    });
  }
}
