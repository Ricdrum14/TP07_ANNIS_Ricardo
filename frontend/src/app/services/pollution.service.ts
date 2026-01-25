import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Pollution } from '../models/pollution';
import { environment } from '../../environments/environment';
import { Store } from '@ngxs/store';
import { AuthState } from '../../shared/states/auth-states';

@Injectable({
  providedIn: 'root'
})
export class PollutionService {
  private apiUrl = environment.backendPollution;
  private isMock = environment.backendPollution.includes('/assets/mock');

  // Cache "global"
  private localPollutions: Pollution[] = [];

  // Flux affiché par l’UI (peut être full list OU résultats de recherche)
  private pollutionsSubject = new BehaviorSubject<Pollution[]>([]);
  pollutions$ = this.pollutionsSubject.asObservable();

  constructor(private http: HttpClient, private store: Store) {}

  // -------------------------
  // Helpers
  // -------------------------
  private handleError(error: HttpErrorResponse, message: string): Observable<never> {
    console.error("Une erreur s'est produite:", error);
    return throwError(() => new Error(message));
  }

  private mapToPollution(item: any): Pollution {
    return new Pollution(
      item.titre,
      item.type_pollution || item.type,
      item.description,
      new Date(item.date_observation || item.date),
      item.lieu,
      item.latitude,
      item.longitude,
      item.photo_url || item.photo,
      String(item.id)
    );
  }

  private canCallApi(): boolean {
    if (this.isMock) return true;
    const isConnected = this.store.selectSnapshot(AuthState.isConnected);
    return !!isConnected;
  }

  // -------------------------
  // ✅ GET ALL
  // -------------------------
  /**
   * Récupère toutes les pollutions
   * @param forceReload si true => refait un GET API même si cache non vide
   */
  getPollutions(forceReload = false): Observable<Pollution[]> {
    if (!this.canCallApi()) {
      // en API réelle, si tu veux quand même afficher le cache local, remplace par:
      // return of(this.localPollutions);
      this.pollutionsSubject.next([]);
      return of([]);
    }

    // Mode mock
    if (this.isMock) {
      this.pollutionsSubject.next([...this.localPollutions]);
      return of([...this.localPollutions]);
    }

    // Si cache vide OU reload forcé => on appelle l’API
    if (this.localPollutions.length === 0 || forceReload) {
      return this.http.get<any[]>(this.apiUrl).pipe(
        map(data => data.map(item => this.mapToPollution(item))),
        tap(pollutions => {
          this.localPollutions = pollutions;         // ✅ cache full list
          this.pollutionsSubject.next(pollutions);   // ✅ affichage
        }),
        catchError(error => this.handleError(error, 'Impossible de récupérer les pollutions.'))
      );
    }

    // Sinon on renvoie le flux déjà affiché
    return this.pollutions$;
  }

