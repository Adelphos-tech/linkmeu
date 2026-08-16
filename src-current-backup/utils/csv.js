export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const prepareAttendeeData = (attendees, includeAttended = false) => {
  return attendees.map(a => ({
    Name: a.name,
    Email: a.email,
    Contact: a.contact || '',
    Notes: a.notes || '',
    Attended: includeAttended ? (a.attended ? 'Yes' : 'No') : 'Registered',
    'Registration Date': new Date(a.registeredAt).toLocaleString()
  }));
};
