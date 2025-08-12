import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../assets/logo.png';

const useReportGenerator = () => {
  const [pdfDataUri, setPdfDataUri] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateReport = (reportId, params, dataSources) => {
    setIsLoading(true);
    setError(null);
    setPdfDataUri('');

    const { employees, positions } = dataSources;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageTitle = "HRMS Report";
    const generationDate = new Date().toLocaleDateString();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;

    const addHeader = (title) => {
      doc.addImage(logo, 'PNG', margin, 20, 80, 26);
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text(title, pageWidth - margin, 40, { align: 'right' });
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated on: ${generationDate}`, pageWidth - margin, 55, { align: 'right' });
      doc.setLineWidth(1);
      doc.line(margin, 70, pageWidth - margin, 70);
    };

    try {
      switch (reportId) {
        case 'employee_masterlist': {
          addHeader("Employee Masterlist");
          const positionMap = new Map(positions.map(p => [p.id, p.title]));
          const tableColumns = ['ID', 'Name', 'Position', 'Email', 'Joining Date'];
          const tableRows = employees.map(emp => [
            emp.id,
            emp.name,
            positionMap.get(emp.positionId) || 'Unassigned',
            emp.email,
            emp.joiningDate
          ]);
          autoTable(doc, {
            head: [tableColumns], body: tableRows, startY: 85, theme: 'striped', headStyles: { fillColor: [25, 135, 84] }
          });
          break;
        }

        case 'attendance_summary': {
          addHeader("Attendance Summary");
          doc.text("Attendance report logic would go here.", margin, 95);
          doc.text(`Parameters received: Start: ${params.startDate}, End: ${params.endDate}`, margin, 110);
          break;
        }

        default:
          throw new Error('Unknown report type requested.');
      }
      
      const pdfBlob = doc.output('blob');
      setPdfDataUri(URL.createObjectURL(pdfBlob));

    } catch (e) {
      console.error("Error generating report:", e);
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { generateReport, pdfDataUri, isLoading, error, setPdfDataUri };
};

export default useReportGenerator;