import { Component, inject, Signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngxs/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { Login } from '../../../actions/auth-actions';
import { AuthState } from '../../../shared/states/auth-states';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  formSubmitted = false;

  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  redirectUrl: string | null = null;

  isLoading: Signal<boolean> = toSignal(
    this.store.select(AuthState.isLoading),
    { initialValue: false }
  );

  error: Signal<string | null> = toSignal(
    this.store.select(AuthState.error),
    { initialValue: null }
  );

  isConnected: Signal<boolean> = toSignal(
    this.store.select(AuthState.isConnected),
    { initialValue: false }
  );

  ngOnInit() {
    this.redirectUrl = this.route.snapshot.queryParamMap.get('redirect');

    // ✅ plus fiable que this.isConnected() au tout début
    const connected = this.store.selectSnapshot(AuthState.isConnected);
    if (connected) {
      this.router.navigate([this.redirectUrl || '/']);
    }
  }

  onLogin() {
    this.formSubmitted = true;

    if (!this.email || !this.password) {
      alert('Veuillez remplir tous les champs.');
      return;
    }

    if (this.password.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    this.store.dispatch(new Login({ email: this.email, password: this.password }))
      .pipe(take(1))
      .subscribe(() => {
        // ✅ snapshot = valeur certaine après traitement NGXS
        const connected = this.store.selectSnapshot(AuthState.isConnected);

        if (connected) {
          console.log('Connexion OK ✔');
          this.router.navigate([this.redirectUrl || '/']);
        }
      });
  }
}
