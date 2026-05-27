import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../models/product.model';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './item-list.html',
  styleUrls: ['./item-list.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemList implements OnInit {
  products: Product[] = [];
  showDeleteModal = false;
  deleteProductId: string | null = null;
  deleteProductName: string = '';
  isLoading = true;

  constructor(private inventoryService: InventoryService) {}
  
  ngOnInit(): void {
    this.loadProducts();
  }
  
  loadProducts(): void {
    this.isLoading = true;
    // FIXED: Use getProductsObservable() instead of getProducts()
    this.inventoryService.getProductsObservable().subscribe({
      next: (products: Product[]) => {
        this.products = products;
        this.isLoading = false;
      },
      error: (err: Error) => {
        console.error('Error loading products:', err);
        this.isLoading = false;
      }
    });
  }
  
  getAttachmentCount(product: Product): number {
    return product.attachments ? product.attachments.length : 0;
  }
  
  getDescriptionPreview(description: string): string {
    if (!description) return '';
    if (description.length <= 30) return description;
    return description.substring(0, 30) + '...';
  }
  
  openDeleteModal(id: string, name: string): void {
    this.deleteProductId = id;
    this.deleteProductName = name;
    this.showDeleteModal = true;
  }
  
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deleteProductId = null;
    this.deleteProductName = '';
  }
  
  confirmDelete(): void {
    if (this.deleteProductId) {
      this.inventoryService.deleteProduct(this.deleteProductId);
      this.loadProducts();
      this.closeDeleteModal();
    }
  }
  
  getStockStatusClass(quantity: number): string {
    if (quantity === 0) return 'text-red-600 font-bold';
    if (quantity <= 10) return 'text-orange-600 font-bold';
    return 'text-green-600';
  }
  
  getStockStatusText(quantity: number): string {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= 10) return 'Low Stock';
    return 'In Stock';
  }
  
  getStockBadgeClass(quantity: number): string {
    if (quantity === 0) return 'bg-red-100 text-red-800';
    if (quantity <= 10) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  }
}