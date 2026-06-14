import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, FileText, ClipboardCheck, CalendarDays, ArrowRight } from 'lucide-react';

export default function QuickCards({ totalEmployees = null, onOpenProfile = () => { } }) {
  const navigate = useNavigate();

  const cards = [
    {
      label: 'My Profile',
      sub: 'View Details',
      icon: <User size={28} color="#fff" />,
      bg: 'linear-gradient(135deg, #f59e0b 0%, #ef6c00 100%)',
      arrow: true,
      onClick: onOpenProfile
    },
    {
      label: 'Team',
      sub: totalEmployees !== null ? `${totalEmployees} Members` : 'View Details',
      icon: <Users size={28} color="#fff" />,
      bg: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
      arrow: true,
      onClick: () => navigate('/dashboard/employee')
    },
    {
      label: 'Paystubs',
      sub: 'View Details',
      icon: <FileText size={28} color="#fff" />,
      bg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      arrow: true,
      onClick: () => { }
    },
    {
      label: 'Mark\nAttendance',
      sub: 'View Details',
      icon: <ClipboardCheck size={28} color="#fff" />,
      bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      arrow: true,
      onClick: () => { }
    },
    {
      label: 'Leaves',
      sub: 'View Details',
      icon: <CalendarDays size={28} color="#fff" />,
      bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      arrow: true,
      onClick: () => { }
    },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '14px',
      overflowX: 'auto',
      paddingBottom: '4px',
    }}>
      {cards.map((card) => (
        <button
          key={card.label}
          onClick={card.onClick}
          style={{
            background: card.bg,
            border: 'none',
            borderRadius: '14px',
            padding: '16px 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            minWidth: '165px',
            flex: '1',
            textAlign: 'left',
            transition: 'transform 0.15s, box-shadow 0.15s',
            boxShadow: '0 4px 15px rgba(0,0,0,0.12)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.18)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.12)';
          }}
        >
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '10px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {card.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              color: '#fff',
              fontWeight: 700,
              fontSize: '14px',
              lineHeight: 1.2,
              whiteSpace: 'pre-line',
            }}>{card.label}</div>
            <div style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '11px',
              marginTop: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              {card.sub}
              {card.arrow && <ArrowRight size={10} />}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}