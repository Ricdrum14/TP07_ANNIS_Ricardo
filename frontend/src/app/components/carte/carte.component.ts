import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';

import { PollutionService } from '../../services/pollution.service';
import { Pollution } from '../../models/pollution';

// ✅ Fix Leaflet icons -> utilise /assets/leaflet (TON CHEMIN QUI MARCHE)
(L.Icon.Default as any).mergeOptions({
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  iconUrl: 'assets/leaflet/marker-icon.png',
  shadowUrl: 'assets/leaflet/marker-shadow.png',
});

type PollutionVM = Pollution & {
  // pour ton template : p.type
  type: string;
};

@Component({
  selector: 'app-carte',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './carte.component.html',
  styleUrls: ['./carte.component.css'],
})
export class CarteComponent implements AfterViewInit, OnDestroy {
  private pollutionService = inject(PollutionService);

  @ViewChild('mapContainer', { static: false })
  mapContainer!: ElementRef<HTMLDivElement>;

  // ---- UI ----
  search = '';
  selectedType: string = 'all';
  types: string[] = [];

  loading = false;
  errorMsg = '';

  // ---- data ----
  pollutions: PollutionVM[] = [];
  filteredPollutions: PollutionVM[] = [];

  // ---- Leaflet ----
  private map?: L.Map;
  private markersLayer = L.layerGroup();
  private markerById = new Map<number, L.Marker>();

  // ----------------------------------------------------
  // INIT MAP
  // ----------------------------------------------------
  ngAfterViewInit(): void {
    // ✅ Attendre que le DOM soit bien peint
    setTimeout(() => {
      this.initMap();
      this.loadPollutions();
    }, 0);
  }

  private initMap() {
    if (!this.mapContainer?.nativeElement) return;

    // ✅ si re-render (hot reload), éviter double init
    if (this.map) return;

    this.map = L.map(this.mapContainer.nativeElement, {
      zoomControl: true,
      attributionControl: true,
    });

    // Strasbourg par défaut
    this.map.setView([48.5734, 7.7521], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);

    // ✅ Très important (container vient d’être affiché)
    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = undefined;
    this.markerById.clear();
  }

  // ----------------------------------------------------
  // DATA
  // ----------------------------------------------------
  loadPollutions() {
    this.loading = true;
    this.errorMsg = '';

    // ⚠️ adapte selon ton service :
    // - si tu as getPollutions(true) comme dans PollutionComponent, garde pareil
    const req$ = (this.pollutionService as any).getPollutions
      ? (this.pollutionService as any).getPollutions(true)
      : this.pollutionService.getPollutions(); // fallback si signature différente

    req$.subscribe({
      next: (data: Pollution[]) => {
        // ✅ Normalisation pour ton HTML: p.type
        this.pollutions = (data ?? []).map((p: any) => ({
          ...p,
          type: p.type ?? p.type_pollution ?? 'inconnu',
          latitude: typeof p.latitude === 'string' ? Number(p.latitude) : p.latitude,
          longitude: typeof p.longitude === 'string' ? Number(p.longitude) : p.longitude,
        }));

        this.types = Array.from(
          new Set(this.pollutions.map(p => (p.type ?? '').trim()).filter(Boolean))
        ).sort();

        this.applyFilter();
        this.renderMarkers();

        this.loading = false;

        // ✅ Ajuster vue si on a des markers (après rendu)
        setTimeout(() => this.fitToMarkers(), 0);
      },
      error: () => {
        this.loading = false;
        this.errorMsg = "❌ Impossible de charger les pollutions.";
      },
    });
  }

  // appelé par input/select
  onFilterChanged() {
    this.applyFilter();
    this.renderMarkers();
  }

  private applyFilter() {
    const q = (this.search ?? '').trim().toLowerCase();
    const type = this.selectedType;

    this.filteredPollutions = this.pollutions.filter(p => {
      const inType =
        type === 'all'
          ? true
          : (p.type ?? '').toLowerCase() === type.toLowerCase();

      if (!q) return inType;

      const hay = [p.titre, p.lieu, p.description, p.type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return inType && hay.includes(q);
    });
  }

  // ----------------------------------------------------
  // MAP RENDER
  // ----------------------------------------------------
  private renderMarkers() {
    if (!this.map) return;

    this.markersLayer.clearLayers();
    this.markerById.clear();

    for (const p of this.filteredPollutions) {
      const lat = Number((p as any).latitude);
      const lng = Number((p as any).longitude);

      if (!isFinite(lat) || !isFinite(lng)) continue;

      const marker = L.marker([lat, lng]);

      const popupHtml = `
        <div style="min-width:200px">
          <div style="font-weight:700;margin-bottom:4px">${this.escapeHtml(p.titre ?? '')}</div>
          <div style="font-size:12px;color:#666;margin-bottom:6px">${this.escapeHtml(p.lieu ?? '')}</div>
          <div style="font-size:12px;margin-bottom:6px"><b>Type:</b> ${this.escapeHtml(p.type ?? '')}</div>
          <div style="font-size:12px;color:#444">${this.escapeHtml((p.description ?? '').slice(0, 160))}${(p.description ?? '').length > 160 ? '…' : ''}</div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      if (typeof (p as any).id === 'number') {
        this.markerById.set((p as any).id, marker);
      }

      marker.addTo(this.markersLayer);
    }

    // ✅ éviter bug de positionnement après filtre / resize
    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  fitToMarkers() {
    if (!this.map) return;

    const markers: L.Marker[] = [];
    this.markerById.forEach(m => markers.push(m));

    if (markers.length === 0) return;

    const group = L.featureGroup(markers);
    const bounds = group.getBounds();

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [30, 30] });
    }
  }

  onSelectPollution(p: PollutionVM) {
    if (!this.map) return;

    const id = (p as any).id;
    const marker = this.markerById.get(id);

    if (marker) {
      const latlng = marker.getLatLng();
      this.map.setView(latlng, Math.max(this.map.getZoom(), 14), { animate: true });
      setTimeout(() => marker.openPopup(), 150);
      return;
    }

    const lat = Number((p as any).latitude);
    const lng = Number((p as any).longitude);
    if (isFinite(lat) && isFinite(lng)) {
      this.map.setView([lat, lng], 14, { animate: true });
    }
  }

  // ----------------------------------------------------
  // util
  // ----------------------------------------------------
  private escapeHtml(v: string) {
    return (v ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
