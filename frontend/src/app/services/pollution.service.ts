import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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

  private localPollutions: Pollution[] = [];
  private pollutionsSubject = new BehaviorSubject<Pollution[]>([]);
  pollutions$ = this.pollutionsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private store: Store
  ) {}

  private handleError(error: HttpErrorResponse, message: string): Observable<never> {
    console.error('Une erreur s\'est produite:', error);
    return throwError(() => new Error(message));
  }

  /** 🔹 Récupère toutes les pollutions */
  getPollutions(): Observable<Pollution[]> {
    // ✅ En mode API réelle : si déconnecté, ne pas appeler l'API (évite 401 après logout)
    if (!this.isMock) {
      const isConnected = this.store.selectSnapshot(AuthState.isConnected);
      if (!isConnected) {
        // Option 1 : renvoyer vide
        return of([]);
        // Option 2 (si tu préfères garder le cache affiché) :
        // return this.pollutions$;
      }
    }

    if (this.localPollutions.length === 0) {
      return this.http.get<any[]>(this.apiUrl).pipe(
        map(data => data.map(item => new Pollution(
          item.titre,
          item.type_pollution || item.type,
          item.description,
          new Date(item.date_observation || item.date),
          item.lieu,
          item.latitude,
          item.longitude,
          item.photo_url || item.photo,
          item.id
        ))),
        tap(pollutions => {
          this.localPollutions = pollutions;
          this.pollutionsSubject.next(pollutions);
        }),
        catchError(error => this.handleError(error, 'Impossible de récupérer les pollutions.'))
      );
    }

    return this.pollutions$;
  }

  /** 🔍 Récupère une pollution par ID */
  getPollutionById(id: string): Observable<Pollution> {
    if (this.isMock) {
      const pollution = this.localPollutions.find(p => p.id === id);
      return pollution ? of(pollution) : throwError(() => new Error('Pollution non trouvée'));
    } else {
      return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
        map(item => {
          if (!item) throw new Error('Pollution non trouvée');
          return new Pollution(
            item.titre,
            item.type_pollution || item.type,
            item.description,
            new Date(item.date_observation || item.date),
            item.lieu,
            item.latitude,
            item.longitude,
            item.photo_url || item.photo,
            item.id
          );
        }),
        catchError(error => this.handleError(error, 'Impossible de récupérer la pollution.'))
      );
    }
  }

  /** ➕ Ajoute une pollution */
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
    } else {
      return this.http.post<any>(this.apiUrl, pollutionData).pipe(
        map(response => {
          const newPollution = new Pollution(
            response.titre,
            response.type_pollution || response.type,
            response.description,
            new Date(response.date_observation || response.date),
            response.lieu,
            response.latitude,
            response.longitude,
            response.photo_url || response.photo,
            response.id
          );
          this.localPollutions.push(newPollution);
          this.pollutionsSubject.next([...this.localPollutions]);
          return newPollution;
        }),
        catchError(error => this.handleError(error, 'Erreur lors de la création de la pollution.'))
      );
    }
  }

  /** ✏️ Met à jour une pollution */
  updatePollution(updated: Pollution): Observable<Pollution> {
    if (this.isMock) {
      const index = this.localPollutions.findIndex(p => p.id === updated.id);
      if (index !== -1) this.localPollutions[index] = updated;
      this.pollutionsSubject.next([...this.localPollutions]);
      return of(updated);
    } else {
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

          const updatedPollution = new Pollution(
            item.titre,
            item.type_pollution || item.type,
            item.description,
            new Date(item.date_observation || item.date),
            item.lieu,
            item.latitude,
            item.longitude,
            item.photo_url || item.photo,
            item.id
          );

          const index = this.localPollutions.findIndex(p => p.id === updatedPollution.id);
          if (index !== -1) this.localPollutions[index] = updatedPollution;
          else this.localPollutions.push(updatedPollution);

          this.pollutionsSubject.next([...this.localPollutions]);
          return updatedPollution;
        }),
        catchError(error => this.handleError(error, 'Erreur lors de la mise à jour de la pollution.'))
      );
    }
  }

  /** ❌ Supprime une pollution */
  deletePollution(id: string): Observable<any> {
    if (this.isMock) {
      this.localPollutions = this.localPollutions.filter(p => p.id !== id);
      this.pollutionsSubject.next([...this.localPollutions]);
      return of({ message: "La pollution a été supprimée avec succès." });
    } else {
      return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
        tap(() => {
          this.localPollutions = this.localPollutions.filter(p => p.id !== id);
          this.pollutionsSubject.next([...this.localPollutions]);
        }),
        catchError(error => this.handleError(error, 'Impossible de supprimer la pollution.'))
      );
    }
  }
}
