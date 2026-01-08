import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Utilisateur } from '../models/utilisateur';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UtilisateurService {
  private apiUrl = environment.backendUtilisateur;
  private isMock = environment.backendUtilisateur.includes('/assets/mock');

  private localUsers: Utilisateur[] = [];
  private usersSubject = new BehaviorSubject<Utilisateur[]>([]);
  users$ = this.usersSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<Utilisateur | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ====================================================
  // ⚙️ Utils
  // ====================================================
  private handleError(error: HttpErrorResponse, message: string) {
    console.error('Erreur utilisateur API:', error);
    const errMsg = error.error?.message || message;
    alert(errMsg);
    return throwError(() => new Error(errMsg));
  }

  // NOTE: Persistence is handled by NGXS (NgxsStoragePlugin). We keep a
  // `currentUserSubject` for in-memory updates but avoid manual localStorage writes.

  // ====================================================
  // 👥 CRUD UTILISATEURS
  // ====================================================
  getUtilisateurs(): Observable<Utilisateur[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(data =>
        data.map(
          item =>
            new Utilisateur(
              item.id,
              item.nom,
              item.prenom,
              item.email,
              item.role,
              new Date((item.date_creation ?? new Date()) as string | number | Date)
            )
        )
      ),
      tap(users => {
        this.localUsers = users;
        this.usersSubject.next(users);
      }),
      catchError(error => this.handleError(error, 'Erreur lors du chargement des utilisateurs.'))
    );
  }

/** 🔹 Met à jour un utilisateur (email / mot de passe) */
updateUtilisateur(id: number, data: { email?: string; mot_de_passe?: string }): Observable<Utilisateur> {
  return this.http.put<Utilisateur>(`${this.apiUrl}/${id}`, data).pipe(
    tap(updated => {
      // Si l'utilisateur courant se met à jour, on met à jour le subject en mémoire
      const current = this.getCurrentUser();
      if (current && current.id === id) {
        const updatedUser = { ...current, ...updated };
        this.currentUserSubject.next(updatedUser);
      }
    }),
    catchError(error => this.handleError(error, 'Erreur lors de la mise à jour du profil.'))
  );
}

/** 🔹 Supprime un utilisateur */
deleteUtilisateur(id: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/${id}`).pipe(
    tap(() => {
      // Si l'utilisateur courant est supprimé → déconnexion automatique
      const current = this.getCurrentUser();
      if (current && current.id === id) {
        this.logout();
      }
    }),
    catchError(error => this.handleError(error, 'Erreur lors de la suppression du compte.'))
  );
}


  // ====================================================
  // 🔐 AUTHENTIFICATION
  // ====================================================

  /** 🧾 Inscription */
  register(data: { prenom: string; nom: string; email: string; mot_de_passe: string }): Observable<Utilisateur> {
    if (this.isMock) {
      // Mode DEV → lecture du mock JSON
      return this.http.get<Utilisateur[]>(this.apiUrl).pipe(
        map(users => {
          if (users.some(u => u.email === data.email)) {
            throw new Error('Cet utilisateur existe déjà (mock).');
          }
          const newUser: Utilisateur = {
            id: users.length + 1,
            nom: data.nom,
            prenom: data.prenom,
            email: data.email,
            role: 'utilisateur',
            date_creation: new Date()
          };
          this.currentUserSubject.next(newUser);
          return newUser;
        }),
        tap(user => {
          alert(`✅ Compte créé avec succès (mock) ! Bienvenue ${user.prenom} 🎉`);
        }),
        catchError(error => this.handleError(error, 'Erreur lors de l’inscription (mock).'))
      );
    }

    // Mode PROD → appel API réelle
    const authUrl = `${this.apiUrl.replace('/utilisateurs', '')}/auth/register`;
    return this.http.post<any>(authUrl, data).pipe(
      tap(user => {
        // Mettre à jour le subject local ; NGXS AuthState sauvera l'auth dans localStorage
        this.currentUserSubject.next(user);
      }),
      catchError(error => this.handleError(error, 'Erreur lors de l’inscription (API).'))
    );
  }

  /** 🔑 Connexion */
  login(email: string, mot_de_passe: string): Observable<any> {
    if (this.isMock) {
      // Mode DEV → lecture du JSON
      return this.http.get<Utilisateur[]>(this.apiUrl).pipe(
        map(users => {
          const user = users.find(u => u.email === email && (u as any).mot_de_passe === mot_de_passe);
          if (!user) throw new Error('Utilisateur introuvable ou mot de passe incorrect.');
          this.currentUserSubject.next(user);
          return user;
        }),
        tap(user => alert(`👋 Bienvenue ${user.prenom} (mock)`)),
        catchError(error => this.handleError(error, 'Erreur lors de la connexion (mock).'))
      );
    }

    // Mode PROD → appel API réelle
    const authUrl = `${this.apiUrl.replace('/utilisateurs', '')}/auth/login`;
    return this.http.post<any>(authUrl, { email, mot_de_passe }).pipe(
      tap(response => {
        // 🔹 response contient { token, user }
        const user = response.user || response;
        // Mettre à jour le subject local ; NGXS AuthState sauvera l'auth dans localStorage
        this.currentUserSubject.next(user);
      }),
      catchError(error => this.handleError(error, 'Erreur lors de la connexion (API).'))
    );
  }

  /** 🚪 Déconnexion */
  logout() {
    // Ne pas toucher au localStorage manuellement — NGXS gère la persistence.
    this.currentUserSubject.next(null);
  }

  /** 👤 Récupère l’utilisateur courant */
  getCurrentUser(): Utilisateur | null {
    return this.currentUserSubject.value;
  }
}
