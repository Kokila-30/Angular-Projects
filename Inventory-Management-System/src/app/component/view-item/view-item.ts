import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';
import { Product, Attachment } from '../../models/product.model';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-view-item',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './view-item.html',
  styleUrls: ['./view-item.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewItem implements OnInit {
  product: Product | null = null;
  productId: string = '';
  isLoading = true;
  showDeleteModal = false;
  deleteFileId: string = '';
  deleteFileName = '';
  showImageModal = false;
  selectedImage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.productId = params['id'];
      this.loadProduct();
    });
  }

  loadProduct(): void {
    this.isLoading = true;
    this.inventoryService.getProductsObservable().subscribe((products: Product[]) => {
      this.product = products.find((p: Product) => p.id === this.productId) || null;
      this.isLoading = false;
    });
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

  getFileIcon(fileType: string, fileName: string): string {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word') || fileName.endsWith('.docx')) return '📝';
    if (fileType.includes('excel') || fileName.endsWith('.xlsx')) return '📊';
    return '📎';
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  isImageFile(fileType: string): boolean {
    return fileType.startsWith('image/');
  }

  getImageUrl(imageData: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(imageData);
  }

  viewFile(attachment: Attachment): void {
    if (attachment.data) {
      if (this.isImageFile(attachment.type)) {
        this.selectedImage = attachment.data as string;
        this.showImageModal = true;
      } else {
        window.open(attachment.data as string, '_blank');
      }
    }
  }

  downloadFile(attachment: Attachment): void {
    if (attachment.data) {
      const link = document.createElement('a');
      link.href = attachment.data as string;
      link.download = attachment.name;
      link.click();
    }
  }

  openDeleteModal(fileId: string, fileName: string): void {
    this.deleteFileId = fileId;
    this.deleteFileName = fileName;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deleteFileId = '';
    this.deleteFileName = '';
  }

  deleteFile(): void {
    if (this.product && this.product.attachments && this.deleteFileId) {
      this.product.attachments = this.product.attachments.filter(a => a.id !== this.deleteFileId);
      this.inventoryService.updateProduct(this.product.id, { attachments: this.product.attachments });
      this.loadProduct();
      this.closeDeleteModal();
    }
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.selectedImage = '';
  }

  goBack(): void {
    this.router.navigate(['/items']);
  }

  editProduct(): void {
    this.router.navigate(['/items/edit', this.productId]);
  }
}