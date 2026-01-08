import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthState } from '../shared/states/auth-states';
import { FavoriteState } from '../shared/states/favorite-states';
import { NgxsModule, NgxsModuleOptions } from '@ngxs/store';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';
import { AuthInterceptor } from './interceptors/auth.interceptor';

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
    provideHttpClient(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    importProvidersFrom(
      NgxsModule.forRoot([AuthState, FavoriteState], ngxsConfig),
      NgxsStoragePluginModule.forRoot({
        keys: ['auth', 'favorites'] // 📦 Persister 'auth' et 'favorites' dans le localStorage
      })
    )
  ]
};
