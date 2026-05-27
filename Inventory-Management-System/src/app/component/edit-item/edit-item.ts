import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';
import { Product, Attachment } from '../../models/product.model';

@Component({
  selector: 'app-edit-item',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-item.html',
  styleUrls: ['./edit-item.css']
})
export class EditItem implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  productForm: FormGroup;
  attachments: Attachment[] = [];
  isDragging = false;
  isLoading = true;
  productId: string = '';

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      sku: ['', Validators.required],
      category: ['', Validators.required],
      quantity: [0, [Validators.required, Validators.min(0)]],
      price: [0, [Validators.required, Validators.min(0)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.productId = params['id'];
      this.loadProduct();
    });
  }

  // FIXED: Use getProductById method instead of subscribe on Signal
  loadProduct(): void {
    this.isLoading = true;
    const product = this.inventoryService.getProductById(this.productId);
    if (product) {
      this.productForm.patchValue({
        name: product.name,
        sku: product.sku,
        category: product.category,
        quantity: product.quantity,
        price: product.price,
        description: product.description || ''
      });
      this.attachments = product.attachments || [];
    }
    this.isLoading = false;
  }

  // FIXED: Added proper type for event parameter
  onQuantityInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    value = value.replace(/[^0-9]/g, '');
    let numValue = parseInt(value);
    if (isNaN(numValue)) numValue = 0;
    if (numValue < 0) numValue = 0;
    this.productForm.patchValue({ quantity: numValue }, { emitEvent: false });
  }

  // FIXED: Added proper type for event parameter
  onPriceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    value = value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    let numValue = parseFloat(value);
    if (isNaN(numValue)) numValue = 0;
    if (numValue < 0) numValue = 0;
    this.productForm.patchValue({ price: numValue }, { emitEvent: false });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(input.files);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files) {
      this.processFiles(files);
    }
  }

  processFiles(files: FileList): void {
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Max size 5MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.attachments.push({
          id: Math.random().toString(36).substring(2),
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    });
  }

  removeAttachment(id: string): void {
    this.attachments = this.attachments.filter(a => a.id !== id);
  }

  getFileIcon(type: string, name: string): string {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word') || name.endsWith('.docx')) return '📝';
    if (type.includes('excel') || name.endsWith('.xlsx')) return '📊';
    return '📎';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      const productData = {
        ...this.productForm.value,
        attachments: this.attachments
      };
      this.inventoryService.updateProduct(this.productId, productData);
      this.router.navigate(['/items']);
    }
  }

  cancel(): void {
    this.router.navigate(['/items']);
  }
}