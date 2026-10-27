// ==============================================================================
// Billing Recap & Excel/PDF Export Engine
// Work Package: APP-MAHAD-FINANCE-BILLING-001 (Modul D & Modul E)
// Compliance: Anti-Formula Injection, Single Source of Truth, Multi-Tenant Isolation
// ==============================================================================

import { db } from '@/lib/db';
import {
  sppBills,
  sppPayments,
  billingCampaigns,
} from '@/lib/db/schema/finance';
import { santri, tenantSettings, tenants } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface RecapFilterInput {
  tenantId: string;
  campaignId?: string;
  category?: string;
  periodMonthYear?: string;
  kelas?: string;
  statusFilter?: 'ALL' | 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'OVERDUE';
  searchQuery?: string;
}

export interface StudentRecapItem {
  billId: string;
  billNumber: string;
  title: string;
  category: string;
  santriId: string;
  santriName: string;
  nis: string;
  kelas: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  paymentStatus: 'LUNAS' | 'SEBAGIAN' | 'BELUM_BAYAR' | 'MENUNGGAK';
  lastPaymentDate?: string | null;
}

export interface RecapSummary {
  totalSantriBilled: number;
  totalAmountBilled: number;
  totalVerifiedPaid: number;
  totalRemainingBalance: number;
  countLunas: number;
  countSebagian: number;
  countBelumBayar: number;
  countMenunggak: number;
  repaymentRatePercentage: number;
}

export interface BillingRecapResult {
  summary: RecapSummary;
  items: StudentRecapItem[];
  campaign?: typeof billingCampaigns.$inferSelect | null;
}

/**
 * Sanitizes any cell value to prevent CSV / Excel Formula Injection (CSV Injection).
 * If cell starts with '=', '+', '-', or '@', prepends single quote "'"
 */
export function sanitizeExcelFormulaCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousPrefixes.some((p) => str.startsWith(p))) {
    return `'${str}`;
  }
  return str;
}

