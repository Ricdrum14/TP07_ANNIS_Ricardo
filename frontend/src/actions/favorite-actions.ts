import { Pollution } from "../app/models/pollution";

// 🔹 ACTION : Ajouter une pollution en favori
export class AddFavorite {
  static readonly type = '[Favorite] Add Favorite';
  constructor(public payload: Pollution) {}
}

// 🔹 ACTION : Retirer une pollution des favoris
export class RemoveFavorite {
  static readonly type = '[Favorite] Remove Favorite';
  constructor(public payload: { pollutionId: string | number }) {}
}

// 🔹 ACTION : Vider les favoris du user courant (guest ou user connecté)
export class ClearFavoritesForCurrentUser {
  static readonly type = '[Favorite] Clear Favorites For Current User';
}

// 🔹 ACTION : Vider tous les favoris (tous users) — rarement utile
export class ClearAllFavorites {
  static readonly type = '[Favorite] Clear All Favorites';
}
