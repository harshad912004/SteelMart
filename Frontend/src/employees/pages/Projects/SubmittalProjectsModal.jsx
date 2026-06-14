import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal';
import { getProjectsWithSubmittals } from '../../../common/services/api';
import styles from './RfiProjectsModal.module.css';

function SubmittalProjectsModal({ isOpen, onClose }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const fetchProjects = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await getProjectsWithSubmittals();
        if (response?.success) {
          setProjects(response.data?.projects || response.projects || []);
        } else {
          throw new Error(response?.message || 'Failed to fetch projects with Submittals.');
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load projects. Please try again.');
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
    return undefined;
  }, [isOpen]);

  const handleSelectProject = (projectId) => {
    navigate(`/dashboard/projects/${projectId}/submittals`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Submittal Project" width="580px">
      <div className={styles.container}>
        {isLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading projects...</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={styles.emptyIcon}>
              <path d="M5 4.75A1.75 1.75 0 0 1 6.75 3H14.5L19 7.5V19.25A1.75 1.75 0 0 1 17.25 21H6.75A1.75 1.75 0 0 1 5 19.25V4.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 3V8H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3>No Projects with Submittals</h3>
            <p>There are currently no active projects that contain Submittals.</p>
          </div>
        ) : (
          <div className={styles.listContainer}>
            <p className={styles.instruction}>Select a project below to go to its Submittals board:</p>
            <div className={styles.projectList}>
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={styles.projectRow}
                  onClick={() => handleSelectProject(project.id)}
                >
                  <div className={styles.projectInfo}>
                    <span className={styles.projectId}>{project.bid_project_id || `PRJ-${String(project.id).padStart(4, '0')}`}</span>
                    <span className={styles.projectName}>{project.project_name}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.selectBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectProject(project.id);
                    }}
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default SubmittalProjectsModal;
