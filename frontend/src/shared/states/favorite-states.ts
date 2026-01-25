import { Injectable } from '@angular/core';
import { Action, State, StateContext, Store, createSelector } from '@ngxs/store';
import { FavoriteStateModel } from './favorite-state-model';
import { Pollution } from '../../app/models/pollution';
import {
  AddFavorite,
  RemoveFavorite,
  ClearFavoritesForCurrentUser,
  ClearAllFavorites
} from '../../actions/favorite-actions';
import { AuthState } from './auth-states';

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
  // Helpers
  // -----------------------
  private normalizeId(id: string | number | undefined | null): string {
    return String(id ?? '');
  }

  private getUserKeyFromStore(): string {
    const user = this.store.selectSnapshot(AuthState.currentUser);
    // ✅ si user existe -> clé user.id, sinon guest
    return user?.id != null ? String(user.id) : 'guest';
  }

  // -----------------------
  // ACTIONS
  // -----------------------
  @Action(AddFavorite)
  addFavorite(ctx: StateContext<FavoriteStateModel>, { payload }: AddFavorite) {
    const state = ctx.getState();

    // ✅ Si localStorage contient encore l'ancien format, on sécurise
    const favoritesByUser = state.favoritesByUser ?? {};

    const key = this.getUserKeyFromStore();
    const current = favoritesByUser[key] ?? [];

    const payloadId = this.normalizeId((payload as any).id);

    if (current.some(p => this.normalizeId((p as any).id) === payloadId)) return;

    ctx.patchState({
      favoritesByUser: {
        ...favoritesByUser,
        [key]: [...current, payload]
      }
    });
  }

  @Action(RemoveFavorite)
  removeFavorite(ctx: StateContext<FavoriteStateModel>, { payload }: RemoveFavorite) {
    const state = ctx.getState();
    const favoritesByUser = state.favoritesByUser ?? {};

    const key = this.getUserKeyFromStore();
    const current = favoritesByUser[key] ?? [];

    const idToRemove = this.normalizeId(payload.pollutionId);

    ctx.patchState({
      favoritesByUser: {
        ...favoritesByUser,
        [key]: current.filter(p => this.normalizeId((p as any).id) !== idToRemove)
      }
    });
  }

  @Action(ClearFavoritesForCurrentUser)
  clearFavoritesForCurrentUser(ctx: StateContext<FavoriteStateModel>) {
    const state = ctx.getState();
    const favoritesByUser = state.favoritesByUser ?? {};

    const key = this.getUserKeyFromStore();

    ctx.patchState({
      favoritesByUser: {
        ...favoritesByUser,
        [key]: []
      }
    });
  }

  @Action(ClearAllFavorites)
  clearAllFavorites(ctx: StateContext<FavoriteStateModel>) {
    ctx.patchState({ favoritesByUser: {} });
  }

  // -----------------------
  // SELECTORS (✅ via createSelector)
  // -----------------------
  static getFavorites = createSelector(
    [FavoriteState, AuthState],
    (fav: FavoriteStateModel, auth: any): Pollution[] => {
      const favoritesByUser = fav.favoritesByUser ?? {};
      const key = auth?.user?.id != null ? String(auth.user.id) : 'guest';
      return favoritesByUser[key] ?? [];
    }
  );

  static getFavoritesCount = createSelector(
    [FavoriteState.getFavorites],
    (favorites: Pollution[]): number => favorites.length
  );

  static isFavorite = createSelector(
    [FavoriteState.getFavorites],
    (favorites: Pollution[]) => {
      return (id: string | number) => {
        const sid = String(id);
        return favorites.some(p => String((p as any).id) === sid);
      };
    }
  );
}
