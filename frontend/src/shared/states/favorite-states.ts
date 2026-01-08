import { Action, Selector, State, StateContext } from '@ngxs/store';
import { FavoriteStateModel } from './favorite-state-model';
import { Pollution } from '../../app/models/pollution';

import {
  AddFavorite,
  RemoveFavorite,
  ClearFavorites,
  LoadFavoritesFromStorage,
} from '../../actions/favorite-actions';

@State<FavoriteStateModel>({
  name: 'favorites',
  defaults: {
    favorites: [],
  },
})
export class FavoriteState {

  /* ============================================================
     Helper — Récupérer l’ID utilisateur depuis localStorage
  ============================================================ */
  private getUserId(): string {
    try {
      // Prefer NGXS persisted auth state (key: 'auth')
      const ngxsAuth = localStorage.getItem('auth');
      if (ngxsAuth) {
        const parsed = JSON.parse(ngxsAuth);
        const user = parsed?.user;
        return user?.id?.toString() || 'guest';
      }

      // Fallback to legacy key used previously
      const auth = JSON.parse(localStorage.getItem('auth_user') || '{}');
      return auth?.id?.toString() || 'guest';
    } catch {
      return 'guest';
    }
  }

  /* ============================================================
     AJOUT FAVORI
  ============================================================ */
  @Action(AddFavorite)
  addFavorite(
    { patchState, getState }: StateContext<FavoriteStateModel>,
    { payload }: AddFavorite
  ) {
    const favorites = getState().favorites || [];

    if (!favorites.some(p => p.id === payload.id)) {
      const updated = [...favorites, payload];
      patchState({ favorites: updated });

      const key = `favorites_${this.getUserId()}`;
      localStorage.setItem(key, JSON.stringify(updated));
    }
  }

  /* ============================================================
     SUPPRIMER FAVORI
  ============================================================ */
  @Action(RemoveFavorite)
  removeFavorite(
    { patchState, getState }: StateContext<FavoriteStateModel>,
    { payload }: RemoveFavorite
  ) {
    const updated = (getState().favorites || []).filter(
      p => p.id !== payload.pollutionId
    );

    patchState({ favorites: updated });

    const key = `favorites_${this.getUserId()}`;
    localStorage.setItem(key, JSON.stringify(updated));
  }

  /* ============================================================
     CLEAR ALL (Déconnexion)
  ============================================================ */
  @Action(ClearFavorites)
  clearFavorites({ patchState }: StateContext<FavoriteStateModel>) {
    
    patchState({ favorites: [] });
  }

  /* ============================================================
     CHARGE FAVORIS DU USER COURANT
  ============================================================ */
  @Action(LoadFavoritesFromStorage)
  loadFavoritesFromStorage({ patchState }: StateContext<FavoriteStateModel>) {
    const key = `favorites_${this.getUserId()}`;
    const stored = localStorage.getItem(key);
    patchState({
      favorites: stored ? JSON.parse(stored) : [],
    });
  }

  /* ============================================================
     SELECTORS
  ============================================================ */
  @Selector()
  static getFavorites(state: FavoriteStateModel): Pollution[] {
    return state.favorites || [];
  }

  @Selector()
  static getFavoritesCount(state: FavoriteStateModel): number {
    return (state.favorites || []).length;
  }

  @Selector()
  static isFavorite(state: FavoriteStateModel) {
    return (id: string) => (state.favorites || []).some(p => p.id === id);
  }
}
