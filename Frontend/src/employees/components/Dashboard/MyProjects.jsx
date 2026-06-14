import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ExternalLink, Eye } from 'lucide-react';
import styles from './DashboardSectionGrid.module.css';

function ProjectCard({ project }) {
  const [tooltip, setTooltip] = useState(false);
  const navigate = useNavigate();

  const openProject = () => navigate(`/dashboard/projects?bid=${project.id}`);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      padding: '0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#1a1a2e' }}>{project.name}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>{project.code}</div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', position: 'relative' }}>
          {project.accessNotes && (
            <div style={{ position: 'relative' }}>
              <button
                onMouseEnter={() => setTooltip(true)}
                onMouseLeave={() => setTooltip(false)}
                style={{
                  background: '#1a1a2e',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  color: '#fff',
                  fontSize: '10px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                View Access Notes
              </button>
              {tooltip && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '130%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#333',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    lineHeight: 1.5,
                    maxWidth: '260px',
                    zIndex: 999,
                    pointerEvents: 'none',
                    wordBreak: 'break-word',
                  }}
                  dangerouslySetInnerHTML={{ __html: project.accessNotes }}
                />
              )}
            </div>
          )}
          <button
            onClick={openProject}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#aaa',
              display: 'flex',
              padding: '2px',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#5b5fc7'}
            onMouseLeave={e => e.currentTarget.style.color = '#aaa'}
          >
            <FileText size={15} />
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '11px', color: '#777', lineHeight: 1.3, marginRight: '8px' }}>{project.location}</div>
        <button
          onClick={openProject}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#5b5fc7',
            display: 'flex',
            padding: '2px',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#4338ca'}
          onMouseLeave={e => e.currentTarget.style.color = '#5b5fc7'}
        >
          <ExternalLink size={13} />
        </button>
      </div>
    </div>
  );
}

export default function MyProjects({ projects = [], isLoading = false }) {
  const navigate = useNavigate();
  const skeletonCards = [1, 2, 3, 4, 5, 6];

  // If loading, render elegant skeleton loader cards
  if (isLoading) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: '14px',
        padding: '20px 24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>My Projects</h2>
          <div style={{ width: '80px', height: '28px', background: '#f0f0f0', borderRadius: '8px' }}></div>
        </div>
        <div className={styles.projectGrid}>
          {skeletonCards.map((i) => (
            <div
              key={i}
              className={styles.projectGridCell}
              style={{
                animation: 'pulse 1.5s infinite ease-in-out',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ width: '50%', height: '14px', background: '#f5f5f5', borderRadius: '4px' }}></div>
                <div style={{ width: '30%', height: '10px', background: '#f5f5f5', borderRadius: '4px' }}></div>
                <div style={{ width: '80%', height: '10px', background: '#f5f5f5', borderRadius: '4px', marginTop: '4px' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: '14px',
        padding: '20px 24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>My Projects</h2>
          <button
            onClick={() => navigate('/dashboard/projects')}
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
        <div style={{ padding: '32px 0', textAlign: 'center', color: '#777', fontSize: '13px' }}>
          No projects available yet. Add a project in the Projects page to see it here.
        </div>
      </div>
    );
  }

  const displayProjects = projects.slice(0, 6).map((p, idx) => ({
    id: p.id,
    name: p.project_name || 'Project Name',
    code: p.bid_project_id || `BMB-224-${String(p.id || idx).padStart(3, '0')}`,
    location: p.address || 'No location provided',
    accessNotes: p.access_notes || '',
  }));

  return (
    <div style={{
      background: '#fff',
      borderRadius: '14px',
      padding: '20px 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>My Projects</h2>
        <button
          onClick={() => navigate('/dashboard/projects')}
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
      <div className={styles.projectGrid}>
        {displayProjects.map((p, i) => (
          <div
            key={i}
            className={styles.projectGridCell}
          >
            <ProjectCard project={p} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}