import { Component, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-product-dialog',
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
  template: `
    <h2 mat-dialog-title>{{data && data.product ? 'Edit Product' : 'Add New Product'}}</h2>
    <form [formGroup]="productForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="grid gap-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Product Name</mat-label>
            <input matInput formControlName="name" required>
            <mat-error *ngIf="productForm.get('name')?.hasError('required')">Name is required</mat-error>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>SKU</mat-label>
            <input matInput formControlName="sku" required>
            <mat-error *ngIf="productForm.get('sku')?.hasError('required')">SKU is required</mat-error>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Category</mat-label>
            <mat-select formControlName="category" required>
              <mat-option value="Electronics">Electronics</mat-option>
              <mat-option value="Accessories">Accessories</mat-option>
              <mat-option value="Cables">Cables</mat-option>
              <mat-option value="Clothing">Clothing</mat-option>
              <mat-option value="Furniture">Furniture</mat-option>
              <mat-option value="Other">Other</mat-option>
            </mat-select>
          </mat-form-field>
          
          <div class="grid grid-cols-2 gap-4">
            <mat-form-field appearance="outline">
              <mat-label>Quantity</mat-label>
              <input matInput type="number" formControlName="quantity" required min="0">
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Price</mat-label>
              <input matInput type="number" formControlName="price" required min="0">
            </mat-form-field>
          </div>
          
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" rows="3"></textarea>
          </mat-form-field>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="productForm.invalid">
          {{data && data.product ? 'Update' : 'Create'}}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    mat-form-field { width: 100%; margin-bottom: 8px; }
  `]
})
export class ProductDialogComponent {
  productForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { product?: any }
  ) {
    this.productForm = this.fb.group({
      name: [data?.product?.name || '', Validators.required],
      sku: [data?.product?.sku || '', Validators.required],
      category: [data?.product?.category || '', Validators.required],
      quantity: [data?.product?.quantity || 0, [Validators.required, Validators.min(0)]],
      price: [data?.product?.price || 0, [Validators.required, Validators.min(0)]],
      description: [data?.product?.description || '']
    });
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      this.dialogRef.close(this.productForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}