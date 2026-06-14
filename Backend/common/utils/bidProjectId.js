function bidProjectId(id, prefix = 'BID') {
     const d = new Date();
     const year = d.getFullYear();
     const trimmedYear = String(year).replace(/0/g, '');
     const paddedId = String(id).padStart(2, '0');

     return `${String(prefix).toUpperCase()}-${trimmedYear}-${paddedId}`;
}

function bidSalesId(id) {
     const d = new Date();
     const year = d.getFullYear();
     const trimmedYear = String(year).replace(/0/g, '');

     return `BID-${trimmedYear}-0${String(id)}`;
}

function bidCrmId(id) {
     const d = new Date();
     const year = d.getFullYear();
     const trimmedYear = String(year).replace(/0/g, '');

     return `EST-${trimmedYear}-0${String(id)}`;
}

function bidCProjectId(id) {
     const d = new Date();
     const year = d.getFullYear();
     const trimmedYear = String(year).replace(/0/g, '');
     return `PRJ-${trimmedYear}-0${String(id)}`;
}

module.exports = { bidProjectId, bidSalesId, bidCrmId, bidCProjectId };