export class RecapExportService {
  /**
   * Calculates real-time billing recap and per-student details.
   */
  async getBillingRecap(filter: RecapFilterInput): Promise<BillingRecapResult> {
    const {
      tenantId,
      campaignId,
      category,
      periodMonthYear,
      kelas,
      statusFilter = 'ALL',
      searchQuery,
    } = filter;

    const conditions = [eq(sppBills.tenantId, tenantId)];

    if (campaignId) {
      conditions.push(eq(sppBills.campaignId, campaignId));
    }
    if (category) {
      conditions.push(eq(sppBills.category, category));
    }
    if (periodMonthYear) {
      conditions.push(eq(sppBills.periodMonthYear, periodMonthYear));
    }

    // 1. Query bills joined with santri for class & nis
    const billsQuery = await db
      .select({
        bill: sppBills,
        santriKelas: santri.kelas,
        santriNis: santri.nis,
      })
      .from(sppBills)
      .leftJoin(santri, eq(sppBills.santriId, santri.id))
      .where(and(...conditions))
      .orderBy(desc(sppBills.createdAt));

    // 2. Fetch campaign metadata if campaignId is present
    let campaign = null;
    if (campaignId) {
      const campRows = await db
        .select()
        .from(billingCampaigns)
        .where(
          and(
            eq(billingCampaigns.tenantId, tenantId),
            eq(billingCampaigns.id, campaignId)
          )
        )
        .limit(1);
      campaign = campRows[0] || null;
    }

    const now = new Date();
    const items: StudentRecapItem[] = [];

    let totalAmountBilled = 0;
    let totalVerifiedPaid = 0;
    let totalRemainingBalance = 0;

    let countLunas = 0;
    let countSebagian = 0;
    let countBelumBayar = 0;
    let countMenunggak = 0;

    for (const row of billsQuery) {
      const b = row.bill;
      const studentClass = row.santriKelas || 'Umum';
      const studentNis = row.santriNis || '-';

      // Apply kelas filter if provided
      if (kelas && kelas !== 'ALL' && studentClass !== kelas) {
        continue;
      }

      // Apply search query if provided
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = b.santriName.toLowerCase().includes(query);
        const matchesNis = studentNis.toLowerCase().includes(query);
        const matchesBillNum = b.billNumber.toLowerCase().includes(query);
        if (!matchesName && !matchesNis && !matchesBillNum) {
          continue;
        }
      }

      const isPaid = b.remainingAmount === 0 || b.status === 'PAID';
      const isPartiallyPaid = b.paidAmount > 0 && b.remainingAmount > 0;
      const isOverdue = !isPaid && new Date(b.dueDate) < now;

      let paymentStatus: 'LUNAS' | 'SEBAGIAN' | 'BELUM_BAYAR' | 'MENUNGGAK';
      if (isPaid) {
        paymentStatus = 'LUNAS';
        countLunas++;
      } else if (isPartiallyPaid) {
        paymentStatus = 'SEBAGIAN';
        countSebagian++;
      } else if (isOverdue) {
        paymentStatus = 'MENUNGGAK';
        countMenunggak++;
      } else {
        paymentStatus = 'BELUM_BAYAR';
        countBelumBayar++;
      }

      // Apply statusFilter
      if (statusFilter === 'PAID' && paymentStatus !== 'LUNAS') continue;
      if (statusFilter === 'PARTIALLY_PAID' && paymentStatus !== 'SEBAGIAN') continue;
      if (statusFilter === 'UNPAID' && paymentStatus !== 'BELUM_BAYAR') continue;
      if (statusFilter === 'OVERDUE' && paymentStatus !== 'MENUNGGAK') continue;

      totalAmountBilled += b.totalAmount;
      totalVerifiedPaid += b.paidAmount;
      totalRemainingBalance += b.remainingAmount;

      items.push({
        billId: b.id,
        billNumber: b.billNumber,
        title: b.title || `SPP ${b.periodMonthYear}`,
        category: b.category,
        santriId: b.santriId,
        santriName: b.santriName,
        nis: studentNis,
        kelas: studentClass,
        totalAmount: b.totalAmount,
        paidAmount: b.paidAmount,
        remainingAmount: b.remainingAmount,
        dueDate: b.dueDate ? new Date(b.dueDate).toISOString() : new Date().toISOString(),
        paymentStatus,
        lastPaymentDate: b.paidAmount > 0 ? b.updatedAt.toISOString() : null,
      });
    }

    const totalSantriBilled = items.length;
    const repaymentRatePercentage =
      totalAmountBilled > 0
        ? Math.round((totalVerifiedPaid / totalAmountBilled) * 100)
        : 0;

