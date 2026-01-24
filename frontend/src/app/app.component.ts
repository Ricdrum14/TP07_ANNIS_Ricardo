import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngxs/store';
import { LoadFavoritesFromStorage } from '../actions/favorite-actions';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Pollution';

  private store = inject(Store);

  ngOnInit() {
    // ✅ Migration/normalisation des favoris (ancien format -> favoritesByUser)
    this.store.dispatch(new LoadFavoritesFromStorage());
  }
}
