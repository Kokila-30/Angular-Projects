import { Component, OnInit, ChangeDetectionStrategy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';
import { Product } from '../../models/product.model';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dashboard implements OnInit, AfterViewInit {
  @ViewChild('categoryChart') categoryChartRef!: ElementRef;
  @ViewChild('stockChart') stockChartRef!: ElementRef;
  
  totalProducts = 0;
  totalValue = 0;
  lowStockCount = 0;
  outOfStockCount = 0;
  inStockCount = 0;
  products: Product[] = [];
  categoryList: { name: string; count: number; color: string }[] = [];
  
  private categoryChart: Chart | null = null;
  private stockChart: Chart | null = null;
  
  categoryColors: { [key: string]: string } = {
    'Electronics': '#3b82f6',
    'Accessories': '#10b981',
    'Cables': '#f59e0b',
    'Clothing': '#ef4444',
    'Furniture': '#8b5cf6',
    'Other': '#6b7280'
  };

  constructor(private inventoryService: InventoryService) {}
  
  ngOnInit(): void {
    this.loadProducts();
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.createCharts();
    }, 100);
  }
  
  loadProducts(): void {
    this.inventoryService.getProductsObservable().subscribe((products: Product[]) => {
      this.products = products;
      this.calculateStats();
      this.prepareCategoryList();
      this.createCharts();
    });
  }
  
  calculateStats(): void {
    this.totalProducts = this.products.length;
    this.totalValue = this.products.reduce((sum: number, p: Product) => sum + (p.price * p.quantity), 0);
    this.lowStockCount = this.products.filter((p: Product) => p.quantity > 0 && p.quantity <= 10).length;
    this.outOfStockCount = this.products.filter((p: Product) => p.quantity === 0).length;
    this.inStockCount = this.products.filter((p: Product) => p.quantity > 10).length;
  }
  
  prepareCategoryList(): void {
    const categoryMap = new Map<string, number>();
    
    this.products.forEach((product: Product) => {
      const count = categoryMap.get(product.category) || 0;
      categoryMap.set(product.category, count + 1);
    });
    
    this.categoryList = Array.from(categoryMap.keys()).map((cat: string) => ({
      name: cat,
      count: categoryMap.get(cat) || 0,
      color: this.categoryColors[cat] || '#6b7280'
    }));
  }
  
  createCharts(): void {
    this.createCategoryChart();
    this.createStockChart();
  }
  
  createCategoryChart(): void {
    if (this.categoryChart) {
      this.categoryChart.destroy();
    }
    
    if (!this.categoryChartRef?.nativeElement) return;
    
    const ctx = this.categoryChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const labels = this.categoryList.map(c => c.name);
    const data = this.categoryList.map(c => c.count);
    const backgroundColors = this.categoryList.map(c => c.color);
    
    if (labels.length === 0) return;
    
    this.categoryChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
  
  createStockChart(): void {
    if (this.stockChart) {
      this.stockChart.destroy();
    }
    
    if (!this.stockChartRef?.nativeElement) return;
    
    const ctx = this.stockChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const topProducts = [...this.products].sort((a, b) => b.quantity - a.quantity).slice(0, 6);
    const labels = topProducts.map(p => p.name);
    const data = topProducts.map(p => p.quantity);
    const backgroundColors = topProducts.map(p => {
      if (p.quantity === 0) return '#ef4444';
      if (p.quantity <= 10) return '#f59e0b';
      return '#10b981';
    });
    
    if (labels.length === 0) return;
    
    this.stockChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Stock Quantity',
          data: data,
          backgroundColor: backgroundColors,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Quantity' } },
          x: { title: { display: true, text: 'Products' } }
        }
      }
    });
  }
}