    return {
      summary: {
        totalSantriBilled,
        totalAmountBilled,
        totalVerifiedPaid,
        totalRemainingBalance,
        countLunas,
        countSebagian,
        countBelumBayar,
        countMenunggak,
        repaymentRatePercentage,
      },
      items,
      campaign,
    };
  }

  /**
   * Generates a fully formatted, formula-injection-safe Excel Spreadsheet (.xml / .xls format)
   * supported natively by Microsoft Excel, Google Sheets, and LibreOffice.
   */
  generateExcelSpreadsheet(recap: BillingRecapResult, tenantName = 'Pesantren'): string {
    const { summary, items } = recap;
    const reportDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const rowsXml = items
      .map((item, idx) => {
        return `
      <Row>
        <Cell><Data ss:Type="Number">${idx + 1}</Data></Cell>
        <Cell><Data ss:Type="String">${sanitizeExcelFormulaCell(item.nis)}</Data></Cell>
        <Cell><Data ss:Type="String">${sanitizeExcelFormulaCell(item.santriName)}</Data></Cell>
        <Cell><Data ss:Type="String">${sanitizeExcelFormulaCell(item.kelas)}</Data></Cell>
        <Cell><Data ss:Type="String">${sanitizeExcelFormulaCell(item.title)}</Data></Cell>
        <Cell ss:StyleID="CurrencyStyle"><Data ss:Type="Number">${item.totalAmount}</Data></Cell>
        <Cell ss:StyleID="CurrencyStyle"><Data ss:Type="Number">${item.paidAmount}</Data></Cell>
        <Cell ss:StyleID="CurrencyStyle"><Data ss:Type="Number">${item.remainingAmount}</Data></Cell>
        <Cell><Data ss:Type="String">${item.paymentStatus}</Data></Cell>
        <Cell><Data ss:Type="String">${item.dueDate ? new Date(item.dueDate).toLocaleDateString('id-ID') : '-'}</Data></Cell>
      </Row>`;
      })
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="HeaderTitle">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#0F766E"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="HeaderSub">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Italic="1" ss:Color="#555555"/>
  </Style>
  <Style ss:ID="TableHeader">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F766E" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="CurrencyStyle">
   <NumberFormat ss:Format="#,##0"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SummaryLabel">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
   <Interior ss:Color="#F0FDFA" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SummaryValue">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F766E"/>
   <NumberFormat ss:Format="#,##0"/>
   <Interior ss:Color="#F0FDFA" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Rekap Pembayaran">
  <Table>
   <Column ss:Width="40"/>
   <Column ss:Width="100"/>
   <Column ss:Width="180"/>
   <Column ss:Width="70"/>
   <Column ss:Width="180"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>

   <!-- Title Header Block -->
   <Row>
    <Cell ss:MergeAcross="9" ss:StyleID="HeaderTitle">
     <Data ss:Type="String">LAPORAN REKAPITULASI PEMBAYARAN TAGIHAN SANTRI</Data>
    </Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="9" ss:StyleID="HeaderSub">
     <Data ss:Type="String">${sanitizeExcelFormulaCell(tenantName)} • Tanggal Cetak: ${reportDate}</Data>
    </Cell>
   </Row>
   <Row></Row>

   <!-- Summary Metric Block -->
   <Row>
    <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">Total Santri</Data></Cell>
    <Cell ss:StyleID="SummaryValue"><Data ss:Type="Number">${summary.totalSantriBilled}</Data></Cell>
    <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">Lunas</Data></Cell>
    <Cell ss:StyleID="SummaryValue"><Data ss:Type="Number">${summary.countLunas}</Data></Cell>
    <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">Total Ditagih</Data></Cell>
    <Cell ss:StyleID="SummaryValue"><Data ss:Type="Number">${summary.totalAmountBilled}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">Menunggak</Data></Cell>
    <Cell ss:StyleID="SummaryValue"><Data ss:Type="Number">${summary.countMenunggak}</Data></Cell>
    <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">Sebagian</Data></Cell>
    <Cell ss:StyleID="SummaryValue"><Data ss:Type="Number">${summary.countSebagian}</Data></Cell>
    <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">Penerimaan Sah</Data></Cell>
    <Cell ss:StyleID="SummaryValue"><Data ss:Type="Number">${summary.totalVerifiedPaid}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">Belum Bayar</Data></Cell>
    <Cell ss:StyleID="SummaryValue"><Data ss:Type="Number">${summary.countBelumBayar}</Data></Cell>
    <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">Persentase Lunas</Data></Cell>
    <Cell ss:StyleID="SummaryValue"><Data ss:Type="String">${summary.repaymentRatePercentage}%</Data></Cell>
    <Cell ss:StyleID="SummaryLabel"><Data ss:Type="String">Sisa Piutang</Data></Cell>
    <Cell ss:StyleID="SummaryValue"><Data ss:Type="Number">${summary.totalRemainingBalance}</Data></Cell>
   </Row>
   <Row></Row>

   <!-- Table Columns Header -->
   <Row ss:StyleID="TableHeader">
    <Cell><Data ss:Type="String">No</Data></Cell>
    <Cell><Data ss:Type="String">NIS</Data></Cell>
    <Cell><Data ss:Type="String">Nama Santri</Data></Cell>
    <Cell><Data ss:Type="String">Kelas</Data></Cell>
    <Cell><Data ss:Type="String">Tagihan</Data></Cell>
    <Cell><Data ss:Type="String">Nominal (Rp)</Data></Cell>
    <Cell><Data ss:Type="String">Terbayar (Rp)</Data></Cell>
    <Cell><Data ss:Type="String">Sisa Piutang (Rp)</Data></Cell>
    <Cell><Data ss:Type="String">Status</Data></Cell>
    <Cell><Data ss:Type="String">Jatuh Tempo</Data></Cell>
   </Row>

   <!-- Items -->
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;
  }

  /**
   * Generates a 100% genuine Office Open XML Workbook (.xlsx) binary file using ExcelJS.
   * Includes numeric formatting for rupiah, cell borders, header styles, and formula injection sanitization.
   */
  async generateXlsxWorkbook(recap: BillingRecapResult, tenantName = 'Pesantren'): Promise<Buffer> {
    const { summary, items } = recap;
    const reportDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "APP MA'HAD Enterprise Finance";
    workbook.lastModifiedBy = "APP MA'HAD";
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet('Rekap Pembayaran', {
      pageSetup: { orientation: 'landscape', fitToPage: true },
      views: [{ showGridLines: true }],
    });

    // Set column keys and widths
    sheet.columns = [
      { key: 'no', width: 6 },
      { key: 'nis', width: 14 },
      { key: 'name', width: 28 },
      { key: 'kelas', width: 12 },
      { key: 'title', width: 26 },
      { key: 'total', width: 18 },
      { key: 'paid', width: 18 },
      { key: 'remaining', width: 18 },
      { key: 'status', width: 16 },
      { key: 'dueDate', width: 14 },
    ];

    // 1. Header Banner
    const titleRow = sheet.addRow(['LAPORAN REKAPITULASI PEMBAYARAN TAGIHAN SANTRI']);
    titleRow.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF0F766E' } };
    sheet.mergeCells('A1:J1');

    const subRow = sheet.addRow([`${sanitizeExcelFormulaCell(tenantName)} • Tanggal Ekspor: ${reportDate}`]);
    subRow.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF555555' } };
    sheet.mergeCells('A2:J2');

    sheet.addRow([]); // Blank spacer

    // 2. Summary KPI Cards Block
    const s1 = sheet.addRow([
      'Total Santri',
      summary.totalSantriBilled,
      'Lunas',
      summary.countLunas,
      'Total Ditagih',
      summary.totalAmountBilled,
    ]);
    const s2 = sheet.addRow([
      'Menunggak',
      summary.countMenunggak,
      'Sebagian',
      summary.countSebagian,
      'Penerimaan Sah',
      summary.totalVerifiedPaid,
    ]);
    const s3 = sheet.addRow([
      'Belum Bayar',
      summary.countBelumBayar,
      'Persentase Lunas',
      `${summary.repaymentRatePercentage}%`,
      'Sisa Piutang',
      summary.totalRemainingBalance,
    ]);

    [s1, s2, s3].forEach((row) => {
      row.font = { name: 'Calibri', size: 10, bold: true };
      row.alignment = { vertical: 'middle' };
      [row.getCell(2), row.getCell(4), row.getCell(6)].forEach((cell) => {
        if (typeof cell.value === 'number') {
          cell.numFmt = '#,##0';
        }
      });
      for (let i = 1; i <= 6; i++) {
        const cell = row.getCell(i);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0FDFA' },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCFBF1' } },
          left: { style: 'thin', color: { argb: 'FFCCFBF1' } },
          bottom: { style: 'thin', color: { argb: 'FFCCFBF1' } },
          right: { style: 'thin', color: { argb: 'FFCCFBF1' } },
        };
      }
    });

    sheet.addRow([]); // Blank spacer

    // 3. Table Column Headers
    const headerRow = sheet.addRow([
      'No',
      'NIS',
      'Nama Santri',
      'Kelas',
      'Tagihan',
      'Nominal (Rp)',
      'Terbayar (Rp)',
      'Sisa Piutang (Rp)',
      'Status',
      'Jatuh Tempo',
    ]);
    headerRow.height = 24;
    headerRow.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F766E' },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF0D9488' } },
        left: { style: 'thin', color: { argb: 'FF0D9488' } },
        bottom: { style: 'medium', color: { argb: 'FF115E59' } },
        right: { style: 'thin', color: { argb: 'FF0D9488' } },
      };
    });

    // 4. Data Rows
    items.forEach((item, idx) => {
      const row = sheet.addRow([
        idx + 1,
        sanitizeExcelFormulaCell(item.nis),
        sanitizeExcelFormulaCell(item.santriName),
        sanitizeExcelFormulaCell(item.kelas),
        sanitizeExcelFormulaCell(item.title),
        item.totalAmount,
        item.paidAmount,
        item.remainingAmount,
        item.paymentStatus,
        item.dueDate ? new Date(item.dueDate).toLocaleDateString('id-ID') : '-',
      ]);

      row.font = { name: 'Calibri', size: 10 };
      row.alignment = { vertical: 'middle' };

      // Number alignments & formats
      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(2).alignment = { horizontal: 'center' };
      row.getCell(4).alignment = { horizontal: 'center' };
      row.getCell(6).alignment = { horizontal: 'right' };
      row.getCell(6).numFmt = '#,##0';
      row.getCell(7).alignment = { horizontal: 'right' };
      row.getCell(7).numFmt = '#,##0';
      row.getCell(8).alignment = { horizontal: 'right' };
      row.getCell(8).numFmt = '#,##0';
      row.getCell(9).alignment = { horizontal: 'center' };
      row.getCell(10).alignment = { horizontal: 'center' };

      // Zebra striping
      const isEven = idx % 2 === 0;
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
        if (!isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
        }
      });
    });

    const uint8Array = await workbook.xlsx.writeBuffer();
    return Buffer.from(uint8Array);
  }

  /**
   * Generates a 100% valid direct binary PDF document with multi-page handling,
   * Kop Pesantren branding, summary metrics, and repeating table headers.
   */
  async generatePdfDocument(
    recap: BillingRecapResult,
    tenantName = 'Pesantren',
    tagline = 'Sistem Administrasi Keuangan Pesantren Terpadu'
  ): Promise<Buffer> {
    const { summary, items } = recap;
    const reportDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(`Rekapitulasi Pembayaran - ${tenantName}`);
    pdfDoc.setAuthor("APP MA'HAD Enterprise Finance");

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Page dimensions: A4 Landscape: 841.89 x 595.28
    const PAGE_WIDTH = 841.89;
    const PAGE_HEIGHT = 595.28;
    const MARGIN = 40;
    const USABLE_WIDTH = PAGE_WIDTH - MARGIN * 2; // 761.89

    const colWidths = {
      no: 30,
      nis: 75,
      name: 155,
      kelas: 50,
      title: 135,
      total: 80,
      paid: 80,
      remaining: 80,
      status: 75,
    };

    const drawHeader = (page: any, isFirstPage: boolean) => {
      let currentY = PAGE_HEIGHT - MARGIN;

      if (isFirstPage) {
        // Kop Pesantren Banner
        page.drawText(tenantName.toUpperCase(), {
          x: MARGIN,
          y: currentY,
          size: 14,
          font: fontBold,
          color: rgb(0.06, 0.46, 0.43),
        });
        currentY -= 14;

        page.drawText(tagline, {
          x: MARGIN,
          y: currentY,
          size: 9,
          font: fontOblique,
          color: rgb(0.4, 0.4, 0.4),
        });
        currentY -= 14;

        // Divider Line
        page.drawLine({
          start: { x: MARGIN, y: currentY },
          end: { x: PAGE_WIDTH - MARGIN, y: currentY },
          thickness: 1.5,
          color: rgb(0.06, 0.46, 0.43),
        });
        currentY -= 16;

        // Report Title
        page.drawText('LAPORAN REKAPITULASI PEMBAYARAN TAGIHAN SANTRI', {
          x: MARGIN,
          y: currentY,
          size: 11,
          font: fontBold,
          color: rgb(0.1, 0.1, 0.1),
        });
        currentY -= 12;

        const campaignInfo = recap.campaign?.title
          ? `Tagihan: ${recap.campaign.title} (${recap.campaign.category}) • Tanggal Cetak: ${reportDate}`
          : `Tanggal Cetak: ${reportDate}`;
        page.drawText(campaignInfo, {
          x: MARGIN,
          y: currentY,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.3, 0.3, 0.3),
        });
        currentY -= 16;

        // Summary Metric Box
        const boxHeight = 36;
        page.drawRectangle({
          x: MARGIN,
          y: currentY - boxHeight,
          width: USABLE_WIDTH,
          height: boxHeight,
          color: rgb(0.94, 0.99, 0.98),
          borderColor: rgb(0.8, 0.95, 0.93),
          borderWidth: 1,
        });

        // Box Row 1
        page.drawText(
          `Total Ditagih: Rp ${summary.totalAmountBilled.toLocaleString('id-ID')} (${summary.totalSantriBilled} Santri)    |    Penerimaan Sah: Rp ${summary.totalVerifiedPaid.toLocaleString('id-ID')}    |    Sisa Piutang: Rp ${summary.totalRemainingBalance.toLocaleString('id-ID')}    |    Pelunasan: ${summary.repaymentRatePercentage}%`,
          {
            x: MARGIN + 10,
            y: currentY - 14,
            size: 8.5,
            font: fontBold,
            color: rgb(0.06, 0.46, 0.43),
          }
        );

        // Box Row 2
        page.drawText(
          `Status Breakdown: Lunas: ${summary.countLunas}    •    Sebagian: ${summary.countSebagian}    •    Belum Bayar: ${summary.countBelumBayar}    •    Menunggak: ${summary.countMenunggak}`,
          {
            x: MARGIN + 10,
            y: currentY - 28,
            size: 8,
            font: fontRegular,
            color: rgb(0.2, 0.2, 0.2),
          }
        );

        currentY -= boxHeight + 14;
      } else {
        // Subsequent page mini header
        page.drawText(`LAPORAN REKAPITULASI — ${tenantName.toUpperCase()} (Lanjutan)`, {
          x: MARGIN,
          y: currentY,
          size: 9,
          font: fontBold,
          color: rgb(0.3, 0.3, 0.3),
        });
        currentY -= 18;
      }

      // Draw Table Header
      const headerHeight = 20;
      page.drawRectangle({
        x: MARGIN,
        y: currentY - headerHeight,
        width: USABLE_WIDTH,
        height: headerHeight,
        color: rgb(0.06, 0.46, 0.43),
      });

      let hX = MARGIN;
      const headers = [
        { label: 'No', width: colWidths.no },
        { label: 'NIS', width: colWidths.nis },
        { label: 'Nama Santri', width: colWidths.name },
        { label: 'Kelas', width: colWidths.kelas },
        { label: 'Tagihan', width: colWidths.title },
        { label: 'Nominal (Rp)', width: colWidths.total },
        { label: 'Terbayar (Rp)', width: colWidths.paid },
        { label: 'Sisa (Rp)', width: colWidths.remaining },
        { label: 'Status', width: colWidths.status },
      ];

      headers.forEach((h) => {
        page.drawText(h.label, {
          x: hX + 4,
          y: currentY - 14,
          size: 8,
          font: fontBold,
          color: rgb(1, 1, 1),
        });
        hX += h.width;
      });

      currentY -= headerHeight;
      return currentY;
    };

    let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let currentY = drawHeader(currentPage, true);
    const rowHeight = 18;
    const BOTTOM_LIMIT = MARGIN + 25;

    const truncate = (str: string, maxLen: number) => {
      if (!str) return '';
      return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
    };

    items.forEach((item, idx) => {
      if (currentY - rowHeight < BOTTOM_LIMIT) {
        currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        currentY = drawHeader(currentPage, false);
      }

      if (idx % 2 === 1) {
        currentPage.drawRectangle({
          x: MARGIN,
          y: currentY - rowHeight,
          width: USABLE_WIDTH,
          height: rowHeight,
          color: rgb(0.97, 0.98, 0.98),
        });
      }

      currentPage.drawLine({
        start: { x: MARGIN, y: currentY - rowHeight },
        end: { x: PAGE_WIDTH - MARGIN, y: currentY - rowHeight },
        thickness: 0.5,
        color: rgb(0.88, 0.88, 0.88),
      });

      const textY = currentY - 12;
      let rX = MARGIN;

      // No
      currentPage.drawText(String(idx + 1), { x: rX + 4, y: textY, size: 7.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
      rX += colWidths.no;

      // NIS
      currentPage.drawText(truncate(item.nis, 12), { x: rX + 4, y: textY, size: 7.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
      rX += colWidths.nis;

      // Nama Santri
      currentPage.drawText(truncate(item.santriName, 26), { x: rX + 4, y: textY, size: 8, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      rX += colWidths.name;

      // Kelas
      currentPage.drawText(truncate(item.kelas, 8), { x: rX + 4, y: textY, size: 7.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
      rX += colWidths.kelas;

      // Tagihan
      currentPage.drawText(truncate(item.title, 22), { x: rX + 4, y: textY, size: 7.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
      rX += colWidths.title;

      // Nominal
      currentPage.drawText(item.totalAmount.toLocaleString('id-ID'), { x: rX + 4, y: textY, size: 7.5, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
      rX += colWidths.total;

      // Terbayar
      currentPage.drawText(item.paidAmount.toLocaleString('id-ID'), { x: rX + 4, y: textY, size: 7.5, font: fontBold, color: rgb(0.06, 0.46, 0.43) });
      rX += colWidths.paid;

      // Sisa
      currentPage.drawText(item.remainingAmount.toLocaleString('id-ID'), { x: rX + 4, y: textY, size: 7.5, font: fontBold, color: item.remainingAmount > 0 ? rgb(0.75, 0.1, 0.1) : rgb(0.3, 0.3, 0.3) });
      rX += colWidths.remaining;

      // Status
      currentPage.drawText(item.paymentStatus, { x: rX + 4, y: textY, size: 7.5, font: fontBold, color: item.paymentStatus === 'LUNAS' ? rgb(0.06, 0.46, 0.43) : item.paymentStatus === 'SEBAGIAN' ? rgb(0.7, 0.4, 0) : rgb(0.6, 0.1, 0.1) });

      currentY -= rowHeight;
    });

    // Page Numbers
    const pageCount = pdfDoc.getPageCount();
    for (let i = 0; i < pageCount; i++) {
      const p = pdfDoc.getPage(i);
      p.drawText(`Halaman ${i + 1} dari ${pageCount} • Dicetak langsung dari APP MA'HAD`, {
        x: MARGIN,
        y: 18,
        size: 7.5,
        font: fontOblique,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Retrieves branding info for print-ready PDF reports.
   */
  async getTenantBranding(tenantId: string) {
    const tRows = await db
      .select({
        name: tenants.name,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const sRows = await db
      .select({
        tagline: tenantSettings.tagline,
        logoUrl: tenantSettings.customLogoUrl,
      })
      .from(tenantSettings)
      .where(eq(tenantSettings.tenantId, tenantId))
      .limit(1);

    return {
      name: tRows[0]?.name || 'Pondok Pesantren',
      tagline: sRows[0]?.tagline || 'Sistem Administrasi Keuangan Pesantren Terpadu',
      logoUrl: sRows[0]?.logoUrl || null,
    };
  }
}

export const recapExportService = new RecapExportService();
