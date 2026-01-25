import { Component, EventEmitter, Output, OnInit, Input, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { Store } from '@ngxs/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConnexionComponent } from '../connexion/connexion.component';
import { FavoriteState } from '../../../shared/states/favorite-states';
import { AuthState } from '../../../shared/states/auth-states';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RouterLink, RouterLinkActive, ConnexionComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isMenuOpen = false;
  searchQuery = '';

  @Input() declareActive = false;
  @Output() goHome = new EventEmitter<void>();
  @Output() openDeclareForm = new EventEmitter<void>();
  @Output() searchChanged = new EventEmitter<string>();

  private router = inject(Router);
  private store = inject(Store);

  favoritesCount: Signal<number> = toSignal(
    this.store.select(FavoriteState.getFavoritesCount),
    { initialValue: 0 }
  );

  // ✅ AJOUT : infos connexion
  isConnected: Signal<boolean> = toSignal(
    this.store.select(AuthState.isConnected),
    { initialValue: false }
  );

  currentUser: Signal<any | null> = toSignal(
    this.store.select(AuthState.currentUser),
    { initialValue: null }
  );

  ngOnInit() {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onSearchChange() {
    this.searchChanged.emit(this.searchQuery.trim().toLowerCase());
  }

  async goLogin() {
    this.isMenuOpen = false;
    await this.router.navigate(['/login']);
  }

  async goSignup() {
    this.isMenuOpen = false;
    await this.router.navigate(['/signup']);
  }

  navigateHome() {
    this.isMenuOpen = false;

    // ✅ optionnel : reset champ recherche quand on revient home
    this.searchQuery = '';
    this.searchChanged.emit('');

    this.goHome.emit();
  }

  declarePollution() {
    this.isMenuOpen = false;
    this.openDeclareForm.emit();
  }

  goToFavorites() {
    const connected = this.store.selectSnapshot(AuthState.isConnected);

    if (!connected) {
      this.router.navigate(['/login'], { queryParams: { redirect: '/favoris' } });
      return;
    }

    this.router.navigate(['/favoris']);
  }
}
