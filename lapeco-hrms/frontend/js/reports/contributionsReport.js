import { generateSssData, generatePhilhealthData, generatePagibigData, generateTinData } from '../hooks/contributionUtils';
import { formatCurrency } from '../utils/formatters';

const addContributionSection = (layoutManager, title, data) => {
  layoutManager.addSectionTitle(title, { fontSize: 14, spaceBefore: 15, spaceAfter: 10 });

  const tableHead = data.columns.map(c => c.label);
  
  const tableBody = data.rows.map(row => {
    return data.columns.map(col => {
      const value = row[col.key];
      if (['employeeContribution', 'employerContribution', 'totalContribution'].includes(col.key)) {
        return formatCurrency(value);
      }
      return value;
    });
  });

  layoutManager.addTable([tableHead], tableBody, {
    columnStyles: {
      5: { halign: 'right' }, // EE Share
      6: { halign: 'right' }, // ER Share
      7: { halign: 'right' }, // Total
    }
  });
};

const addTinSection = (layoutManager, title, data) => {
    layoutManager.addSectionTitle(title, { fontSize: 14, spaceBefore: 15, spaceAfter: 10 });

    const tableHead = data.columns.map(c => c.label);
    const tableBody = data.rows.map(row => {
        return data.columns.map(col => {
            const value = row[col.key];
            if (['grossCompensation', 'taxableCompensation', 'taxWithheld'].includes(col.key)) {
                return formatCurrency(value);
            }
            return value;
        });
    });

    layoutManager.addTable([tableHead], tableBody, {
        columnStyles: {
            5: { halign: 'right' },
            6: { halign: 'right' },
            7: { halign: 'right' },
        }
    });
};

export const generateContributionsReport = async (layoutManager, dataSources, params) => {
  const { employees, positions, payrolls } = dataSources;
  const { runId } = params;
  const { doc, margin } = layoutManager;

  const selectedRun = payrolls.find(p => p.runId === runId);
  if (!selectedRun) {
    doc.text("The selected payroll run could not be found.", margin, layoutManager.y);
    return;
  }

  // --- 1. DATA PREPARATION ---
  const sssData = generateSssData(employees, positions, selectedRun);
  const philhealthData = generatePhilhealthData(employees, positions, selectedRun);
  const pagibigData = generatePagibigData(employees, positions, selectedRun);
  const tinData = generateTinData(employees, positions, selectedRun);

  const calculateTotal = (data, key = 'totalContribution') => data.rows.reduce((sum, row) => sum + (row[key] || 0), 0);
  const sssTotal = calculateTotal(sssData);
  const philhealthTotal = calculateTotal(philhealthData);
  const pagibigTotal = calculateTotal(pagibigData);
  const tinTotal = calculateTotal(tinData, 'taxWithheld');
  const grandTotal = sssTotal + philhealthTotal + pagibigTotal; // Grand total excluding tax

  // --- 2. CHART CONFIGURATION ---
  const chartConfig = {
    type: 'bar',
    data: {
      labels: ['SSS', 'PhilHealth', 'Pag-IBIG', 'Withholding Tax'],
      datasets: [{
        label: 'Total Amount (PHP)',
        data: [sssTotal, philhealthTotal, pagibigTotal, tinTotal],
        backgroundColor: [
          'rgba(13, 110, 253, 0.6)',
          'rgba(220, 53, 69, 0.6)',
          'rgba(25, 135, 84, 0.6)',
          'rgba(111, 66, 193, 0.6)',
        ],
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: value => `PHP ${(value / 1000)}k` }
        }
      }
    }
  };
  
  // --- 3. SUMMARY TEXT ---
  const summaryText = `For the pay period ${selectedRun.cutOff}, the total mandatory contribution amounts to ${formatCurrency(grandTotal)}, and total withholding tax is ${formatCurrency(tinTotal)}. Detailed breakdowns for each type are provided below.`;

  // --- 4. PDF ASSEMBLY ---
  await layoutManager.addChartWithTitle("Total Contributions & Taxes Overview", chartConfig, { height: 180 });
  layoutManager.addSummaryText(summaryText);
  
  addContributionSection(layoutManager, 'SSS Contributions', sssData);
  addContributionSection(layoutManager, 'PhilHealth Contributions', philhealthData);
  addContributionSection(layoutManager, 'Pag-IBIG Contributions', pagibigData);
  addTinSection(layoutManager, 'Withholding Tax (TIN)', tinData);
};