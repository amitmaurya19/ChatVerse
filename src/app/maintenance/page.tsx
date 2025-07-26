import React from 'react';

const MaintenancePage = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      textAlign: 'center',
      backgroundColor: '#f3f4f6',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937' }}>
        Under Maintenance
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#4b5563', marginTop: '1rem' }}>
        Currently, the site is under database migration. Please check back after some time.
      </p>
      <p style={{ marginTop: '2rem', color: '#6b7280' }}>
        We appreciate your patience!
      </p>
    </div>
  );
};

export default MaintenancePage;