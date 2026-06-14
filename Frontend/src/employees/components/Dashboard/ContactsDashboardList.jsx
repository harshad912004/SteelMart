import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Globe, Shield, ExternalLink } from 'lucide-react';
import { formatClientTypeLabel } from '../../utils/clientType';

export default function ContactsDashboardList({ contacts = [] }) {
  const navigate = useNavigate();

  const getTypeStyle = (type) => {
    const t = String(type || '').toLowerCase();
    if (t.includes('contractor')) {
      return { bg: '#ecfdf5', color: '#047857', border: '1px solid #d1fae5' };
    }
    if (t.includes('vendor')) {
      return { bg: '#fbf7ff', color: '#7c3aed', border: '1px solid #ede9fe' };
    }
    return { bg: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' };
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: '14px',
      padding: '20px 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>CRM Contacts</h2>
        <button
          onClick={() => navigate('/dashboard/contacts')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: '1.5px solid #5b5fc7',
            borderRadius: '8px',
            padding: '5px 12px',
            color: '#5b5fc7',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#5b5fc7'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#5b5fc7'; }}
        >
          <Eye size={13} />
          View All
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <th style={{ padding: '12px 8px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Company Name</th>
              <th style={{ padding: '12px 8px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Website</th>
              <th style={{ padding: '12px 8px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Office Number</th>
              <th style={{ padding: '12px 8px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Company Type</th>
              <th style={{ padding: '12px 8px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.slice(0, 5).map((contact) => {
              const clientTypeLabel = formatClientTypeLabel(contact.clientTypeName || contact.clientTypeId);
              const typeStyle = getTypeStyle(clientTypeLabel);
              return (
                <tr
                  key={contact.id}
                  style={{
                    borderBottom: '1px solid #f8fafc',
                    transition: 'background-color 0.15s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => navigate('/dashboard/contacts')}
                >
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>
                      {contact.companyName || 'N/A'}
                    </div>
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: '13px', color: '#64748b' }}>
                    {contact.companyWebsite ? (
                      <a
                        href={`https://${contact.companyWebsite}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          color: '#5b5fc7',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Globe size={12} />
                        {contact.companyWebsite}
                      </a>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: '13px', color: '#334155' }}>
                    {contact.officeNumber || '-'}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: typeStyle.bg,
                      color: typeStyle.color,
                      border: typeStyle.border,
                    }}>
                      {clientTypeLabel || 'Other'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/contacts`); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#5b5fc7',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#4338ca'}
                      onMouseLeave={e => e.currentTarget.style.color = '#5b5fc7'}
                    >
                      <ExternalLink size={13} />
                      Open
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
