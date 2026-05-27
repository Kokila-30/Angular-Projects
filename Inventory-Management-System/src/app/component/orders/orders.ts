import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InventoryService } from '../../services/inventory.service';
import { OrderDialogComponent } from '../../shared/order-dialog/order-dialog';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './orders.html',
  styleUrls: ['./orders.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersComponent {
  private dialog = inject(MatDialog);
  private inventoryService = inject(InventoryService);

  // Signals — Angular tracks these automatically with OnPush
  confirmModal = signal<{
    visible: boolean;
    type: 'delivered' | 'cancelled' | 'pending' | null;
    order: any;
  }>({ visible: false, type: null, order: null });

  toast = signal<{ visible: boolean; message: string; success: boolean }>({
    visible: false, message: '', success: true
  });

  get orders() {
    return this.inventoryService.getOrders();
  }

  createOrder(): void {
    const dialogRef = this.dialog.open(OrderDialogComponent, {
      width: '900px',
      disableClose: true,
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        result.status = 'pending';
        this.inventoryService.createOrder(result);
      }
    });
  }

  getItemsList(items: any[]): string {
    if (!items) return '';
    return items.map(item => `${item.productName}: ${item.quantity} x ${item.price}`).join('\n');
  }

  openConfirm(type: 'delivered' | 'cancelled' | 'pending', order: any): void {
    this.confirmModal.set({ visible: true, type, order });
  }

  cancelConfirm(): void {
    this.confirmModal.set({ visible: false, type: null, order: null });
  }

  confirmAction(): void {
    const { type, order } = this.confirmModal();
    if (!order || !type) return;

    if (type === 'delivered') {
      order.items.forEach((item: any) => {
        const product = this.inventoryService.getProductById(item.productId);
        if (product) {
          this.inventoryService.updateProduct(item.productId, {
            quantity: product.quantity + item.quantity
          });
        }
      });
      order.status = 'delivered';
      this.inventoryService.updateOrderStatus(order.id, order);
      this.showToast(`Order ${order.orderNumber} marked as Delivered. Stock has been updated.`, true);
    } else if (type === 'cancelled') {
      order.status = 'cancelled';
      this.inventoryService.updateOrderStatus(order.id, order);
      this.showToast(`Order ${order.orderNumber} marked as Failed. No stock was added.`, false);
    } else if (type === 'pending') {
      order.status = 'pending';
      this.inventoryService.updateOrderStatus(order.id, order);
      this.showToast(`Order ${order.orderNumber} reset to Pending.`, true);
    }

    this.confirmModal.set({ visible: false, type: null, order: null });
  }

  private showToast(message: string, success: boolean): void {
    this.toast.set({ visible: true, message, success });
    setTimeout(() => {
      this.toast.set({ visible: false, message: '', success: true });
    }, 3500);
  }

  getConfirmTitle(): string {
    switch (this.confirmModal().type) {
      case 'delivered': return 'Mark as Delivered';
      case 'cancelled': return 'Mark as Failed';
      case 'pending': return 'Reset to Pending';
      default: return '';
    }
  }

  getConfirmMessage(): string {
    const { type, order } = this.confirmModal();
    if (!order) return '';
    switch (type) {
      case 'delivered':
        return `Mark order ${order.orderNumber} as Delivered? Stock quantities will be increased for all items.`;
      case 'cancelled':
        return `Mark order ${order.orderNumber} as Failed? No stock will be added.`;
      case 'pending':
        return `Reset order ${order.orderNumber} back to Pending?`;
      default: return '';
    }
  }

  getConfirmButtonClass(): string {
    switch (this.confirmModal().type) {
      case 'delivered': return 'bg-green-600 hover:bg-green-700 text-white';
      case 'cancelled': return 'bg-red-600 hover:bg-red-700 text-white';
      case 'pending': return 'bg-blue-600 hover:bg-blue-700 text-white';
      default: return '';
    }
  }
}