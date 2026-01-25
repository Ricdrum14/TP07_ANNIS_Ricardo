import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PollutionService } from '../../../services/pollution.service';
import { Pollution } from '../../../models/pollution';

import { Store } from '@ngxs/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { AddFavorite, RemoveFavorite } from '../../../../actions/favorite-actions';
import { FavoriteState } from '../../../../shared/states/favorite-states';
import { PollutionsDetailsComponent } from '../../pollutions-details/pollutions-details.component';

@Component({
  selector: 'app-pollutions-list',
  standalone: true,
  imports: [CommonModule, PollutionsDetailsComponent],
  templateUrl: './pollutions-list.component.html',
  styleUrls: ['./pollutions-list.component.css']
})
export class PollutionsListComponent implements OnInit, OnDestroy {
  @Input({ required: true }) pollutions$!: Observable<Pollution[]>;
  @Input() searchActive = false;

  @Output() listChanged = new EventEmitter<void>();

  loading = true;
  selectedPollution?: Pollution;

  showAll = false;
  maxVisible = 4;

  private destroy$ = new Subject<void>();
  private store = inject(Store);

  favorites: Signal<Pollution[]> = toSignal(
    this.store.select(FavoriteState.getFavorites),
    { initialValue: [] }
  );

  constructor(private pollutionService: PollutionService) {}

  ngOnInit(): void {
    // Dès que la liste émet une première fois -> loading false
    this.pollutions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => (this.loading = false));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleView() {
    this.showAll = !this.showAll;
  }

  viewDetails(pollution: Pollution) {
    this.loading = true;
    this.pollutionService.getPollutionById(pollution.id).subscribe({
      next: (detailed) => {
        this.selectedPollution = detailed;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        alert('Impossible de charger les détails.');
      }
    });
  }

  closeDetails() {
    this.selectedPollution = undefined;
  }

  deletePollution(id: string) {
    if (!confirm('❌ Voulez-vous vraiment supprimer cette pollution ?')) return;

    this.pollutionService.deletePollution(id).subscribe({
      next: () => {
        this.listChanged.emit(); // ✅ demande au parent de refresh
      },
      error: (err) => {
        console.error(err);
        alert('Erreur lors de la suppression.');
      }
    });
  }

  isFavorite(pollutionId: string): boolean {
    const favs = this.favorites();
    return Array.isArray(favs) && favs.some(p => p.id === pollutionId);
  }

  toggleFavorite(pollution: Pollution, event: Event) {
    event.stopPropagation();
    if (this.isFavorite(pollution.id)) {
      this.store.dispatch(new RemoveFavorite({ pollutionId: pollution.id }));
    } else {
      this.store.dispatch(new AddFavorite(pollution));
    }
  }
}
