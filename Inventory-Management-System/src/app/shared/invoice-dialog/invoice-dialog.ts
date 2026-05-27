import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-invoice-dialog',
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
  templateUrl: './invoice-dialog.html',
  styleUrls: ['./invoice-dialog.css']
})
export class InvoiceDialogComponent {
  invoiceForm: FormGroup;
  products: any[] = [];
  stockErrors: { [index: number]: string } = {};

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<InvoiceDialogComponent>,
    private inventoryService: InventoryService,
    private cdr: ChangeDetectorRef
  ) {
    // Load all products (unfiltered) for selection
    this.products = this.inventoryService.getAllProducts();

    this.invoiceForm = this.fb.group({
      customerName: ['', Validators.required],
      customerPhone: [''],
      customerEmail: [''],
      items: this.fb.array([]),
      tax: [0],
      discount: [0],
      paymentMethod: ['cash', Validators.required],
      paymentStatus: ['paid', Validators.required]
    });
  }

  get items() { return this.invoiceForm.get('items') as FormArray; }

  addItem() {
    this.items.push(this.fb.group({
      productId: ['', Validators.required],
      productName: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      price: [0],
      total: [0]
    }));
  }

  removeItem(index: number) {
    this.items.removeAt(index);
    delete this.stockErrors[index];
    // Re-index errors for items after removed index
    const newErrors: { [index: number]: string } = {};
    Object.keys(this.stockErrors).forEach(k => {
      const ki = parseInt(k);
      if (ki > index) newErrors[ki - 1] = this.stockErrors[ki];
      else newErrors[ki] = this.stockErrors[ki];
    });
    this.stockErrors = newErrors;
  }

  // BUG FIX 2: Read productId from the reactive form control value, not from event.target.value
  // Previously: event.target.value was read before the form control had updated, causing missed lookups
  onProductSelect(index: number) {
    const item = this.items.at(index);
    const productId = item.get('productId')?.value;
    const product = this.products.find(p => p.id === productId);
    if (product) {
      const quantity = item.get('quantity')?.value || 1;
      item.patchValue({
        productName: product.name,
        price: product.price,
        total: product.price * quantity
      });
      this.validateStock(index);
    }
  }

  updateItemTotal(index: number) {
    const item = this.items.at(index);
    const total = (item.get('quantity')?.value || 0) * (item.get('price')?.value || 0);
    item.patchValue({ total }, { emitEvent: false });
    this.validateStock(index);
  }

  // BUG FIX 4: Validate quantity against available stock and show an error
  validateStock(index: number): void {
    const item = this.items.at(index);
    const productId = item.get('productId')?.value;
    const quantity = item.get('quantity')?.value || 0;
    const product = this.products.find(p => p.id === productId);
    if (product && quantity > product.quantity) {
      this.stockErrors[index] = `Only ${product.quantity} in stock`;
    } else {
      delete this.stockErrors[index];
    }
  }

  hasStockErrors(): boolean {
    return Object.keys(this.stockErrors).length > 0;
  }

  getItemPrice(index: number): number {
    return this.items.at(index).get('price')?.value || 0;
  }

  getItemTotal(index: number): number {
    return this.items.at(index).get('total')?.value || 0;
  }

  getSubtotal(): number {
    let total = 0;
    for (let i = 0; i < this.items.length; i++) {
      total += this.getItemTotal(i);
    }
    return total;
  }

  getTaxAmount(): number {
    return (this.getSubtotal() * (this.invoiceForm.get('tax')?.value || 0)) / 100;
  }

  discountAmount(): number {
    return this.invoiceForm.get('discount')?.value || 0;
  }

  totalAmount(): number {
    return this.getSubtotal() + this.getTaxAmount() - this.discountAmount();
  }

  // BUG FIX 3: calculateTotal no longer calls updateValueAndValidity() (which did nothing useful)
  // Totals are computed from live form values via getSubtotal/getTaxAmount/totalAmount methods
  calculateTotal() {
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (this.invoiceForm.valid && this.items.length > 0 && !this.hasStockErrors()) {
      const invoiceData = {
        customerName: this.invoiceForm.get('customerName')?.value,
        customerPhone: this.invoiceForm.get('customerPhone')?.value,
        customerEmail: this.invoiceForm.get('customerEmail')?.value,
        items: this.items.value,
        tax: this.invoiceForm.get('tax')?.value || 0,
        discount: this.invoiceForm.get('discount')?.value || 0,
        paymentMethod: this.invoiceForm.get('paymentMethod')?.value,
        paymentStatus: this.invoiceForm.get('paymentStatus')?.value,
        invoiceNumber: 'INV-' + Date.now(),
        subtotal: this.getSubtotal(),
        taxAmount: this.getTaxAmount(),
        total: this.totalAmount()
      };
      this.dialogRef.close(invoiceData);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}