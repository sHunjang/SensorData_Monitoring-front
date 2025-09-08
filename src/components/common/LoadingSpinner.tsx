/**
 * 공용 로딩 스피너
 */
export default function LoadingSpinner() {
    return (
        <div style={{ padding: 16, textAlign: 'center' }}>
            <div className="spinner" />
            <style>{`
        .spinner {
          margin: 0 auto;
          width: 28px;
          height: 28px;
          border: 3px solid #e0e0e0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}
