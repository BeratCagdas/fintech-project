import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './PDFExport.css';

const PDFExport = ({ userData }) => {
  
  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      floatPrecision: 16
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Renkler (Modern ama aşırı renkli değil)
    const primaryColor = [78, 154, 241]; // Mavi
    const secondaryColor = [148, 163, 184]; // Gri
    const successColor = [16, 185, 129]; // Yeşil
    const dangerColor = [239, 68, 68]; // Kırmızı
    const darkColor = [26, 26, 46]; // Koyu

    // ====================
    // HEADER
    // ====================
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('💰 Finans Raporu', 15, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Oluşturulma: ${new Date().toLocaleDateString('tr-TR')}`, 15, 30);
    
    yPosition = 50;

    // ====================
    // KULLANICI BİLGİLERİ
    // ====================
    doc.setTextColor(...darkColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('👤 Kullanıcı Bilgileri', 15, yPosition);
    yPosition += 10;

    doc.autoTable({
      startY: yPosition,
      head: [['Bilgi', 'Değer']],
      body: [
        ['Ad Soyad', userData.name || '-'],
        ['Email', userData.email || '-'],
        ['Risk Profili', getRiskProfileText(userData.riskProfile)],
        ['Yatırım Vadesi', getInvestmentTypeText(userData.investmentType)],
        ['Üyelik Tarihi', new Date(userData.createdAt).toLocaleDateString('tr-TR')]
      ],
      theme: 'striped',
      styles: {
        font: 'helvetica',
        fontStyle: 'normal',
        fontSize: 10,
        cellPadding: 5,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: { 
        textColor: darkColor,
        fontSize: 10
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 15, right: 15 }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // ====================
    // FİNANSAL ÖZET
    // ====================
    const finance = userData.finance || {};
    const totalFixed = (finance.fixedExpenses || []).reduce((sum, exp) => sum + exp.amount, 0);
    const totalVariable = (finance.variableExpenses || []).reduce((sum, exp) => sum + exp.amount, 0);
    const totalExpenses = totalFixed + totalVariable;
    const net = (finance.monthlyIncome || 0) - totalExpenses;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('💵 Finansal Özet', 15, yPosition);
    yPosition += 10;

    doc.autoTable({
      startY: yPosition,
      head: [['Kategori', 'Tutar (₺)']],
      body: [
        ['Aylık Gelir', formatCurrency(finance.monthlyIncome || 0)],
        ['Sabit Giderler', formatCurrency(totalFixed)],
        ['Değişken Giderler', formatCurrency(totalVariable)],
        ['Toplam Gider', formatCurrency(totalExpenses)],
        ['Net Kalan', formatCurrency(net)]
      ],
      theme: 'striped',
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 5
      },
      headStyles: { 
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: { 
        textColor: darkColor,
        fontSize: 10
      },
      columnStyles: {
        1: { halign: 'right', fontStyle: 'bold' }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 15, right: 15 },
      didParseCell: function(data) {
        if (data.row.index === 4 && data.column.index === 1) {
          data.cell.styles.textColor = net >= 0 ? successColor : dangerColor;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // ====================
    // SABİT GİDERLER
    // ====================
    if (finance.fixedExpenses && finance.fixedExpenses.length > 0) {
      // Yeni sayfa gerekirse ekle
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('📌 Sabit Giderler', 15, yPosition);
      yPosition += 10;

      const fixedExpensesData = finance.fixedExpenses.map(exp => [
        exp.name,
        getCategoryText(exp.category),
        formatCurrency(exp.amount),
        exp.isRecurring ? getFrequencyText(exp.frequency) : 'Tek Seferlik'
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Gider Adı', 'Kategori', 'Tutar (₺)', 'Tekrar']],
        body: fixedExpensesData,
        theme: 'striped',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 4
        },
        headStyles: { 
          fillColor: [78, 154, 241],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: { 
          textColor: darkColor,
          fontSize: 9
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 15, right: 15 },
        columnStyles: {
          2: { halign: 'right', fontStyle: 'bold' }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // ====================
    // DEĞİŞKEN GİDERLER
    // ====================
    if (finance.variableExpenses && finance.variableExpenses.length > 0) {
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('🛒 Değişken Giderler', 15, yPosition);
      yPosition += 10;

      const variableExpensesData = finance.variableExpenses.map(exp => [
        exp.name,
        formatCurrency(exp.amount)
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Gider Adı', 'Tutar (₺)']],
        body: variableExpensesData,
        theme: 'striped',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 4
        },
        headStyles: { 
          fillColor: [168, 85, 247],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: { 
          textColor: darkColor,
          fontSize: 9
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 15, right: 15 },
        columnStyles: {
          1: { halign: 'right', fontStyle: 'bold' }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // ====================
    // HEDEFLER (Varsa)
    // ====================
    if (finance.goals && finance.goals.length > 0) {
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('🎯 Tasarruf Hedefleri', 15, yPosition);
      yPosition += 10;

      const goalsData = finance.goals.map(goal => {
        const progress = ((goal.currentAmount / goal.targetAmount) * 100).toFixed(0);
        return [
          goal.title,
          formatCurrency(goal.targetAmount),
          formatCurrency(goal.currentAmount),
          `%${progress}`,
          goal.deadline ? new Date(goal.deadline).toLocaleDateString('tr-TR') : '-'
        ];
      });

      doc.autoTable({
        startY: yPosition,
        head: [['Hedef', 'Hedef Tutar', 'Mevcut', 'İlerleme', 'Son Tarih']],
        body: goalsData,
        theme: 'striped',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 4
        },
        headStyles: { 
          fillColor: [245, 158, 11],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: { 
          textColor: darkColor,
          fontSize: 9
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 15, right: 15 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // ====================
    // AYLIK GEÇMİŞ (Son 6 ay)
    // ====================
    if (userData.monthlyHistory && userData.monthlyHistory.length > 0) {
      doc.addPage();
      yPosition = 20;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('📊 Aylık Geçmiş (Son 6 Ay)', 15, yPosition);
      yPosition += 10;

      const historyData = userData.monthlyHistory
        .slice(-6)
        .map(month => [
          month.monthName || month.month,
          formatCurrency(month.income),
          formatCurrency(month.totalExpenses),
          formatCurrency(month.savings)
        ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Ay', 'Gelir (₺)', 'Gider (₺)', 'Tasarruf (₺)']],
        body: historyData,
        theme: 'striped',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 4
        },
        headStyles: { 
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: { 
          textColor: darkColor,
          fontSize: 9
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 15, right: 15 },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right', fontStyle: 'bold' }
        }
      });
    }

    // ====================
    // FOOTER (Her sayfaya)
    // ====================
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...secondaryColor);
      doc.text(
        `Sayfa ${i} / ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text(
        'Bu rapor otomatik olarak oluşturulmuştur.',
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
    }

    // PDF'i indir
    const fileName = `finans-raporu-${userData.name.replace(/\s/g, '-')}-${new Date().getTime()}.pdf`;
    doc.save(fileName);
  };

  // Helper Functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const getRiskProfileText = (profile) => {
    const profiles = {
      low: 'Düşük Risk',
      medium: 'Orta Risk',
      high: 'Yüksek Risk'
    };
    return profiles[profile] || '-';
  };

  const getInvestmentTypeText = (type) => {
    const types = {
      'kısa': 'Kısa Vadeli (3-6 ay)',
      'orta': 'Orta Vadeli (6-12 ay)',
      'uzun': 'Uzun Vadeli (1-3 yıl)'
    };
    return types[type] || type;
  };

  const getCategoryText = (category) => {
    const categories = {
      kira: '🏠 Kira',
      faturalar: '💡 Faturalar',
      abonelik: '📺 Abonelik',
      kredi: '💳 Kredi',
      sigorta: '🛡️ Sigorta',
      egitim: '📚 Eğitim',
      diger: '📂 Diğer'
    };
    return categories[category] || category;
  };

  const getFrequencyText = (frequency) => {
    const frequencies = {
      daily: 'Günlük',
      weekly: 'Haftalık',
      monthly: 'Aylık',
      yearly: 'Yıllık'
    };
    return frequencies[frequency] || frequency;
  };

  return (
    <button className="pdf-export-btn" onClick={generatePDF}>
      <span className="pdf-icon">📄</span>
      PDF İndir
    </button>
  );
};

export default PDFExport;