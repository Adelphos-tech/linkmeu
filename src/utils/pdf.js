import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

export const generateA5Flyer = async (event, qrCodeDataURL) => {
  // A5 dimensions in mm: 148 x 210
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5'
  });

  const pageWidth = 148;
  const pageHeight = 210;
  const margin = 10;

  // Background
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Logo/Brand at top
  let currentY = 15;
  
  if (event.logo) {
    try {
      // Add event logo centered
      const logoSize = 25;
      const logoX = (pageWidth - logoSize) / 2;
      doc.addImage(event.logo, 'JPEG', logoX, currentY, logoSize, logoSize);
      currentY += logoSize + 5;
    } catch (e) {
      console.warn('Could not add logo to PDF:', e);
      // Fallback to text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('EX', pageWidth / 2, currentY + 10, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('EventsX', pageWidth / 2, currentY + 16, { align: 'center' });
      currentY += 20;
    }
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('EX', pageWidth / 2, currentY + 10, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('EventsX', pageWidth / 2, currentY + 16, { align: 'center' });
    currentY += 20;
  }

  // Event Banner Image
  if (event.image) {
    try {
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = 40;
      doc.addImage(event.image, 'JPEG', margin, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 5;
    } catch (e) {
      console.warn('Could not add event image to PDF:', e);
    }
  }

  // Event Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  const titleLines = doc.splitTextToSize(event.title || 'EVENT TITLE', pageWidth - 2 * margin);
  doc.text(titleLines, margin, currentY + 8);
  currentY += titleLines.length * 7 + 10;

  // Event Description
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  const descText = event.description || 'Event description here.';
  const maxDescLength = 300;
  const truncatedDesc = descText.length > maxDescLength ? descText.substring(0, maxDescLength) + '...' : descText;
  const descLines = doc.splitTextToSize(truncatedDesc, pageWidth - 2 * margin);
  const maxDescLines = Math.min(descLines.length, 8);
  doc.text(descLines.slice(0, maxDescLines), margin, currentY);
  currentY += maxDescLines * 4 + 5;

  // Venue
  doc.setTextColor(220, 38, 38);
  doc.setFontSize(9);
  doc.text('Venue', margin, currentY);
  doc.setTextColor(255, 255, 255);
  const venueLines = doc.splitTextToSize(event.venue || 'Venue', pageWidth - 2 * margin);
  doc.text(venueLines, margin, currentY + 5);
  currentY += venueLines.length * 4 + 8;

  // Date & Time
  doc.setTextColor(220, 38, 38);
  doc.text('Date & Time', margin, currentY);
  doc.setTextColor(255, 255, 255);
  let dateStr = 'Date';
  if (event.startDate && event.endDate) {
    if (event.startDate === event.endDate) {
      dateStr = format(new Date(event.startDate), 'PPP');
    } else {
      dateStr = `${format(new Date(event.startDate), 'PPP')} - ${format(new Date(event.endDate), 'PPP')}`;
    }
  } else if (event.startDate) {
    dateStr = format(new Date(event.startDate), 'PPP');
  } else if (event.date) {
    dateStr = format(new Date(event.date), 'PPP');
  }
  doc.text(dateStr, margin, currentY + 5);
  currentY += 12;

  // QR Code
  if (qrCodeDataURL) {
    const qrSize = 45;
    const qrX = (pageWidth - qrSize) / 2;
    const qrY = currentY + 5;
    
    // QR background
    doc.setFillColor(255, 255, 255);
    doc.rect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 'F');
    
    doc.addImage(qrCodeDataURL, 'PNG', qrX, qrY, qrSize, qrSize);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('SCAN TO REGISTER', pageWidth / 2, qrY + qrSize + 8, { align: 'center' });
  }

  // Organiser
  if (event.organisers && event.organisers.length > 0) {
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('Organiser:', margin, 165);
    const organiserText = event.organisers.map(o => o.name || o.detail).join(', ');
    const orgLines = doc.splitTextToSize(organiserText, pageWidth - 2 * margin);
    doc.text(orgLines, margin, 172);
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('Powered by Robocorp', pageWidth / 2, pageHeight - 5, { align: 'center' });

  return doc;
};

export const downloadPDF = (doc, filename) => {
  doc.save(filename);
};
