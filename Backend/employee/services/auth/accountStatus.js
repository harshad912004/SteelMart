const activeUserFilter = `
    u.status = 'active'
`;

const getUnavailableAccountMessage = (user) => {
     if (!user) return null;

     const status = String(user.status || '').trim().toLowerCase();
     if (status === 'deleted' || Number(user.is_deleted) === 1) return 'Account has been deleted';
     if (status === 'blocked' || Number(user.is_blocked) === 1) return 'Account is blocked. Please contact administrator';
     if (status === 'inactive' || Number(user.is_inactive) === 1 || Number(user.is_active) === 0) {
          return 'Account is inactive. Please contact administrator';
     }

     return null;
};

const activeBidFilter = `
    COALESCE(b.project_status, 'active') = 'active' AND
    COALESCE(b.bid_status, 'bidInProgress') <> 'deleted'
`;

const getUnavailableBidMessage = (bid) => {
     if (!bid) return null;

     const projectStatus = String(bid.project_status || '').trim().toLowerCase();
     const bidStatus = String(bid.status || bid.bid_status || '').trim().toLowerCase();

     if (projectStatus === 'deleted' || bidStatus === 'deleted' || Number(bid.is_deleted) === 1) {
          return 'Bid is deleted. Please contact administrator';
     }

     if (projectStatus && projectStatus !== 'active') {
          return 'Bid is inactive. Please contact administrator';
     }

     return null;
};

module.exports = {
     activeUserFilter,
     getUnavailableAccountMessage,
     activeBidFilter,
     getUnavailableBidMessage,
};