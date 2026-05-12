import jsPDF from 'jspdf'
import { toCanvas } from 'html-to-image'

export async function exportBookToPDF(bookTitle: string, elementId = 'book-pdf-export-content') {
  const element = document.getElementById(elementId)
  if (!element) return

  // Wait for any animations or rendering to settle
  await new Promise((resolve) => window.setTimeout(resolve, 500))

  try {
    const canvas = await toCanvas(element, {
      backgroundColor: '#ffffff',
      cacheBust: true,
      skipFonts: false,
      pixelRatio: 2,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
    })

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save(`${bookTitle.replace(/\s+/g, '_')}.pdf`)
  } catch (error) {
    console.error('Failed to export PDF:', error)
    // Fallback or user notification could go here
  }
}
