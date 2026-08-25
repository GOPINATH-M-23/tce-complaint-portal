/**
 * Advanced Complaint CSV Export Utility
 */

export const parseFirestoreTimestamp = (ts) => {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
};

export const formatDateTime = (ts) => {
  const d = parseFirestoreTimestamp(ts);
  if (!d) return '—';

  const day = d.getDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const strTime = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;

  return `${day} ${month} ${year} · ${strTime}`;
};

export const filterComplaintsForExport = (complaints = [], filters = {}) => {
  const {
    dateRange = 'All Time',
    customFrom = '',
    customTo = '',
    status = 'All',
    priority = 'All',
    category = 'All',
  } = filters;

  const now = new Date();

  return complaints.filter((c) => {
    // 1. Status Filter
    if (status !== 'All' && c.status !== status) {
      return false;
    }

    // 2. Priority Filter
    if (priority !== 'All' && c.priority !== priority) {
      return false;
    }

    // 3. Category Filter
    if (category !== 'All' && c.category !== category) {
      return false;
    }

    // 4. Date Range Filter
    const cDate = parseFirestoreTimestamp(c.createdAt);
    if (!cDate && dateRange !== 'All Time') {
      return false;
    }

    if (dateRange === 'Last Day') {
      const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      if (cDate < past24h) return false;
    } else if (dateRange === 'Last Week') {
      const past7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (cDate < past7d) return false;
    } else if (dateRange === 'Last Month') {
      const past30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (cDate < past30d) return false;
    } else if (dateRange === 'Last Year') {
      const past365d = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      if (cDate < past365d) return false;
    } else if (dateRange === 'Custom Range') {
      if (customFrom) {
        const fromDate = new Date(`${customFrom}T00:00:00.000`);
        if (!isNaN(fromDate.getTime()) && cDate < fromDate) return false;
      }
      if (customTo) {
        const toDate = new Date(`${customTo}T23:59:59.999`);
        if (!isNaN(toDate.getTime()) && cDate > toDate) return false;
      }
    }

    return true;
  });
};

export const generateComplaintsCSV = (complaints = []) => {
  const headers = [
    'Complaint ID',
    'Title',
    'Category',
    'Description',
    'Status',
    'Priority',
    'Student ID',
    'Student Name',
    'Student Email',
    'Department',
    'Created Date & Time',
    'Updated Date & Time',
    'Admin Reply',
    'Student Proof Image URL',
    'Admin Response Image URL',
  ];

  const rows = complaints.map((c) => [
    c.id || '',
    c.title || '',
    c.category || '',
    c.description || '',
    c.status || '',
    c.priority || '',
    c.studentId || '',
    c.studentName || '',
    c.studentEmail || '',
    c.dept || '',
    formatDateTime(c.createdAt),
    formatDateTime(c.updatedAt),
    c.adminReply || '',
    c.imageUrl || '',
    c.adminResponseImageUrl || '',
  ]);

  const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\r\n');

  // Prepend UTF-8 BOM for Excel compatibility
  return '\uFEFF' + csvContent;
};

export const generateCSVFilename = (filters = {}) => {
  const parts = ['complaints'];

  if (filters.status && filters.status !== 'All') {
    parts.push(filters.status.toLowerCase().replace(/\s+/g, '-'));
  }
  if (filters.category && filters.category !== 'All') {
    parts.push(filters.category.toLowerCase().replace(/[^a-z0-0]/g, '-').replace(/-+/g, '-'));
  }

  if (filters.dateRange === 'Custom Range') {
    if (filters.customFrom && filters.customTo) {
      parts.push(`${filters.customFrom}_to_${filters.customTo}`);
    } else if (filters.customFrom) {
      parts.push(`from_${filters.customFrom}`);
    } else if (filters.customTo) {
      parts.push(`until_${filters.customTo}`);
    } else {
      parts.push('custom-range');
    }
  } else if (filters.dateRange && filters.dateRange !== 'All Time') {
    parts.push(filters.dateRange.toLowerCase().replace(/\s+/g, '-'));
  } else {
    parts.push('all-time');
  }

  return `${parts.join('_')}.csv`;
};
