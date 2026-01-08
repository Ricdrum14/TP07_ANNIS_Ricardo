import { Action, Selector, State, StateContext } from '@ngxs/store';
import { FavoriteStateModel } from './favorite-state-model';
import { Pollution } from '../../app/models/pollution';
import {
  AddFavorite,
  RemoveFavorite,
  ClearFavorites
} from '../../actions/favorite-actions';

@State<FavoriteStateModel>({
  name: 'favorites',
  defaults: {
    favorites: [],
  },
})
export class FavoriteState {

  // =======================
  // ADD FAVORITE
  // =======================
  @Action(AddFavorite)
  addFavorite(
    { patchState, getState }: StateContext<FavoriteStateModel>,
    { payload }: AddFavorite
  ) {
    const favorites = getState().favorites || [];

    if (!favorites.some(p => p.id === payload.id)) {
      patchState({ favorites: [...favorites, payload] });
    }
  }

  // =======================
  // REMOVE FAVORITE
  // =======================
  @Action(RemoveFavorite)
  removeFavorite(
    { patchState, getState }: StateContext<FavoriteStateModel>,
    { payload }: RemoveFavorite
  ) {
    patchState({
      favorites: getState().favorites.filter(
        p => p.id !== payload.pollutionId
      )
    });
  }

  // =======================
  // CLEAR (LOGOUT)
  // =======================
  @Action(ClearFavorites)
  clearFavorites({ patchState }: StateContext<FavoriteStateModel>) {
    patchState({ favorites: [] });
  }

  // =======================
  // SELECTORS
  // =======================
  @Selector()
  static getFavorites(state: FavoriteStateModel): Pollution[] {
    return state.favorites;
  }

  @Selector()
  static getFavoritesCount(state: FavoriteStateModel): number {
    return state.favorites.length;
  }

  @Selector()
  static isFavorite(state: FavoriteStateModel) {
    return (id: string) => state.favorites.some(p => p.id === id);
  }
}
