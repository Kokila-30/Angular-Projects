import { Injectable, Inject, PLATFORM_ID, signal, computed, effect } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product, InventoryTransaction, Invoice, Order, InvoiceItem } from '../models/product.model';
import { isPlatformBrowser } from '@angular/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private isBrowser: boolean;
  private readonly STORAGE_KEYS = {
    PRODUCTS: 'inventory_products',
    TRANSACTIONS: 'inventory_transactions',
    INVOICES: 'inventory_invoices',
    ORDERS: 'inventory_orders'
  };

  // Signals for reactive state
  private productsSignal = signal<Product[]>([]);
  private transactionsSignal = signal<InventoryTransaction[]>([]);
  private invoicesSignal = signal<Invoice[]>([]);
  private ordersSignal = signal<Order[]>([]);
  
  // Observable for existing components that use subscribe
  private productsSubject = new BehaviorSubject<Product[]>([]);
  
  // Search and filter signals
  searchTerm = signal('');
  selectedCategory = signal('');
  stockFilter = signal<'all' | 'low' | 'out' | 'in'>('all');
  sortBy = signal<'name' | 'price' | 'quantity' | 'createdAt'>('name');
  sortOrder = signal<'asc' | 'desc'>('asc');
  
  // Computed signals for filtered and sorted products
  filteredProducts = computed(() => {
    let products = this.productsSignal();
    
    const search = this.searchTerm().toLowerCase();
    if (search) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.sku.toLowerCase().includes(search)
      );
    }
    
    const category = this.selectedCategory();
    if (category) {
      products = products.filter(p => p.category === category);
    }
    
    const stock = this.stockFilter();
    if (stock === 'low') {
      products = products.filter(p => p.quantity > 0 && p.quantity <= 10);
    } else if (stock === 'out') {
      products = products.filter(p => p.quantity === 0);
    } else if (stock === 'in') {
      products = products.filter(p => p.quantity > 10);
    }
    
    const sortField = this.sortBy();
    const order = this.sortOrder();
    return [...products].sort((a, b) => {
      let aVal: any = a[sortField as keyof Product];
      let bVal: any = b[sortField as keyof Product];
      if (sortField === 'price' || sortField === 'quantity') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  });
  
  // Statistics computed signals
  totalProducts = computed(() => this.productsSignal().length);
  totalValue = computed(() => this.productsSignal().reduce((sum, p) => sum + (p.price * p.quantity), 0));
  lowStockCount = computed(() => this.productsSignal().filter(p => p.quantity > 0 && p.quantity <= 10).length);
  outOfStockCount = computed(() => this.productsSignal().filter(p => p.quantity === 0).length);
  inStockCount = computed(() => this.productsSignal().filter(p => p.quantity > 10).length);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.loadFromLocalStorage();
      if (this.productsSignal().length === 0) {
        this.loadSampleData();
      }
    }
    
    // Effect to save to localStorage whenever data changes
    effect(() => {
      if (this.isBrowser) {
        localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(this.productsSignal()));
        localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactionsSignal()));
        localStorage.setItem(this.STORAGE_KEYS.INVOICES, JSON.stringify(this.invoicesSignal()));
        localStorage.setItem(this.STORAGE_KEYS.ORDERS, JSON.stringify(this.ordersSignal()));
        
        // Update observable for components using subscribe
        this.productsSubject.next(this.productsSignal());
      }
    });
  }

  private loadFromLocalStorage(): void {
    // Load products from localStorage
    const storedProducts = localStorage.getItem(this.STORAGE_KEYS.PRODUCTS);
    if (storedProducts) {
      try {
        const products = JSON.parse(storedProducts);
        products.forEach((product: any) => {
          product.createdAt = new Date(product.createdAt);
          product.updatedAt = new Date(product.updatedAt);
        });
        this.productsSignal.set(products);
        this.productsSubject.next(products);
      } catch (e) {
        console.error('Error loading products from localStorage', e);
      }
    }

    // Load transactions from localStorage
    const storedTransactions = localStorage.getItem(this.STORAGE_KEYS.TRANSACTIONS);
    if (storedTransactions) {
      try {
        const transactions = JSON.parse(storedTransactions);
        transactions.forEach((transaction: any) => {
          transaction.date = new Date(transaction.date);
        });
        this.transactionsSignal.set(transactions);
      } catch (e) {
        console.error('Error loading transactions from localStorage', e);
      }
    }
    
    // Load invoices from localStorage
    const storedInvoices = localStorage.getItem(this.STORAGE_KEYS.INVOICES);
    if (storedInvoices) {
      try {
        const invoices = JSON.parse(storedInvoices);
        invoices.forEach((invoice: any) => {
          invoice.createdAt = new Date(invoice.createdAt);
        });
        this.invoicesSignal.set(invoices);
      } catch (e) {
        console.error('Error loading invoices from localStorage', e);
      }
    }
    
    // Load orders from localStorage
    const storedOrders = localStorage.getItem(this.STORAGE_KEYS.ORDERS);
    if (storedOrders) {
      try {
        const orders = JSON.parse(storedOrders);
        orders.forEach((order: any) => {
          order.createdAt = new Date(order.createdAt);
          order.updatedAt = new Date(order.updatedAt);
        });
        this.ordersSignal.set(orders);
      } catch (e) {
        console.error('Error loading orders from localStorage', e);
      }
    }
  }

  private loadSampleData(): void {
    const sampleProducts: Product[] = [
      {
        id: uuidv4(),
        name: 'Laptop Pro',
        sku: 'LAP-001',
        category: 'Electronics',
        quantity: 45,
        price: 999.99,
        description: 'High-performance laptop with 16GB RAM and 512GB SSD',
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Wireless Mouse',
        sku: 'MOU-002',
        category: 'Accessories',
        quantity: 8,
        price: 29.99,
        description: 'Ergonomic wireless mouse with Bluetooth connectivity',
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'USB-C Cable',
        sku: 'CAB-003',
        category: 'Cables',
        quantity: 0,
        price: 12.99,
        description: 'Fast charging USB-C cable, 6ft length',
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    this.productsSignal.set(sampleProducts);
    this.productsSubject.next(sampleProducts);
    
    // Initialize empty arrays for other data
    this.transactionsSignal.set([]);
    this.invoicesSignal.set([]);
    this.ordersSignal.set([]);
  }
  
  // Observable method for components using subscribe (backward compatibility)
  getProductsObservable(): Observable<Product[]> {
    return this.productsSubject.asObservable();
  }
  
  // Signal method for new components
  getProducts() {
    return this.filteredProducts;
  }
  
  // Returns all products unfiltered — use this where filters should not apply (e.g. invoice dialog)
  getAllProducts(): Product[] {
    return this.productsSignal();
  }
  
  getProductById(id: string): Product | undefined {
    return this.productsSignal().find(p => p.id === id);
  }
  
  addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): void {
    const newProduct: Product = {
      ...product,
      id: uuidv4(),
      attachments: product.attachments || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.productsSignal.update(products => [...products, newProduct]);
  }
  
  updateProduct(id: string, updates: Partial<Product>): void {
    this.productsSignal.update(products => 
      products.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p)
    );
  }
  
  deleteProduct(id: string): void {
    this.productsSignal.update(products => products.filter(p => p.id !== id));
  }
  
  // Filter methods
  updateSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }
  
  updateCategory(category: string): void {
    this.selectedCategory.set(category);
  }
  
  updateStockFilter(filter: 'all' | 'low' | 'out' | 'in'): void {
    this.stockFilter.set(filter);
  }
  
  updateSort(sortBy: 'name' | 'price' | 'quantity' | 'createdAt', order: 'asc' | 'desc'): void {
    this.sortBy.set(sortBy);
    this.sortOrder.set(order);
  }
  
  // Get unique categories
  getCategories(): string[] {
    return [...new Set(this.productsSignal().map(p => p.category))];
  }
  
  // Invoice methods
  createInvoice(invoiceData: any): void {
    const newInvoice = {
      ...invoiceData,
      id: uuidv4(),
      createdAt: new Date()
    };
    this.invoicesSignal.update(invoices => [...invoices, newInvoice]);
    
    // Update stock quantities for each item
    if (invoiceData.items && invoiceData.items.length > 0) {
      invoiceData.items.forEach((item: any) => {
        const product = this.getProductById(item.productId);
        if (product) {
          const newQuantity = product.quantity - item.quantity;
          this.updateProduct(item.productId, { quantity: newQuantity >= 0 ? newQuantity : 0 });
        }
      });
    }
  }
  
  getInvoices() {
    return this.invoicesSignal;
  }
  
  // Order methods
  createOrder(orderData: any): void {
    const newOrder = {
      ...orderData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.ordersSignal.update(orders => [...orders, newOrder]);
  }
  
  updateOrderStatus(id: string, orderData: any): void {
    this.ordersSignal.update(orders =>
      orders.map(o => o.id === id ? { ...o, ...orderData, updatedAt: new Date() } : o)
    );
  }
  
  getOrders() {
    return this.ordersSignal;
  }
  
  // Stock adjustment
  adjustStock(productId: string, quantity: number, type: 'IN' | 'OUT', notes: string): boolean {
    const product = this.getProductById(productId);
    if (!product) return false;
    if (type === 'OUT' && product.quantity < quantity) return false;
    
    const newQuantity = type === 'IN' ? product.quantity + quantity : product.quantity - quantity;
    this.updateProduct(productId, { quantity: newQuantity });
    
    const transaction: InventoryTransaction = {
      id: uuidv4(),
      productId,
      type,
      quantity,
      date: new Date(),
      notes
    };
    this.transactionsSignal.update(transactions => [...transactions, transaction]);
    
    return true;
  }
  
  getTransactions() {
    return this.transactionsSignal;
  }
  
  // Low stock products
  getLowStockProducts(threshold: number = 10): Product[] {
    return this.productsSignal().filter(p => p.quantity <= threshold);
  }
}