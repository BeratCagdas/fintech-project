import React from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./PDFExport.css";

const PDFExport = ({ userData }) => {
  const generatePDF = () => {
    if (!userData) return alert("Kullanıcı verisi bulunamadı.");

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      putOnlyUsedFonts: true,
      floatPrecision: 16,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // 🎨 Renk paleti (minimalist)
    const colors = {
      primary: [78, 154, 241],
      secondary: [148, 163, 184],
      success: [16, 185, 129],
      danger: [239, 68, 68],
      dark: [26, 26, 46],
      bgLight: [248, 250, 252],
    };

    // ====================
    // HEADER
    // ====================
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("💰 Finans Raporu", 15, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Oluşturulma: ${new Date().toLocaleDateString("tr-TR")}`,
      15,
      30
    );

    yPosition = 50;

    // ====================
    // KULLANICI BİLGİLERİ
    // ====================
    doc.setTextColor(...colors.dark);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("👤 Kullanıcı Bilgileri", 15, yPosition);
    yPosition += 10;

    doc.autoTable({
      startY: yPosition,
      head: [["Bilgi", "Değer"]],
      body: [
        ["Ad Soyad", userData.name || "-"],
        ["Email", userData.email || "-"],
        ["Risk Profili", getRiskProfileText(userData.riskProfile)],
        ["Yatırım Vadesi", getInvestmentTypeText(userData.investmentType)],
        [
          "Üyelik Tarihi",
          userData.createdAt
            ? new Date(userData.createdAt).toLocaleDateString("tr-TR")
            : "-",
        ],
      ],
      theme: "striped",
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 5,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: colors.bgLight },
      margin: { left: 15, right: 15 },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // ====================
    // FİNANSAL ÖZET
    // ====================
    const finance = userData.finance || {};
    const totalFixed = (finance.fixedExpenses || []).reduce(
      (sum, exp) => sum + Number(exp.amount || 0),
      0
    );
    const totalVariable = (finance.variableExpenses || []).reduce(
      (sum, exp) => sum + Number(exp.amount || 0),
      0
    );
    const totalExpenses = totalFixed + totalVariable;
    const net = (finance.monthlyIncome || 0) - totalExpenses;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("💵 Finansal Özet", 15, yPosition);
    yPosition += 10;

    doc.autoTable({
      startY: yPosition,
      head: [["Kategori", "Tutar (₺)"]],
      body: [
        ["Aylık Gelir", formatCurrency(finance.monthlyIncome || 0)],
        ["Sabit Giderler", formatCurrency(totalFixed)],
        ["Değişken Giderler", formatCurrency(totalVariable)],
        ["Toplam Gider", formatCurrency(totalExpenses)],
        ["Net Kalan", formatCurrency(net)],
      ],
      theme: "striped",
      styles: { font: "helvetica", fontSize: 10, cellPadding: 5 },
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: "bold",
      },
      columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
      alternateRowStyles: { fillColor: colors.bgLight },
      margin: { left: 15, right: 15 },
      didParseCell: (data) => {
        if (data.row.index === 4 && data.column.index === 1) {
          data.cell.styles.textColor =
            net >= 0 ? colors.success : colors.danger;
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // ====================
    // SABİT / DEĞİŞKEN GİDERLER
    // ====================
    const renderExpenseTable = (title, data, head, color) => {
      if (!data?.length) return;

      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(title, 15, yPosition);
      yPosition += 10;

      doc.autoTable({
        startY: yPosition,
        head: [head],
        body: data,
        theme: "striped",
        styles: { font: "helvetica", fontSize: 9, cellPadding: 4 },
        headStyles: {
          fillColor: color,
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: colors.bgLight },
        margin: { left: 15, right: 15 },
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    };

    renderExpenseTable(
      "📌 Sabit Giderler",
      (finance.fixedExpenses || []).map((e) => [
        e.name,
        getCategoryText(e.category),
        formatCurrency(e.amount),
        e.isRecurring ? getFrequencyText(e.frequency) : "Tek Seferlik",
      ]),
      ["Gider Adı", "Kategori", "Tutar (₺)", "Tekrar"],
      [78, 154, 241]
    );

    renderExpenseTable(
      "🛒 Değişken Giderler",
      (finance.variableExpenses || []).map((e) => [
        e.name,
        formatCurrency(e.amount),
      ]),
      ["Gider Adı", "Tutar (₺)"],
      [168, 85, 247]
    );

    // ====================
    // TASARRUF HEDEFLERİ
    // ====================
    renderExpenseTable(
      "🎯 Tasarruf Hedefleri",
      (finance.goals || []).map((g) => [
        g.title,
        formatCurrency(g.targetAmount),
        formatCurrency(g.currentAmount),
        `%${((g.currentAmount / g.targetAmount) * 100).toFixed(0)}`,
        g.deadline
          ? new Date(g.deadline).toLocaleDateString("tr-TR")
          : "-",
      ]),
      ["Hedef", "Hedef Tutar", "Mevcut", "İlerleme", "Son Tarih"],
      [245, 158, 11]
    );

    // ====================
    // AYLIK GEÇMİŞ
    // ====================
    if (userData.monthlyHistory?.length) {
      doc.addPage();
      yPosition = 20;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("📊 Aylık Geçmiş (Son 6 Ay)", 15, yPosition);
      yPosition += 10;

      doc.autoTable({
        startY: yPosition,
        head: [["Ay", "Gelir (₺)", "Gider (₺)", "Tasarruf (₺)"]],
        body: userData.monthlyHistory.slice(-6).map((m) => [
          m.monthName || m.month,
          formatCurrency(m.income),
          formatCurrency(m.totalExpenses),
          formatCurrency(m.savings),
        ]),
        theme: "striped",
        styles: { font: "helvetica", fontSize: 9, cellPadding: 4 },
        headStyles: {
          fillColor: colors.primary,
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: colors.bgLight },
        columnStyles: {
          1: { halign: "right" },
          2: { halign: "right" },
          3: { halign: "right", fontStyle: "bold" },
        },
        margin: { left: 15, right: 15 },
      });
    }

    // ====================
    // FOOTER
    // ====================
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...colors.secondary);
      doc.text(`Sayfa ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 10, {
        align: "center",
      });
      doc.text(
        "Bu rapor AI destekli Finans Yönetim Sistemi tarafından oluşturulmuştur.",
        pageWidth / 2,
        pageHeight - 5,
        { align: "center" }
      );
    }

    // ✅ Dosya adı güvenli hale getirildi
    const safeName = (userData.name || "kullanici")
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-]/g, "")
      .toLowerCase();

    doc.save(`finans-raporu-${safeName}-${Date.now()}.pdf`);
  };

  // ---------------------
  // Helper functions
  // ---------------------
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);

  const getRiskProfileText = (r) =>
    ({ low: "Düşük Risk", medium: "Orta Risk", high: "Yüksek Risk" }[r] || "-");

  const getInvestmentTypeText = (t) =>
    ({
      kısa: "Kısa Vadeli (3-6 ay)",
      orta: "Orta Vadeli (6-12 ay)",
      uzun: "Uzun Vadeli (1-3 yıl)",
    }[t] || t);

  const getCategoryText = (c) =>
    ({
      kira: "🏠 Kira",
      faturalar: "💡 Faturalar",
      abonelik: "📺 Abonelik",
      kredi: "💳 Kredi",
      sigorta: "🛡️ Sigorta",
      egitim: "📚 Eğitim",
      diger: "📂 Diğer",
    }[c] || c);

  const getFrequencyText = (f) =>
    ({
      daily: "Günlük",
      weekly: "Haftalık",
      monthly: "Aylık",
      yearly: "Yıllık",
    }[f] || f);

  return (
    <button className="pdf-export-btn" onClick={generatePDF}>
      <span className="pdf-icon">📄</span>
      PDF İndir
    </button>
  );
};

export default PDFExport;
