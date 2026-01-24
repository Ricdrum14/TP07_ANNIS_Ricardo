import { Pollution } from "../../app/models/pollution";

export interface FavoriteStateModel {
     favoritesByUser: Record<string, Pollution[]>;
}
