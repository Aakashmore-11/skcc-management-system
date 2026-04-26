import { useState, useEffect } from 'react';
import axios from 'axios';
import { IndianRupee, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const [fees, setFees] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      const res = await axios.get('/api/fees');
      const data = res.data;
      setFees(data);
      processFinancials(data);
    } catch (error) {
      console.error(error);
    }
  };

  const processFinancials = (data) => {
    const monthlyMap = {};
    const yearlyMap = {};

    data.forEach(fee => {
      const date = new Date(fee.paymentDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const yearKey = `${date.getFullYear()}`;

      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = 0;
      if (!yearlyMap[yearKey]) yearlyMap[yearKey] = 0;

      monthlyMap[monthKey] += fee.amountPaid;
      yearlyMap[yearKey] += fee.amountPaid;
    });

    const monthlyArray = Object.entries(monthlyMap).map(([period, amount]) => {
      const [y, m] = period.split('-');
      const dateStr = new Date(y, m - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return { period: dateStr, rawPeriod: period, amount };
    }).sort((a, b) => b.rawPeriod.localeCompare(a.rawPeriod));

    const yearlyArray = Object.entries(yearlyMap).map(([period, amount]) => {
      return { period, amount };
    }).sort((a, b) => b.period.localeCompare(a.period));

    setMonthlyData(monthlyArray);
    setYearlyData(yearlyArray);
  };

  const exportPDF = (title, columns, dataRows, filename) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(79, 124, 255);
    doc.text('SKCC MANAGEMENT', 14, 20);
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(title, 14, 30);
    
    autoTable(doc, {
      startY: 40,
      head: [columns],
      body: dataRows,
      theme: 'grid',
      headStyles: { fillColor: [24, 28, 38], textColor: 255 },
      styles: { fontSize: 10 }
    });

    doc.save(filename);
  };

  return (
    <>
      <div className="mb-6">
        <div className="card-title text-[18px]">Financial Reports</div>
        <div className="card-subtitle">Aggregate revenue analytics and document exports.</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Monthly Report */}
        <div className="table-card">
          <div className="table-header flex justify-between items-center">
            <div className="flex items-center gap-2">
              <IndianRupee size={16} color="var(--accent)" />
              <span className="card-title">Monthly Revenue</span>
            </div>
            <button 
              className="btn btn-primary px-3 py-1.5 text-xs" 
              onClick={() => exportPDF(
                'Monthly Financial Report', 
                ['Month', 'Total Revenue Collected'], 
                monthlyData.map(d => [d.period, `INR ${d.amount.toLocaleString()}`]),
                'Monthly_Report.pdf'
              )}
            >
              <Download size={14} /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
          <table className="data-table min-w-[300px]">
            <thead>
              <tr>
                <th>Month</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map(d => (
                <tr key={d.period}>
                  <td style={{ fontWeight: 500 }}>{d.period}</td>
                  <td><span className="badge badge-green">₹{d.amount.toLocaleString()}</span></td>
                </tr>
              ))}
              {monthlyData.length === 0 && (
                <tr><td colSpan="2" className="text-center p-5 text-text3">No data available</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Yearly Report */}
        <div className="table-card self-start">
          <div className="table-header flex justify-between items-center">
            <div className="flex items-center gap-2">
              <IndianRupee size={16} color="var(--amber)" />
              <span className="card-title">Yearly Revenue</span>
            </div>
            <button 
              className="btn btn-primary px-3 py-1.5 text-xs" 
              onClick={() => exportPDF(
                'Yearly Financial Report', 
                ['Financial Year', 'Total Revenue Collected'], 
                yearlyData.map(d => [d.period, `INR ${d.amount.toLocaleString()}`]),
                'Yearly_Report.pdf'
              )}
            >
              <Download size={14} /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
          <table className="data-table min-w-[300px]">
            <thead>
              <tr>
                <th>Year</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {yearlyData.map(d => (
                <tr key={d.period}>
                  <td style={{ fontWeight: 500 }}>{d.period}</td>
                  <td><span className="badge badge-amber" style={{ background: 'rgba(245,166,35,0.1)' }}>₹{d.amount.toLocaleString()}</span></td>
                </tr>
              ))}
              {yearlyData.length === 0 && (
                <tr><td colSpan="2" className="text-center p-5 text-text3">No data available</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

      </div>
    </>
  );
}
