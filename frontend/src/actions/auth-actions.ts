// 🔹 ACTION : Lancer une connexion
export class Login {
  static readonly type = '[Auth] Login';
  constructor(public payload: { email: string; password: string }) {}
}

// 🔹 ACTION : Déconnexion
export class Logout {
  static readonly type = '[Auth] Logout';
}
