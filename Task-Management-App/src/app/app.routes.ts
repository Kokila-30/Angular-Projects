import { Routes } from '@angular/router';
import { Signup } from './signup/signup';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'signup',  // ← This MUST point to signup
    pathMatch: 'full'
  },
  {
    path: 'signup',
    component: Signup
  },
  {
    path: 'board',
    loadComponent: () => import('./app').then(m => m.AppComponent)
  }
];