import { Component, OnInit, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngxs/store';
import { FavoriteState } from '../../../shared/states/favorite-states';
import { Pollution } from '../../models/pollution';
import { HeaderComponent } from '../header/header.component';
import { RemoveFavorite, ClearFavoritesForCurrentUser } from '../../../actions/favorite-actions';
import { Router } from '@angular/router';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css']
})
export class FavoritesComponent implements OnInit {
  private store = inject(Store);
  private router = inject(Router);

  // ✅ Favoris du user courant (guest ou connecté), gérés par FavoriteState
  favorites: Signal<Pollution[]> = toSignal(
    this.store.select(FavoriteState.getFavorites),
    { initialValue: [] }
  );

  ngOnInit() {}

  // ❌ Retirer un favori
  removeFavorite(pollutionId: string, event: Event) {
    event.stopPropagation();
    this.store.dispatch(new RemoveFavorite({ pollutionId }));
  }

  // 🗑️ Vider les favoris du user courant (pas ceux des autres users)
  clearAllFavorites() {
    if (confirm('⚠️ Voulez-vous vraiment supprimer TOUS vos favoris ?')) {
      this.store.dispatch(new ClearFavoritesForCurrentUser());
    }
  }

  // 🔙 Retour à l'accueil
  goHome() {
    this.router.navigate(['/']);
  }
}