  // -------------------------
  // ✅ SEARCH (API)
  // -------------------------
  /**
   * Recherche dynamique via API
   * Backend: GET /api/pollutions?q=...
   *
   * ⚠️ ne remplace pas localPollutions (cache full list)
   * => ne fait que pousser le résultat dans pollutionsSubject
   */
  searchPollutions(term: string): Observable<Pollution[]> {
    const q = (term || '').trim();

    // Debug
    console.log('[SEARCH API] q =', q);

    // Mode mock => filtre local
    if (this.isMock) {
      const lower = q.toLowerCase();
      const filtered = this.localPollutions.filter(p =>
        (p.titre || '').toLowerCase().includes(lower) ||
        (p.lieu || '').toLowerCase().includes(lower) ||
        (p.description || '').toLowerCase().includes(lower)
      );
      this.pollutionsSubject.next(filtered);
      return of(filtered);
    }

    if (!this.canCallApi()) {
      this.pollutionsSubject.next([]);
      return of([]);
    }

    let params = new HttpParams();
    if (q) params = params.set('q', q);

    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      map(data => data.map(item => this.mapToPollution(item))),
      tap(results => {
        this.pollutionsSubject.next(results); // ✅ affichage = résultats de recherche
      }),
      catchError(error => this.handleError(error, 'Impossible de rechercher les pollutions.'))
    );
  }

  // -------------------------
  // ✅ GET BY ID
  // -------------------------
  getPollutionById(id: string): Observable<Pollution> {
    if (this.isMock) {
      const pollution = this.localPollutions.find(p => p.id === id);
      return pollution ? of(pollution) : throwError(() => new Error('Pollution non trouvée'));
    }

    if (!this.canCallApi()) {
      return throwError(() => new Error('Non authentifié'));
    }

    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(item => {
        if (!item) throw new Error('Pollution non trouvée');
        return this.mapToPollution(item);
      }),
      catchError(error => this.handleError(error, 'Impossible de récupérer la pollution.'))
    );
  }

  // -------------------------
  // ✅ CREATE
  // -------------------------
  addPollution(pollution: Pollution): Observable<Pollution> {
    const isBase64 = typeof pollution.photo === 'string' && pollution.photo.startsWith('data:');

    const pollutionData = {
      titre: pollution.titre,
      lieu: pollution.lieu,
      date_observation: new Date(pollution.date).toISOString(),
      type_pollution: pollution.type,
      description: pollution.description,
      latitude: pollution.latitude,
      longitude: pollution.longitude,
      photo_url: isBase64 ? null : pollution.photo
    };

    if (this.isMock) {
      this.localPollutions.push(pollution);
      this.pollutionsSubject.next([...this.localPollutions]);
      return of(pollution);
    }

    if (!this.canCallApi()) {
      return throwError(() => new Error('Non authentifié'));
    }

    return this.http.post<any>(this.apiUrl, pollutionData).pipe(
      map(response => this.mapToPollution(response)),
      tap(newPollution => {
        this.localPollutions.push(newPollution);
        this.pollutionsSubject.next([...this.localPollutions]);
      }),
      catchError(error => this.handleError(error, 'Erreur lors de la création de la pollution.'))
    );
  }

  // -------------------------
  // ✅ UPDATE
  // -------------------------
  updatePollution(updated: Pollution): Observable<Pollution> {
    if (this.isMock) {
      const index = this.localPollutions.findIndex(p => p.id === updated.id);
      if (index !== -1) this.localPollutions[index] = updated;
      this.pollutionsSubject.next([...this.localPollutions]);
      return of(updated);
    }

    if (!this.canCallApi()) {
      return throwError(() => new Error('Non authentifié'));
    }

    const pollutionData = {
      titre: updated.titre,
      lieu: updated.lieu,
      date_observation: new Date(updated.date).toISOString(),
      type_pollution: updated.type,
      description: updated.description,
      latitude: updated.latitude,
      longitude: updated.longitude,
      photo_url:
        typeof updated.photo === 'string' && updated.photo.startsWith('data:')
          ? null
          : updated.photo
    };

    return this.http.put<any>(`${this.apiUrl}/${updated.id}`, pollutionData).pipe(
      map(response => {
        const item = response.data || response;
        return this.mapToPollution(item);
      }),
      tap(updatedPollution => {
        const index = this.localPollutions.findIndex(p => p.id === updatedPollution.id);
        if (index !== -1) this.localPollutions[index] = updatedPollution;
        else this.localPollutions.push(updatedPollution);

        this.pollutionsSubject.next([...this.localPollutions]);
      }),
      catchError(error => this.handleError(error, 'Erreur lors de la mise à jour de la pollution.'))
    );
  }

  // -------------------------
  // ✅ DELETE
  // -------------------------
  deletePollution(id: string): Observable<any> {
    if (this.isMock) {
      this.localPollutions = this.localPollutions.filter(p => p.id !== id);
      this.pollutionsSubject.next([...this.localPollutions]);
      return of({ message: 'La pollution a été supprimée avec succès.' });
    }

    if (!this.canCallApi()) {
      return throwError(() => new Error('Non authentifié'));
    }

    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.localPollutions = this.localPollutions.filter(p => p.id !== id);
        this.pollutionsSubject.next([...this.localPollutions]);
      }),
      catchError(error => this.handleError(error, 'Impossible de supprimer la pollution.'))
    );
  }
}
