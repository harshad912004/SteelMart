import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { getBidDisplayId } from '../../utils/bidHelpers';

const parseDateString = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
};

const getClientLabel = (bid) => {
  if (Array.isArray(bid?.clients) && bid.clients.length > 0) {
    return bid.clients[0]?.client_name || bid.clients[0]?.name || 'N/A';
  }
  return bid?.client_name || bid?.client || 'N/A';
};

const getBadgeStyles = (tag) => {
  switch (tag) {
    case 'Sales':
      return {
        color: '#16a34a',
        borderColor: '#86efac',
        background: '#f0fdf4',
      };
    case 'CRM':
      return {
        color: '#2563eb',
        borderColor: '#93c5fd',
        background: '#eff6ff',
      };
    case 'Projects':
      return {
        color: '#ea580c',
        borderColor: '#fdba74',
        background: '#fff7ed',
      };
    case 'Calendar':
    default:
      return {
        color: '#4f46e5',
        borderColor: '#c7d2fe',
        background: '#eef2ff',
      };
  }
};

export default function DueSoonSection({ projects = [], isLoading = false }) {
  const navigate = useNavigate();

  const handleCardClick = (project) => {
    const tag = String(project.tag || '').toLowerCase();
    if (tag === 'sales') {
      navigate('/dashboard/sales', { state: { openBidId: project.id } });
    } else if (tag === 'crm') {
      navigate('/dashboard/crm', { state: { openBidId: project.id } });
    } else {
      navigate('/dashboard/sales', { state: { openBidId: project.id } });
    }
  };

  const handleViewMore = () => {
    navigate('/dashboard/calendar');
  };

  if (isLoading) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: '14px',
        padding: '24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        animation: 'pulse 1.5s infinite ease-in-out',
      }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e', marginBottom: '20px' }}>Due Soon</h2>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ width: '80px', height: '90px', background: '#f5f5f5', borderRadius: '10px' }} />
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ width: '40%', height: '16px', background: '#f5f5f5', borderRadius: '4px' }} />
            <div style={{ width: '60%', height: '14px', background: '#f5f5f5', borderRadius: '4px' }} />
            <div style={{ width: '20%', height: '12px', background: '#f5f5f5', borderRadius: '4px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: '14px',
        padding: '24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e', marginBottom: '20px' }}>Due Soon</h2>
        <div style={{ padding: '32px 0', textAlign: 'center', color: '#777', fontSize: '13px' }}>
          No projects are due soon.
        </div>
      </div>
    );
  }

  // Group projects by date
  const grouped = [];
  projects.forEach((proj) => {
    const rawDate = proj.due_date ? proj.due_date.split('T')[0] : 'No Date';
    let group = grouped.find((g) => g.dateStr === rawDate);
    if (!group) {
      group = {
        dateStr: rawDate,
        dateObj: parseDateString(rawDate),
        projects: [],
      };
      grouped.push(group);
    }
    group.projects.push(proj);
  });

  return (
    <div style={{
      background: '#fff',
      borderRadius: '14px',
      padding: '24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Due Soon</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {grouped.slice(0, 3).map((group, gIdx) => {
          const formattedMonth = group.dateObj
            ? group.dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
            : 'N/A';
          const formattedDay = group.dateObj
            ? String(group.dateObj.getDate()).padStart(2, '0')
            : '--';
          const formattedWeekday = group.dateObj
            ? group.dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
            : '---';

          return (
            <div key={group.dateStr || gIdx} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              {/* Date Box on Left */}
              <div style={{
                width: '80px',
                height: '90px',
                background: '#fff',
                border: '1px solid #f1f3f5',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#8a8f98', letterSpacing: '0.5px' }}>
                  {formattedMonth}
                </span>
                <span style={{ fontSize: '26px', fontWeight: 800, color: '#1f2937', margin: '2px 0', lineHeight: 1 }}>
                  {formattedDay}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#8a8f98' }}>
                  {formattedWeekday}
                </span>
              </div>

              {/* Projects Stack on Right */}
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
                {group.projects.map((proj) => {
                  const badgeStyles = getBadgeStyles(proj.tag);
                  const displayId = getBidDisplayId(proj);
                  const clientName = getClientLabel(proj);

                  return (
                    <div
                      key={proj.id}
                      onClick={() => handleCardClick(proj)}
                      style={{
                        background: '#fff',
                        border: '1px solid #e6eaf0',
                        borderRadius: '8px',
                        padding: '16px 20px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 14px rgba(15, 23, 42, 0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <h3 style={{
                          margin: 0,
                          fontSize: '15px',
                          fontWeight: 600,
                          color: '#2a2f3a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {proj.project_name || 'Untitled Project'}
                        </h3>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '3px 12px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: badgeStyles.color,
                          border: `1.5px solid ${badgeStyles.borderColor}`,
                          background: badgeStyles.background,
                          flexShrink: 0,
                        }}>
                          {proj.tag}
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', color: '#4b5563', fontWeight: 500 }}>
                        {clientName}
                      </div>

                      <div style={{ fontSize: '11px', color: '#8a8f98' }}>
                        {displayId}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Centered View More Button at Bottom */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
        <button
          onClick={handleViewMore}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: '1.5px solid #5b5fc7',
            borderRadius: '8px',
            padding: '8px 20px',
            color: '#5b5fc7',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#5b5fc7';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#5b5fc7';
          }}
        >
          <Eye size={15} />
          View More
        </button>
      </div>
    </div>
  );
}
