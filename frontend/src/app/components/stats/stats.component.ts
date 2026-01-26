import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { PollutionService } from '../../services/pollution.service';
import { Pollution } from '../../models/pollution';

type TypeRow = { label: string; count: number; percent: number };
type LieuRow = { label: string; count: number };

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit {
  private pollutionService = inject(PollutionService);

  loading = false;
  errorMsg = '';

  pollutions: Pollution[] = [];

  maxLast7 = 0;

  avgLast7 = 0;        // moyenne sur 7 jours (avec les 0)
  avgActiveLast7 = 0;  // moyenne sur jours actifs (sans les 0)

  total = 0;
  lastObservationLabel = '';

  byType: TypeRow[] = [];
  topLieux: LieuRow[] = [];

  // last 7 days bars
  last7Days: { label: string; count: number; percent: number }[] = [];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';

    this.pollutionService.getPollutions(true).subscribe({
      next: (data) => {
        this.pollutions = (data ?? []) as any[];
        this.computeAll();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMsg = '❌ Erreur lors du chargement des statistiques.';
      }
    });
  }

  // helper pour bar height minimum
  barHeight(percent: number, count: number): number {
    if (count === 0) return 0;
    return Math.max(percent, 8);
  }
  
  // arrondi à 1 décimale
  round1(v: number) { 
    return Math.round(v * 10) / 10; 
  }

  
  private computeAll(): void {
    const list = (this.pollutions ?? []).slice();

    this.total = list.length;

    // last observation
    const sortedByDate = list
      .map((p: any) => ({ p, d: this.safeDate(p.date) }))
      .filter(x => x.d)
      .sort((a, b) => (b.d!.getTime() - a.d!.getTime()));

    this.lastObservationLabel = sortedByDate.length
      ? this.formatDate(sortedByDate[0].d!)
      : '—';

    // by type
    const mapType = new Map<string, number>();
    for (const p of list as any[]) {
      const t = String(p.type ?? 'Inconnu').trim() || 'Inconnu';
      mapType.set(t, (mapType.get(t) ?? 0) + 1);
    }

    this.byType = Array.from(mapType.entries())
      .map(([label, count]) => ({
        label,
        count,
        percent: this.total > 0 ? Math.round((count / this.total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // top lieux
    const mapLieu = new Map<string, number>();
    for (const p of list as any[]) {
      const lieu = String(p.lieu ?? '—').trim() || '—';
      mapLieu.set(lieu, (mapLieu.get(lieu) ?? 0) + 1);
    }

    this.topLieux = Array.from(mapLieu.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // last 7 days
    this.last7Days = this.computeLast7Days(list);
    this.maxLast7 = Math.max(...this.last7Days.map(x => x.count), 0);


// ✅ moyenne sur 7 jours (avec les 0)
const sum7 = this.last7Days.reduce((acc, x) => acc + x.count, 0);
this.avgLast7 = this.round1(sum7 / 7);

// ✅ moyenne sur jours actifs (sans les 0)
const active = this.last7Days.filter(x => x.count > 0);
const sumActive = active.reduce((acc, x) => acc + x.count, 0);
this.avgActiveLast7 = active.length > 0 ? this.round1(sumActive / active.length) : 0;

  }

  private computeLast7Days(list: any[]): { label: string; count: number; percent: number }[] {
    // labels: J-6 ... Aujourd’hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d);
    }

    const counts = new Map<string, number>();
    for (const d of days) {
      counts.set(this.keyDay(d), 0);
    }

    for (const p of list) {
      const d = this.safeDate(p.date);
      if (!d) continue;
      d.setHours(0, 0, 0, 0);
      const k = this.keyDay(d);
      if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
    }

    const max = Math.max(...Array.from(counts.values()), 1);

    return days.map(d => {
      const k = this.keyDay(d);
      const count = counts.get(k) ?? 0;
      return {
        label: this.shortDayLabel(d),
        count,
        percent: Math.round((count / max) * 100)
      };
    });
  }

  private safeDate(value: any): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  private formatDate(d: Date): string {
    return d.toLocaleDateString('fr-FR', { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' });
  }

  private shortDayLabel(d: Date): string {
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  }

  private keyDay(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

 



}
