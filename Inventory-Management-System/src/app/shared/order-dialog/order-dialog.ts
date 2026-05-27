import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-order-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './order-dialog.html',
  styleUrls: ['./order-dialog.css']
})
export class OrderDialogComponent {
  orderForm: FormGroup;
  products: any[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<OrderDialogComponent>,
    private inventoryService: InventoryService
  ) {
    this.products = this.inventoryService.getAllProducts();
    
    this.orderForm = this.fb.group({
      supplierName: ['', Validators.required],
      items: this.fb.array([]),
      notes: ['']
    });
  }

  get items() { return this.orderForm.get('items') as FormArray; }

  addItem() {
    this.items.push(this.fb.group({
      productId: ['', Validators.required],
      productName: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      price: [0, [Validators.required, Validators.min(0)]],
      total: [0]
    }));
  }

  removeItem(index: number) { this.items.removeAt(index); }

  onProductSelect(index: number) {
    const productId = this.items.at(index).get('productId')?.value;
    const product = this.products.find(p => p.id === productId);
    if (product) {
      const item = this.items.at(index);
      const quantity = item.get('quantity')?.value || 1;
      item.patchValue({
        productName: product.name,
        price: product.price,
        total: product.price * quantity
      });
    }
  }

  updateItemTotal(index: number) {
    const item = this.items.at(index);
    const total = (item.get('quantity')?.value || 0) * (item.get('price')?.value || 0);
    item.patchValue({ total: total });
  }

  getItemTotal(index: number): number {
    return this.items.at(index).get('total')?.value || 0;
  }

  getTotalAmount(): number {
    let total = 0;
    for (let i = 0; i < this.items.length; i++) {
      total += this.getItemTotal(i);
    }
    return total;
  }

  onSubmit(): void {
    if (this.orderForm.valid && this.items.length > 0) {
      const orderData = {
        supplierName: this.orderForm.get('supplierName')?.value,
        
        items: this.items.value,
        notes: this.orderForm.get('notes')?.value,
        orderNumber: 'PO-' + Date.now(),
        totalAmount: this.getTotalAmount(),
        createdAt: new Date()
      };
      this.dialogRef.close(orderData);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}