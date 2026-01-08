import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { AuthState } from '../shared/states/auth-states';
import { FavoriteState } from '../shared/states/favorite-states';
import { NgxsModule, NgxsModuleOptions } from '@ngxs/store';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';
import { authInterceptor } from './interceptors/auth.interceptor';

const ngxsConfig: NgxsModuleOptions = {
  developmentMode: true,
  selectorOptions: {
    suppressErrors: false,
    injectContainerState: false,
  }
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    // ✅ INTERCEPTOR CORRECT EN STANDALONE
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),

    importProvidersFrom(
      NgxsModule.forRoot([AuthState, FavoriteState], ngxsConfig),
      NgxsStoragePluginModule.forRoot({
        keys: ['auth', 'favorites']
      })
    )
  ]
};
