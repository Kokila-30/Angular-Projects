import { Routes } from '@angular/router';
import { Login } from './component/login/login';
import { Layout } from './component/layout/layout';
import { Dashboard } from './component/dashboard/dashboard';
import { ItemList } from './component/item-list/item-list';
import { AddItem } from './component/add-item/add-item';
import { EditItem } from './component/edit-item/edit-item';
import { ViewItem } from './component/view-item/view-item';
import { InvoicesComponent } from './component/invoices/invoices';
import { OrdersComponent } from './component/orders/orders';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'items', component: ItemList },
      { path: 'items/add', component: AddItem },
      { path: 'items/edit/:id', component: EditItem },
      { path: 'items/view/:id', component: ViewItem },
      { path: 'invoices', component: InvoicesComponent },
      { path: 'orders', component: OrdersComponent }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];