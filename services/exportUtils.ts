import { AnalysisResult, Flashcard, TestResult } from "../types";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const downloadTextFile = (filename: string, content: string) => {
  const element = document.createElement('a');
  const file = new Blob([content], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export const exportToPng = (svgString: string, filename: string) => {
  const base64SVG = window.btoa(unescape(encodeURIComponent(svgString)));
  const imgSrc = `data:image/svg+xml;base64,${base64SVG}`;

  const img = new Image();
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      const scale = 2;
      const width = img.width;
      const height = img.height;
      
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Fill background
      ctx.fillStyle = "#0b0c15";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (e) {
      console.error("Export failed", e);
      alert("Could not export image due to browser security restrictions.");
    }
  };
  img.src = imgSrc;
};

export const exportToPdf = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    alert("Element not found for PDF export");
    return;
  }

  try {
    // scale: 4 provides approximately 4K resolution quality for A4
    const canvas = await html2canvas(element, {
      scale: 4, 
      useCORS: true,
      backgroundColor: '#fdfbf7',
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("Failed to generate PDF.");
  }
};

export const exportFlashcardsToPdf = (flashcards: Flashcard[], filename: string) => {
  const pdf = new jsPDF();
  let y = 20;

  pdf.setFontSize(22);
  pdf.setTextColor(44, 62, 80); // Ink Blue
  pdf.text("GyanAstr Flashcards", 105, y, { align: 'center' });
  y += 20;

  flashcards.forEach((card, index) => {
    if (y > 250) {
      pdf.addPage();
      y = 20;
    }

    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(250, 250, 250);
    pdf.roundedRect(15, y, 180, 50, 3, 3, 'FD');

    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Card ${index + 1}`, 20, y + 10);

    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    const questionLines = pdf.splitTextToSize(`Q: ${card.question}`, 170);
    pdf.text(questionLines, 20, y + 20);

    // Calculate offset based on question length
    const qHeight = questionLines.length * 7;
    
    pdf.setFontSize(12);
    pdf.setTextColor(0, 100, 0); // Greenish for answer
    const answerLines = pdf.splitTextToSize(`A: ${card.answer}`, 170);
    pdf.text(answerLines, 20, y + 20 + qHeight);

    y += 60;
  });

  pdf.save(filename);
};

export const exportTestReportToPdf = (result: TestResult, filename: string) => {
  const pdf = new jsPDF();
  let y = 20;

  // Header
  pdf.setFontSize(22);
  pdf.setTextColor(0, 242, 255); // Cyan like (mapped to closest RGB printable) or just Blue
  pdf.setTextColor(44, 62, 80); 
  pdf.text("GyanAstr Test Report", 105, y, { align: 'center' });
  y += 20;

  // Score Summary
  pdf.setFontSize(16);
  pdf.text(`Score: ${result.scorePercentage.toFixed(1)}%`, 20, y);
  y += 10;
  pdf.setFontSize(12);
  pdf.text(`Correct: ${result.correct} / ${result.totalQuestions}`, 20, y);
  y += 6;
  pdf.text(`Attempted: ${result.attempted}`, 20, y);
  y += 15;

  // Questions
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.line(20, y, 190, y);
  y += 10;

  result.questions.forEach((q, i) => {
    const userAnswerIdx = result.userAnswers[q.id];
    const isCorrect = userAnswerIdx === q.correctAnswerIndex;
    const isSkipped = userAnswerIdx === undefined;

    if (y > 270) {
      pdf.addPage();
      y = 20;
    }

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    const qLines = pdf.splitTextToSize(`${i + 1}. ${q.question}`, 170);
    pdf.text(qLines, 20, y);
    y += (qLines.length * 6) + 4;

    // Options
    q.options.forEach((opt, optIdx) => {
        let prefix = "   ";
        let color = [100, 100, 100]; // Default gray

        if (optIdx === q.correctAnswerIndex) {
            prefix = "✓ "; // Correct answer marked
            color = [0, 150, 0]; // Green
        } else if (optIdx === userAnswerIdx && !isCorrect) {
            prefix = "✗ "; // Wrong user choice
            color = [200, 0, 0]; // Red
        } else if (optIdx === userAnswerIdx && isCorrect) {
            // User chose correct
            color = [0, 150, 0];
        }

        pdf.setTextColor(color[0], color[1], color[2]);
        const optText = `${prefix}${String.fromCharCode(65 + optIdx)}. ${opt}`;
        const optLines = pdf.splitTextToSize(optText, 160);
        pdf.text(optLines, 25, y);
        y += (optLines.length * 5);
    });
    
    y += 8;
  });

  pdf.save(filename);
};

// Helper to remove markdown syntax like **bold** or *italic*
const cleanMarkdown = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold **
    .replace(/\*(.*?)\*/g, '$1')     // Remove italic *
    .replace(/__(.*?)__/g, '$1')     // Remove bold __
    .replace(/_(.*?)_/g, '$1')       // Remove italic _
    .replace(/`([^`]+)`/g, '$1')     // Remove code `
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1'); // Remove links [text](url) -> text
};

export const exportToWord = (alchemyData: any, filename: string) => {
  const header = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>GyanAstr Notes</title></head><body>`;
  
  const footer = "</body></html>";
  
  const content = `
    <h1 style="color: #2e74b5; font-size: 24pt;">GyanAstr Study Notes</h1>
    <h2 style="color: #1f4e79;">Core Topics / Solution Steps</h2>
    <ul>
      ${alchemyData.summaryPoints.map((p: string) => `<li>${cleanMarkdown(p)}</li>`).join('')}
    </ul>
    <h2 style="color: #c00000;">Exam Alerts / Final Answers</h2>
    <ul>
       ${alchemyData.examAlerts.map((a: string) => `<li>${cleanMarkdown(a)}</li>`).join('')}
    </ul>
    <h2 style="color: #548235;">Real-World Connection</h2>
    <p><i>${cleanMarkdown(alchemyData.realWorldConnection)}</i></p>
  `;

  const sourceHTML = header + content + footer;
  const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
  
  const fileDownload = document.createElement("a");
  document.body.appendChild(fileDownload);
  fileDownload.href = source;
  fileDownload.download = filename;
  fileDownload.click();
  document.body.removeChild(fileDownload);
};

export const generateMarkdown = (data: AnalysisResult): string => {
  const { alchemy, mermaidCode, flashcards, vivaQuestion } = data;
  
  return `# GyanAstr Study Notes

## 📝 Lecture Alchemy: Core Topics
${alchemy.summaryPoints.map(p => `- ${p}`).join('\n')}

### 🚨 Exam Alerts
${alchemy.examAlerts.map(a => `- ${a}`).join('\n')}

### 🌍 Real-World Connection
> ${alchemy.realWorldConnection}

## 🧠 Mind Map (Mermaid)
\`\`\`mermaid
${mermaidCode}
\`\`\`

## ⚡ Flashcards
${flashcards.map((f, i) => `### Q${i+1}: ${f.question}\n**Answer:** ${f.answer}`).join('\n\n')}

## 👮 Viva Prep
**Question:** ${vivaQuestion}
`;
};