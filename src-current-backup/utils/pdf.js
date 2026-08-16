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
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('EX', margin, 20);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('EventsX', margin, 26);

  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('Powered by Robocorp', margin, 31);

  // Event Title
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  const titleLines = doc.splitTextToSize(event.title || 'EVENT TITLE', pageWidth - 2 * margin);
  doc.text(titleLines, margin, 40);

  // Event Description
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const descLines = doc.splitTextToSize(event.description || 'Event description here.', pageWidth - 2 * margin);
  doc.text(descLines, margin, 55);

  // Venue
  doc.setTextColor(220, 38, 38);
  doc.setFontSize(9);
  doc.text('📍 Venue', margin, 75);
  doc.setTextColor(255, 255, 255);
  doc.text(event.venue || 'Venue', margin + 20, 75);

  // Date & Time
  doc.setTextColor(220, 38, 38);
  doc.text('📅 Date & Time', margin, 82);
  doc.setTextColor(255, 255, 255);
  const dateStr = event.date ? format(new Date(event.date), 'PPP') : 'Date';
  doc.text(dateStr, margin + 20, 82);

  // QR Code
  if (qrCodeDataURL) {
    const qrSize = 50;
    const qrX = (pageWidth - qrSize) / 2;
    const qrY = 95;
    
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
