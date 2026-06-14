import React, { useEffect, useState } from 'react';
import AdminProfileModal from '../../components/AdminProfileModal';
import QuickCards from '../../components/Dashboard/QuickCards';
import MyProjects from '../../components/Dashboard/MyProjects';
import EmptySection from '../../components/Dashboard/EmptySection';
import BidsDashboardList from '../../components/Dashboard/BidsDashboardList';
import CRMDashboardList from '../../components/Dashboard/CRMDashboardList';
import DashboardListSkeleton from '../../components/Dashboard/DashboardListSkeleton';
import DueSoonSection from '../../components/Dashboard/DueSoonSection';
import { getEmployees, getBids, getDueSoon } from '../../../common/services/api';
import { isSalesPipelineBid, isCrmPipelineBid } from '../../utils/bidHelpers';

function DashboardPage() {
  const [totalEmployees, setTotalEmployees] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeBids, setActiveBids] = useState([]);
  const [crmBids, setCrmBids] = useState([]);
  const [dueSoonProjects, setDueSoonProjects] = useState([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingBids, setIsLoadingBids] = useState(true);
  const [isLoadingCrm, setIsLoadingCrm] = useState(true);
  const [isLoadingDueSoon, setIsLoadingDueSoon] = useState(true);

  useEffect(() => {
    // 1. Fetch Employees count for the team card
    const fetchEmployeesData = async () => {
      try {
        const res = await getEmployees(1);
        setTotalEmployees(res?.pagination?.totalRecords || 0);
      } catch (err) {
        console.error('Failed to load employees for dashboard:', err);
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    // 2. Fetch Projects (approved or won bids)
    const fetchProjectsData = async () => {
      try {
        const [appRes, wonRes] = await Promise.all([
          getBids(1, 'approved', '', '', '', 'crm'),
          getBids(1, 'won', '', '', '', 'crm'),
        ]);
        const appList = appRes?.bids || appRes?.data?.bids || appRes?.data || [];
        const wonList = wonRes?.bids || wonRes?.data?.bids || wonRes?.data || [];
        const combined = [...appList, ...wonList];
        
        // De-duplicate by ID
        const unique = [];
        const seen = new Set();
        for (const bid of combined) {
          if (bid?.id && !seen.has(bid.id)) {
            seen.add(bid.id);
            unique.push(bid);
          }
        }
        setProjects(unique);
      } catch (err) {
        console.error('Failed to load projects for dashboard:', err);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    // 3. Fetch Active Bids (in progress, sent to client)
    const fetchBidsData = async () => {
      try {
        const res = await getBids(1, '', '', '', '', 'sales');
        const allBids = res?.bids || res?.data?.bids || res?.data || [];
        const active = allBids.filter((bid) => isSalesPipelineBid(bid, { includeDeleted: false }));
        setActiveBids(active);
      } catch (err) {
        console.error('Failed to load active bids for dashboard:', err);
      } finally {
        setIsLoadingBids(false);
      }
    };

    // 4. Fetch CRM bids for the dashboard card grid
    const fetchCrmBidsData = async () => {
      try {
        const res = await getBids(1, '', '', '', '', 'crm');
        const allCrmBids = res?.bids || res?.data?.bids || res?.data || [];
        const visibleCrmBids = allCrmBids.filter((bid) => isCrmPipelineBid(bid, { includeDeleted: false }));
        setCrmBids(visibleCrmBids);
      } catch (err) {
        console.error('Failed to load CRM bids for dashboard:', err);
      } finally {
        setIsLoadingCrm(false);
      }
    };

    // 5. Fetch Due Soon projects
    const fetchDueSoonData = async () => {
      try {
        const res = await getDueSoon(1, 10);
        const data = res?.bids || res?.data?.bids || res?.data || [];
        setDueSoonProjects(data);
      } catch (err) {
        console.error('Failed to load due soon projects for dashboard:', err);
      } finally {
        setIsLoadingDueSoon(false);
      }
    };

    fetchEmployeesData();
    fetchProjectsData();
    fetchBidsData();
    fetchCrmBidsData();
    fetchDueSoonData();
  }, []);

  return (
    <div style={{
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      maxWidth: '1400px',
      width: '100%',
    }}>
      {/* Quick Action Cards */}
      <QuickCards totalEmployees={totalEmployees} onOpenProfile={() => setIsProfileOpen(true)} />

      <AdminProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      {/* My Projects */}
      <MyProjects projects={projects} isLoading={isLoadingProjects} />

      {/* Due Soon */}
      <DueSoonSection projects={dueSoonProjects} isLoading={isLoadingDueSoon} />

      {/* My Bids */}
      {/* {isLoadingBids ? (
        <DashboardListSkeleton title="My Bids" />
      ) : activeBids.length > 0 ? (
        <BidsDashboardList bids={activeBids} />
      ) : (
        <EmptySection
          title="My Bids"
          message="No Bids to show"
          type="bids"
        />
      )} */}

      {/* CRM */}
      {isLoadingCrm ? (
        <DashboardListSkeleton title="CRM" />
      ) : crmBids.length > 0 ? (
        <CRMDashboardList bids={crmBids} />
      ) : (
        <EmptySection
          title="CRM"
          message="No CRM to show"
          type="crm"
        />
      )}
    </div>
  );
}

export default DashboardPage;