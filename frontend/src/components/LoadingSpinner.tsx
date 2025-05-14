'use client';

export default function LoadingSpinner() {
  return (
    <div style={{ 
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(255, 122, 0, 0.2)',
          borderTop: '4px solid #FF7A00',
          borderRight: '4px solid #FF7A00',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <div style={{
          fontSize: '1.125rem',
          color: '#FFB4A2',
          fontWeight: '500'
        }}>
          Loading...
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
} 