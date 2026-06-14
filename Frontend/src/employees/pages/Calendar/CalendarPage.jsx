import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getBids } from '../../../common/services/api';
import { parseDateLocal } from '../../utils/bidHelpers';
import styles from './CalendarPage.module.css';

/* ─── Status helpers ─── */
const getStatusKey = (bid) => {
  const raw = bid?.status || bid?.project_status || bid?.bid_status || '';
  const status = String(raw).toLowerCase().replace(/[\s_-]+/g, '');

  if (status === 'archived' || status === 'deleted') return 'archived';
  if (status === 'senttoclient' || status === 'sharedwithclient' || status === 'clienttorespond') return 'sentToClient';
  if (status === 'bidinprogress' || status === 'pending') return 'inProgress';

  if (status === 'approved' || status === 'won') return 'approved';
  if (status === 'lost' || status === 'rejected') return 'lost';

  const dueDate = bid?.due_date || bid?.dueDate;
  if (dueDate) {
    const due = parseDateLocal(dueDate);
    if (due) {
      due.setHours(23, 59, 59, 999);
      if (due < new Date()) return 'overdue';
    }
  }

  return 'default';
};

const STATUS_COLORS = {
  inProgress: { bg: 'rgba(21, 112, 239, 0.10)', border: '#1570EF', text: '#1570EF' },
  overdue:    { bg: 'rgba(245, 158, 11, 0.12)', border: '#F59E0B', text: '#B45309' },

  sentToClient: { bg: 'rgba(3, 152, 85, 0.10)', border: '#039855', text: '#039855' },
  approved:   { bg: 'rgba(16, 185, 129, 0.10)', border: '#10B981', text: '#047857' },
  lost:       { bg: 'rgba(239, 68, 68, 0.10)', border: '#EF4444', text: '#B91C1C' },
  archived:   { bg: 'rgba(152, 162, 179, 0.12)', border: '#98A2B3', text: '#667085' },
  default:    { bg: 'rgba(21, 112, 239, 0.08)', border: '#1570EF', text: '#1570EF' },
};

const LEGEND_ITEMS = [
  { label: 'Bid In Progress', color: '#1570EF' },

  { label: 'Sent To Client', color: '#039855' },
  { label: 'Approved / Won', color: '#10B981' },
  { label: 'Lost', color: '#EF4444' },
  { label: 'Overdue', color: '#E04D2D' },
  { label: 'Archived', color: '#98A2B3' },
];

const STATUS_LABELS = {
  inProgress:   'In Progress',

  sentToClient: 'Sent',
  approved:     'Won',
  lost:         'Lost',
  overdue:      'Overdue',
  archived:     'Archived',
  default:      '',
};

/* ═══════════════════════════════════════════
   CalendarPage Component
   ═══════════════════════════════════════════ */
export default function CalendarPage() {
  const navigate = useNavigate();
  const [allBids, setAllBids] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMonthStart, setCurrentMonthStart] = useState(null);
  const [currentMonthEnd, setCurrentMonthEnd] = useState(null);

  /* Helper to format Date to YYYY-MM-DD local string */
  const formatDateStr = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  /* ── Fetch bids in range ── */
  const fetchBidsRange = useCallback(async (startStr, endStr) => {
    if (!startStr || !endStr) return;
    setIsLoading(true);
    try {
      const [salesData, crmData] = await Promise.all([
        getBids(1, '', '', '', '', 'sales', 500, undefined, startStr, endStr),
        getBids(1, '', '', '', '', 'crm', 500, undefined, startStr, endStr),
      ]);
      const salesBids = salesData?.bids || salesData?.data?.bids || salesData?.data || [];
      const crmBids = crmData?.bids || crmData?.data?.bids || crmData?.data || [];

      // Merge and de-duplicate by ID
      const combined = [...(Array.isArray(salesBids) ? salesBids : []), ...(Array.isArray(crmBids) ? crmBids : [])];
      const seen = new Set();
      const unique = combined.filter((bid) => {
        if (!bid?.id || seen.has(bid.id)) return false;
        seen.add(bid.id);
        return true;
      });
      setAllBids(unique);
    } catch {
      setAllBids([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDatesSet = (dateInfo) => {
    const startStr = formatDateStr(dateInfo.view.currentStart);
    const endStr = formatDateStr(new Date(dateInfo.view.currentEnd.getTime() - 1));
    setCurrentMonthStart(dateInfo.view.currentStart);
    setCurrentMonthEnd(dateInfo.view.currentEnd);
    fetchBidsRange(startStr, endStr);
  };

  /* ── Convert bids to FullCalendar events ── */
  const calendarEvents = useMemo(() => {
    if (!currentMonthStart || !currentMonthEnd) return [];
    return allBids
      .filter((bid) => {
        const dueDate = bid.due_date || bid.dueDate;
        if (!dueDate) return false;
        const eventDate = parseDateLocal(dueDate);
        if (!eventDate) return false;
        // Only show events that are within the currently viewed month
        return eventDate >= currentMonthStart && eventDate < currentMonthEnd;
      })
      .map((bid) => {
        const dueDate = bid.due_date || bid.dueDate;
        const statusKey = getStatusKey(bid);
        const colors = STATUS_COLORS[statusKey] || STATUS_COLORS.default;
        const dueDateStr = String(dueDate).split('T')[0];

        return {
          id: String(bid.id),
          title: bid.project_name || bid.projectName || 'Untitled Bid',
          start: dueDateStr,
          allDay: true,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: colors.text,
          extendedProps: {
            bidId: bid.id,
            statusKey,
            bidDisplayId: bid.bid_id || bid.display_id || bid.id,
          },
        };
      });
  }, [allBids, currentMonthStart, currentMonthEnd]);

  /* ── Event click → navigate to bid ── */
  const handleEventClick = (clickInfo) => {
    const bidId = clickInfo.event.extendedProps.bidId;
    if (bidId) {
      navigate(`/dashboard/sales?bid=${bidId}`);
    }
  };

  /* ── Custom event content renderer ── */
  const renderEventContent = (eventInfo) => {
    const statusKey = eventInfo.event.extendedProps.statusKey;
    const colors = STATUS_COLORS[statusKey] || STATUS_COLORS.default;
    const statusLabel = STATUS_LABELS[statusKey] || '';

    return (
      <div className={styles.eventCard} title={eventInfo.event.title}>
        <span className={styles.eventAccent} style={{ background: colors.border }} />
        <div className={styles.eventBody}>
          <span className={styles.eventTitle}>{eventInfo.event.title}</span>
          {statusLabel && (
            <span
              className={styles.eventBadge}
              style={{
                color: colors.text,
                background: colors.bg,
                borderColor: colors.border,
              }}
            >
              {statusLabel}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <h1 className={styles.pageTitle}>Calendar</h1>
        <div className={styles.legend}>
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ background: item.color }}
              />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className={styles.calendarContainer} style={{ position: 'relative' }}>
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner} />
          </div>
        )}
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={calendarEvents}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          datesSet={handleDatesSet}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek',
          }}
          height="auto"
          dayMaxEvents={3}
          moreLinkClick="popover"
          eventDisplay="block"
          fixedWeekCount={false}
          eventInteractive={true}
        />
      </div>
    </div>
  );
}
