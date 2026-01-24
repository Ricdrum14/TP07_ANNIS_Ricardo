import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext, Store } from '@ngxs/store';
import { FavoriteStateModel } from './favorite-state-model';
import { Pollution } from '../../app/models/pollution';
import {
  AddFavorite,
  RemoveFavorite,
  ClearFavoritesForCurrentUser,
  ClearAllFavorites,
  LoadFavoritesFromStorage
} from '../../actions/favorite-actions';
import { AuthState } from './auth-states';

type LegacyFavoriteStateModel = {
  favorites?: Pollution[]; // ancien format
  favoritesByUser?: Record<string, Pollution[]>; // nouveau format
};

@State<FavoriteStateModel>({
  name: 'favorites',
  defaults: {
    favoritesByUser: {}
  }
})
@Injectable()
export class FavoriteState {
  constructor(private store: Store) {}

  // -----------------------
  // Helper: clé utilisateur
  // -----------------------
  private getUserKey(): string {
    const isConnected = this.store.selectSnapshot(AuthState.isConnected);
    const user = this.store.selectSnapshot(AuthState.currentUser);
    return (!isConnected || !user?.id) ? 'guest' : String(user.id);
  }

  // -----------------------
  // Migration / normalisation
  // -----------------------
  private normalizeState(state: any): FavoriteStateModel {
    const s = (state ?? {}) as LegacyFavoriteStateModel;

    // ✅ Déjà au nouveau format
    if (s.favoritesByUser && typeof s.favoritesByUser === 'object') {
      return { favoritesByUser: s.favoritesByUser };
    }

    // ✅ Ancien format détecté → on le migre vers guest
    if (Array.isArray(s.favorites)) {
      return { favoritesByUser: { guest: s.favorites } };
    }

    // ✅ Fallback safe
    return { favoritesByUser: {} };
  }

  // -----------------------
  // ACTIONS
  // -----------------------

  // Optionnel : déclenche une normalisation si besoin (utile si tu appelles depuis login ou app start)
  @Action(LoadFavoritesFromStorage)
  loadFavoritesFromStorage(ctx: StateContext<FavoriteStateModel>) {
    const normalized = this.normalizeState(ctx.getState());
    ctx.setState(normalized);
  }

  @Action(AddFavorite)
  addFavorite(ctx: StateContext<FavoriteStateModel>, { payload }: AddFavorite) {
    const normalized = this.normalizeState(ctx.getState());
    const key = this.getUserKey();
    const current = normalized.favoritesByUser[key] ?? [];

    if (current.some(p => p.id === payload.id)) return;

    ctx.setState({
      favoritesByUser: {
        ...normalized.favoritesByUser,
        [key]: [...current, payload]
      }
    });
  }

  @Action(RemoveFavorite)
  removeFavorite(ctx: StateContext<FavoriteStateModel>, { payload }: RemoveFavorite) {
    const normalized = this.normalizeState(ctx.getState());
    const key = this.getUserKey();
    const current = normalized.favoritesByUser[key] ?? [];

    ctx.setState({
      favoritesByUser: {
        ...normalized.favoritesByUser,
        [key]: current.filter(p => p.id !== payload.pollutionId)
      }
    });
  }

  @Action(ClearFavoritesForCurrentUser)
  clearFavoritesForCurrentUser(ctx: StateContext<FavoriteStateModel>) {
    const normalized = this.normalizeState(ctx.getState());
    const key = this.getUserKey();

    ctx.setState({
      favoritesByUser: {
        ...normalized.favoritesByUser,
        [key]: []
      }
    });
  }

  @Action(ClearAllFavorites)
  clearAllFavorites(ctx: StateContext<FavoriteStateModel>) {
    ctx.setState({ favoritesByUser: {} });
  }

  // -----------------------
  // SELECTORS (safe)
  // -----------------------
  @Selector([AuthState.isConnected, AuthState.currentUser])
  static getFavorites(state: FavoriteStateModel, isConnected: boolean, user: any): Pollution[] {
    const map = state?.favoritesByUser ?? {};
    const key = (!isConnected || !user?.id) ? 'guest' : String(user.id);
    return map[key] ?? [];
  }

  @Selector([AuthState.isConnected, AuthState.currentUser])
  static getFavoritesCount(state: FavoriteStateModel, isConnected: boolean, user: any): number {
    const map = state?.favoritesByUser ?? {};
    const key = (!isConnected || !user?.id) ? 'guest' : String(user.id);
    return (map[key] ?? []).length;
  }

  @Selector([AuthState.isConnected, AuthState.currentUser])
  static isFavorite(state: FavoriteStateModel, isConnected: boolean, user: any) {
    const map = state?.favoritesByUser ?? {};
    const key = (!isConnected || !user?.id) ? 'guest' : String(user.id);
    return (id: string) => (map[key] ?? []).some(p => p.id === id);
  }
}
