import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getDecodedToken, isVendorSession } from '../../auth/session';

function ProtectedRoute({ accountType = 'employee', loginPath = '/employee/login' }) {
  const location = useLocation();
  const decoded = getDecodedToken();

  if (!decoded) {
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  const isVendor = isVendorSession(decoded);

  if (accountType === 'vendor' && !isVendor) {
    return <Navigate to="/employee/login" replace />;
  }

  if (accountType === 'employee' && isVendor) {
    return <Navigate to="/vendor/dashboard" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;