import { Pollution } from "../app/models/pollution";

export class AddFavorite {
  static readonly type = '[Favorite] Add Favorite';
  constructor(public payload: Pollution) {}
}

export class RemoveFavorite {
  static readonly type = '[Favorite] Remove Favorite';
  constructor(public payload: { pollutionId: string }) {}
}

// Vider les favoris UNIQUEMENT du user courant (guest ou connecté)
export class ClearFavoritesForCurrentUser {
  static readonly type = '[Favorite] Clear Favorites For Current User';
}

// (Optionnel) vider tous les favoris de tout le monde (admin/debug)
export class ClearAllFavorites {
  static readonly type = '[Favorite] Clear All Favorites';
}

// (Optionnel) action “no-op” utile si tu veux déclencher une migration à la main
export class LoadFavoritesFromStorage {
  static readonly type = '[Favorite] Load From Storage';
}
