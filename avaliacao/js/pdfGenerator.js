// pdfGenerator.js - usa jsPDF se disponível globalmente
const PDFGenerator = {
  generatePDFFromHtml(htmlContent) {
    // tenta usar jsPDF (incluir script em index se quiser)
    if (window.jspdf && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
      const margin = 40;
      const maxWidth = 520;
      pdf.setFontSize(12);
      const text = htmlContent.replace(/<[^>]+>/g, '\n').replace(/\n{2,}/g, '\n\n').trim();
      const lines = pdf.splitTextToSize(text, maxWidth);
      let y = 40;
      lines.forEach(line => {
        if (y > 800) { pdf.addPage(); y = 40; }
        pdf.text(line, margin, y);
        y += 14;
      });
      pdf.save(`treino_${Date.now()}.pdf`);
      return;
    }
    // fallback: abrir print
    const w = window.open('', '_blank');
    w.document.write(htmlContent);
    w.document.close();
    w.print();
  }
};

export default PDFGenerator;
