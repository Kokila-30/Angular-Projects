import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InventoryService } from '../../services/inventory.service';
import { InvoiceDialogComponent } from '../../shared/invoice-dialog/invoice-dialog';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './invoices.html',
  styleUrls: ['./invoices.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoicesComponent {
  private dialog = inject(MatDialog);
  protected inventoryService = inject(InventoryService);
  
  showPrintPreview = signal(false);
  selectedInvoice = signal<any>(null);

  get invoices() {
    return this.inventoryService.getInvoices()();
  }

  createInvoice(): void {
    const dialogRef = this.dialog.open(InvoiceDialogComponent, {
      width: '900px',
      disableClose: true,
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.inventoryService.createInvoice(result);
      }
    });
  }

  printInvoice(invoice: any): void {
    this.selectedInvoice.set(invoice);
    this.showPrintPreview.set(true);
    
    setTimeout(() => {
      const printContent = document.getElementById('invoice-print');
      const WindowPrt = window.open('', '', 'width=800,height=600');
      if (WindowPrt && printContent) {
        WindowPrt.document.write(`
          <html>
            <head>
              <title>Invoice ${invoice.invoiceNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .invoice-header { text-align: center; margin-bottom: 20px; }
                .invoice-title { font-size: 24px; font-weight: bold; color: #2563eb; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f3f4f6; }
                .total-section { text-align: right; margin-top: 20px; }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        WindowPrt.document.close();
        WindowPrt.print();
        WindowPrt.close();
      }
      this.showPrintPreview.set(false);
      this.selectedInvoice.set(null);
    }, 100);
  }

  // Fixed: Removed 'async' since we're using Promise.then pattern
  exportToPDF(invoice: any): void {
    this.selectedInvoice.set(invoice);
    this.showPrintPreview.set(true);
    
    setTimeout(() => {
      const element = document.getElementById('invoice-print');
      if (element) {
        html2canvas(element, {
          scale: 2,
          backgroundColor: '#ffffff'
        }).then((canvas: HTMLCanvasElement) => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });
          const imgWidth = 210;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          pdf.save(`Invoice_${invoice.invoiceNumber}.pdf`);
          this.showPrintPreview.set(false);
          this.selectedInvoice.set(null);
        }).catch((error: any) => {
          console.error('PDF generation error:', error);
          this.showPrintPreview.set(false);
          this.selectedInvoice.set(null);
        });
      } else {
        this.showPrintPreview.set(false);
        this.selectedInvoice.set(null);
      }
    }, 100);
  }

  closePreview(): void {
    this.showPrintPreview.set(false);
    this.selectedInvoice.set(null);
  }
}