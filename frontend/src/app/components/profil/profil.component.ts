import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { UtilisateurService } from '../../services/utilisateur.service';
import { Utilisateur } from '../../models/utilisateur';
import { AuthState } from '../../../shared/states/auth-states';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private router = inject(Router);
  private utilisateurService = inject(UtilisateurService);

  // ---- profil ----
  email = '';
  mot_de_passe = '';
  showPassword = false;
  message = '';

  // ✅ AJOUT : timer message
  private messageTimer?: number;

  // ---- admin panel ----
  isAdmin = false;
  users: Utilisateur[] = [];
  loadingUsers = false;

  // ---- form ajout user ----
  newUser = {
    prenom: '',
    nom: '',
    email: '',
    mot_de_passe: '',
    role: 'utilisateur' as 'admin' | 'utilisateur'
  };

  // ✅ AJOUT : helper pour afficher puis effacer
  private showMessage(text: string, ms = 2500) {
    this.message = text;

    if (this.messageTimer) {
      window.clearTimeout(this.messageTimer);
    }

    this.messageTimer = window.setTimeout(() => {
      this.message = '';
    }, ms);
  }

  ngOnInit(): void {
    const user = this.store.selectSnapshot(AuthState.currentUser) as any;
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.email = user.email ?? '';
    this.isAdmin = user.role === 'admin';

    if (this.isAdmin) {
      this.loadUsers();
    }
  }

  ngOnDestroy(): void {
    if (this.messageTimer) {
      window.clearTimeout(this.messageTimer);
    }
  }

  loadUsers() {
    this.loadingUsers = true;
    this.utilisateurService.getUtilisateurs().subscribe({
      next: (data) => {
        this.users = data;
        this.loadingUsers = false;
      },
      error: () => {
        this.loadingUsers = false;
      }
    });
  }

  onRefreshUsers() {
    this.loadUsers();
  }

  onCreateUser() {
    // mini validation front (le back revalide derrière)
    if (
      this.newUser.prenom.trim().length < 2 ||
      this.newUser.nom.trim().length < 2 ||
      !this.newUser.email.includes('@') ||
      this.newUser.mot_de_passe.length < 8
    ) {
      this.showMessage('⚠️ Vérifie les champs (mdp >= 8, nom/prénom >= 2).', 3000);
      return;
    }

    this.utilisateurService.createUtilisateur(this.newUser).subscribe({
      next: () => {
        this.showMessage('✅ Utilisateur créé', 2500);
        this.newUser = { prenom: '', nom: '', email: '', mot_de_passe: '', role: 'utilisateur' };
        this.loadUsers();
      },
      error: () => {
        // si ton service affiche déjà un alert, tu peux laisser vide, sinon:
        this.showMessage('❌ Erreur lors de la création', 3000);
      }
    });
  }

  onDeleteUser(user: Utilisateur) {
    const current = this.store.selectSnapshot(AuthState.currentUser) as any;
    if (current?.id === user.id) {
      this.showMessage('⚠️ Tu ne peux pas te supprimer depuis ce tableau. Utilise "Supprimer mon compte".', 3500);
      return;
    }

    const ok = confirm(`Supprimer l'utilisateur ${user.prenom} ${user.nom} ?`);
    if (!ok) return;

    this.utilisateurService.deleteUtilisateurById(user.id).subscribe({
      next: () => {
        this.showMessage('🗑️ Utilisateur supprimé', 2500);
        this.loadUsers();
      },
      error: () => {
        this.showMessage('❌ Erreur lors de la suppression', 3000);
      }
    });
  }

  onUpdate() {
    const user = this.store.selectSnapshot(AuthState.currentUser);
    if (!user?.id) return;

    const payload: any = { email: this.email };
    if (this.mot_de_passe?.trim().length > 0) {
      payload.mot_de_passe = this.mot_de_passe.trim();
    }

    this.utilisateurService.updateUtilisateur(user.id, payload).subscribe({
      next: () => {
        this.showMessage('✅ Profil mis à jour', 2500);
        this.mot_de_passe = '';
      },
      error: () => {
        this.showMessage('❌ Erreur lors de la mise à jour', 2500);
      }
    });
  }

  onDelete() {
    const user = this.store.selectSnapshot(AuthState.currentUser);
    if (!user?.id) return;

    const ok = confirm('⚠️ Supprimer votre compte ? Cette action est irréversible.');
    if (!ok) return;

    this.utilisateurService.deleteUtilisateur(user.id).subscribe({
      next: () => {
        // ton service logout déjà si user courant supprimé
        this.showMessage('✅ Compte supprimé', 3000);
      },
      error: () => {
        this.showMessage('❌ Erreur lors de la suppression', 2500);
      }
    });
  }
}
