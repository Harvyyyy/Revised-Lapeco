import { formatCurrency } from '../utils/formatters';

export const generatePayrollRunSummaryReport = async (layoutManager, dataSources, params) => {
  const run = dataSources;
  const { runId } = params;
  const { doc, margin } = layoutManager;

  console.log("[DEBUG] payrollRunSummaryReport dataSources:", dataSources); // ADDED LOG

  if (!run || !run.records) { // Check if run or run.records is undefined
    doc.text("The selected payroll run could not be found or contains no records.", margin, layoutManager.y);
    return;
  }

  // --- 1. DATA PREPARATION ---
  const runTotals = run.records.reduce((acc, rec) => {
    // Prefer detailed fields; gracefully fallback when only minimal data is available
    const earningsFromItems = (rec.earnings || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const deductionsFromItems = Object.values(rec.deductions || {}).reduce((sum, val) => sum + (Number(val) || 0), 0) +
                                (rec.otherDeductions || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const gross = Number(rec.grossEarning ?? earningsFromItems ?? 0);
    // If we have explicit total deductions amount, prefer it; else use computed
    const deductions = Math.abs(Number(rec.totalDeductionsAmount ?? deductionsFromItems ?? 0));
    const net = Number(rec.netPay ?? (gross - deductions));

    acc.gross += gross;
    acc.deductions += deductions;
    acc.net += net;
    return acc;
  }, { gross: 0, deductions: 0, net: 0 });
  
  // --- Add custom header info before the main layout starts ---
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text(`Pay Period:`, margin, layoutManager.y);
  doc.setFont(undefined, 'normal');
  doc.text(run.cutOff, margin + 60, layoutManager.y);
  layoutManager.y += 15;
  
  doc.setFont(undefined, 'bold');
  doc.text(`Total Employees:`, margin, layoutManager.y);
  doc.setFont(undefined, 'normal');
  doc.text(run.records.length.toString(), margin + 90, layoutManager.y);
  layoutManager.y += 15;

  doc.setFont(undefined, 'bold');
  doc.text(`Total Payout:`, margin, layoutManager.y);
  doc.setFontSize(12);
  doc.setTextColor(25, 135, 84);
  doc.text(formatCurrency(runTotals.net), margin + 90, layoutManager.y);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  layoutManager.y += 20;
  
  // --- 2. CHART CONFIGURATION ---
  const chartConfig = {
    type: 'bar',
    data: {
      labels: ['Gross Pay', 'Deductions', 'Net Pay'],
      datasets: [{
        label: 'Amount (PHP)',
        data: [runTotals.gross, runTotals.deductions, runTotals.net],
        backgroundColor: ['rgba(13, 202, 240, 0.6)', 'rgba(220, 53, 69, 0.6)', 'rgba(25, 135, 84, 0.6)']
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { callback: value => `PHP ${(value / 1000)}k` } } }
    }
  };
  
  // --- 3. SUMMARY TEXT ---
  const summaryText = `This report summarizes the payroll run for the period ${run.cutOff}. The total gross pay for ${run.records.length} employees was ${formatCurrency(runTotals.gross)}, with total deductions amounting to ${formatCurrency(runTotals.deductions)}. This resulted in a total net payout of ${formatCurrency(runTotals.net)}.`;
  
  // --- 4. TABLE DATA ---
  const tableHead = ['ID', 'Employee Name', 'Gross Pay', 'Deductions', 'Net Pay', 'Status'];
  const tableBody = run.records.map(rec => {
    const earningsFromItems = (rec.earnings || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const deductionsFromItems = Object.values(rec.deductions || {}).reduce((s, v) => s + (Number(v) || 0), 0) +
                                (rec.otherDeductions || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const gross = Number(rec.grossEarning ?? earningsFromItems ?? 0);
    const deductions = Math.abs(Number(rec.totalDeductionsAmount ?? deductionsFromItems ?? 0));
    const netPay = Number(rec.netPay ?? (gross - deductions));
    return [rec.empId, rec.employeeName, formatCurrency(gross), formatCurrency(deductions), formatCurrency(netPay), rec.status];
  });

  // --- 5. PDF ASSEMBLY ---
  await layoutManager.addChartWithTitle("Financial Overview", chartConfig, { height: 200 });
  layoutManager.addSummaryText(summaryText);
  layoutManager.addSectionTitle("Payout Details");
  layoutManager.addTable([tableHead], tableBody, {
    columnStyles: {
      2: { halign: 'left' },
      3: { halign: 'left' },
      4: { halign: 'left' }
    }
  });
};