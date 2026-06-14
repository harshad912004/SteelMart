import React from 'react';

function ActionMenu({ styles, position, actions }) {
  return (
    <div
      className={styles.actionMenu}
      style={{ top: position.top, left: position.left }}
      onClick={(event) => event.stopPropagation()}
    >
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          className={action.isDanger ? styles.menuItemDelete : styles.menuItem}
          onClick={action.onClick}
          disabled={action.disabled}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
}

export default ActionMenu;