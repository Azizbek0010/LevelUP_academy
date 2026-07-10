import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { HiOutlineBugAnt, HiOutlineArrowPath, HiOutlineArrowLeft } from 'react-icons/hi2';

export default function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = 'Something went wrong';
  let message = 'An unexpected error occurred. Please try again.';
  let statusCode = null;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    title = statusCode === 404 ? 'Page Not Found' : `Error ${statusCode}`;
    message = error.statusText || (statusCode === 404
      ? 'The page you are looking for does not exist.'
      : 'Something went wrong on our end.');
  } else if (error instanceof Error) {
    message = error.message;
  }

  const handleReset = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="max-w-md w-full text-center animate-fade-in">
        {/* Icon */}
        <div className="w-24 h-24 rounded-[28px] bg-[rgba(232,84,62,0.1)] flex items-center justify-center mx-auto mb-8">
          <HiOutlineBugAnt className="w-12 h-12 text-[var(--danger)]" />
        </div>

        {/* Glitch effect status */}
        {statusCode && (
          <div className="relative mb-4">
            <h1 className="text-[80px] font-extrabold leading-none text-[var(--danger)]/10 select-none"
                style={{ textShadow: '4px 4px 0 rgba(232,84,62,0.15), -2px -2px 0 rgba(198,255,52,0.1)' }}>
              {statusCode}
            </h1>
          </div>
        )}

        {/* Title */}
        <h2 className="text-[22px] font-extrabold text-[var(--text)] mb-3">
          {title}
        </h2>

        {/* Message */}
        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-8 max-w-sm mx-auto">
          {message}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-11 px-5 rounded-[14px] border border-[var(--border)] bg-[var(--surface)]
              text-[12px] font-bold text-[var(--text-secondary)]
              hover:border-[var(--text-muted)] hover:text-[var(--text)]
              transition-all duration-200 flex items-center gap-2"
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={handleReset}
            className="h-11 px-5 rounded-[14px] bg-[var(--green)] text-[#141B10]
              text-[12px] font-bold
              hover:brightness-110 hover:shadow-[0_4px_16px_var(--green-glow)]
              transition-all duration-200 flex items-center gap-2"
          >
            <HiOutlineArrowPath className="w-4 h-4" />
            Return Home
          </button>
        </div>

        {/* Error details for dev */}
        {error instanceof Error && import.meta.env.DEV && (
          <details className="mt-10 text-left">
            <summary className="text-[10px] text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-secondary)] transition-colors font-semibold">
              Error Details
            </summary>
            <pre className="mt-3 p-4 rounded-[12px] bg-[var(--surface)] border border-[var(--border)]
              text-[10px] text-[var(--text-secondary)] overflow-auto max-h-[200px] leading-relaxed">
              {error.stack || error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
