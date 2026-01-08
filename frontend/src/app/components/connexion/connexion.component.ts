import { Component, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngxs/store';
import { AuthState } from '../../../shared/states/auth-states';
import { Logout } from '../../../actions/auth-actions';
import { Utilisateur } from '../../models/utilisateur';

@Component({
  selector: 'app-connexion',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './connexion.component.html',
  styleUrl: './connexion.component.css'
})
export class ConnexionComponent {

  private store = inject(Store);

  isMenuOpen = false;

  // 🔍 Signaux pour afficher l'état de l'authentification
  isConnected: Signal<boolean> = toSignal(
    this.store.select(AuthState.isConnected),
    { initialValue: false }
  );

  currentUser: Signal<Utilisateur | null> = toSignal(
    this.store.select(AuthState.currentUser),
    { initialValue: null }
  );

  isLoading: Signal<boolean> = toSignal(
    this.store.select(AuthState.isLoading),
    { initialValue: false }
  );

  error: Signal<string | null> = toSignal(
    this.store.select(AuthState.error),
    { initialValue: null }
  );

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /** 🚪 Déconnexion de l'utilisateur */
  logout() {
    this.store.dispatch(new Logout());
    this.isMenuOpen = false;
  }
}
