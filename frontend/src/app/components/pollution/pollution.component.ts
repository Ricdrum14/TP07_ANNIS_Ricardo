import { Component, ViewChild, ElementRef, AfterViewChecked, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { PollutionsListComponent } from './pollutions-list/pollutions-list.component';
import { PollutionsFormComponent } from '../pollutions-form/pollutions-form.component';
import { PollutionService } from '../../services/pollution.service';
import { Pollution } from '../../models/pollution';

import { BehaviorSubject, Subject, Observable, combineLatest, of, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, map, startWith, tap, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-pollution',
  standalone: true,
  imports: [HeaderComponent, PollutionsListComponent, PollutionsFormComponent, CommonModule],
  templateUrl: './pollution.component.html',
  styleUrls: ['./pollution.component.css']
})
export class PollutionComponent implements AfterViewChecked, OnInit, OnDestroy {
  showForm = false;
  successMessage = '';

  // ✅ Recherche dynamique
  private search$ = new BehaviorSubject<string>('');
  private refresh$ = new Subject<void>();

  // ✅ états UI
  searchActive = false;
  noResults = false;

  // ✅ flux de pollutions affiché
  pollutions$!: Observable<Pollution[]>;

  private pendingScroll = false;
  private sub?: Subscription;

  @ViewChild('declareFormSection') declareFormSection!: ElementRef<HTMLElement>;
  @ViewChild('listSection') listSection!: ElementRef<HTMLElement>;

  constructor(private pollutionService: PollutionService) {}

  ngOnInit(): void {
    const term$ = this.search$.pipe(
      map(v => (v ?? '').trim()),
      debounceTime(300),
      distinctUntilChanged()
    );

    const pollutionsWithMeta$ = combineLatest([
      term$,
      this.refresh$.pipe(startWith(undefined))
    ]).pipe(
      switchMap(([term]) => {
        const normalized = term.toLowerCase();
        const active = normalized.length >= 3;

        this.searchActive = active;
        this.noResults = false;

        const request$ = active
          ? this.pollutionService.searchPollutions(normalized)
          : this.pollutionService.getPollutions(true); // ✅ reload full list

        return request$.pipe(
          map(results => ({ term: normalized, results })),
          catchError(() => of({ term: normalized, results: [] as Pollution[] }))
        );
      }),
      tap(({ term, results }) => {
        this.noResults = term.length > 0 && results.length === 0;
      }),
      shareReplay(1)
    );

    // Flux utilisé par la liste
    this.pollutions$ = pollutionsWithMeta$.pipe(map(x => x.results));

    // Side effects: scroll
    this.sub = pollutionsWithMeta$.subscribe(({ term, results }) => {
      if (term.length >= 3) {
        // Scroll vers la section liste dès qu’on tape
        setTimeout(() => {
          this.listSection?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
      }

      // Si résultats -> scroll vers la première card
      if (term.length >= 3 && results.length > 0) {
        setTimeout(() => {
          const firstId = results[0].id;
          const firstCard = document.querySelector(`[data-pollution-card="${firstId}"]`);
          firstCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
      }
    });

    // Première charge
    this.refresh$.next();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // Reçoit la recherche du header
  onSearchChanged(query: string) {
    this.search$.next(query);
  }

  // appelé par la liste après suppression etc.
  onListChanged() {
    this.refresh$.next();
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (this.showForm) this.pendingScroll = true;
  }

  ngAfterViewChecked() {
    if (this.pendingScroll && this.declareFormSection) {
      this.declareFormSection.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.pendingScroll = false;
    }
  }

  onPollutionAdded(message: string) {
    this.successMessage = message;

    // refresh liste
    this.refresh$.next();

    setTimeout(() => {
      this.successMessage = '';
      this.showForm = false;
    }, 3000);
  }

  scrollToTop() {
    // reset recherche
    this.search$.next('');
    this.searchActive = false;
    this.noResults = false;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // reload full list
    this.refresh$.next();
  }

  onOpenDeclareForm() {
    if (!this.showForm) this.showForm = true;
    setTimeout(() => {
      this.declareFormSection?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }
}
