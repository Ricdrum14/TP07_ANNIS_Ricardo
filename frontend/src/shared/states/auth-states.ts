import { Injectable } from "@angular/core";
import { State, Action, StateContext, Selector } from "@ngxs/store";
import { AuthStateModel } from "./auth-states-model";
import {
  Login,
  LoginSuccess,
  LoginFailure,
  Logout,
  LoadAuthFromStorage
} from "../../actions/auth-actions";
import { UtilisateurService } from "../../app/services/utilisateur.service";
import { tap, catchError } from "rxjs/operators";
import { of } from "rxjs";
import { ClearFavorites } from "../../actions/favorite-actions";

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
  login({ patchState }: StateContext<AuthStateModel>, { payload }: Login) {

    patchState({ isLoading: true, error: null });

    return this.utilisateurService.login(payload.email, payload.password).pipe(
      tap((response: any) => {
        // 🔹 Récupère le token JWT retourné par le backend
        const token = response.token;
        const user = response.user || response;

        patchState({
          isConnected: true,
          user,
          token,
          isLoading: false,
          error: null
        });
        // 📦 NgxsStoragePlugin persiste automatiquement le state 'auth'
      }),
      catchError(err => {
        patchState({
          isConnected: false,
          user: null,
          token: null,
          isLoading: false,
          error: err.message || 'Erreur de connexion'
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

    // Nettoyer favoris du user courant
    ctx.dispatch(new ClearFavorites());
    // Nettoyer auth state (NgxsStoragePlugin persiste/restaure automatiquement)
    ctx.patchState({
      isConnected: false,
      user: null,
      token: null,
      error: null,
      isLoading: false
    });
  }

  // =======================
  // LOAD AUTH FROM STORAGE
  // =======================
  @Action(LoadAuthFromStorage)
  loadAuth({ patchState }: StateContext<AuthStateModel>) {
    // NgxsStoragePlugin restaure automatiquement le state 'auth' depuis le localStorage.
    // Cette action s'exécute au démarrage pour charger le token persisté.
    try {
      const raw = localStorage.getItem('auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.token && parsed?.user) {
          patchState({
            isConnected: true,
            user: parsed.user,
            token: parsed.token,
            error: null,
            isLoading: false
          });
        }
      }
    } catch (e) {
      console.error('Failed to load auth from storage:', e);
    }
  }
}
