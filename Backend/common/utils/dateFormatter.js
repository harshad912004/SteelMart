const formatDate = (date) => {
     if (!date) return null;
     // For date-only strings (YYYY-MM-DD), avoid UTC midnight shift
     const str = String(date);
     const dateOnly = str.split('T')[0];
     const parts = dateOnly.split('-');
     if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          const d = parseInt(parts[2], 10);
          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
               return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          }
     }
     // Fallback for Date objects or other formats
     const d = new Date(date);
     if (Number.isNaN(d.getTime())) return null;
     const year = d.getFullYear();
     const month = String(d.getMonth() + 1).padStart(2, '0');
     const day = String(d.getDate()).padStart(2, '0');
     return `${year}-${month}-${day}`;
};

const formatDateTime = (date) => {
     if (!date) return null;
     const d = new Date(date);
     if (Number.isNaN(d.getTime())) return null;
     const year = d.getFullYear();
     const month = String(d.getMonth() + 1).padStart(2, '0');
     const day = String(d.getDate()).padStart(2, '0');
     const hours = String(d.getHours()).padStart(2, '0');
     const minutes = String(d.getMinutes()).padStart(2, '0');
     const seconds = String(d.getSeconds()).padStart(2, '0');
     return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

module.exports = { formatDate, formatDateTime };