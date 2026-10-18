export function PlaneIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M21.6 11.1 14 9.2 10.2 2.6a1 1 0 0 0-.9-.5H8.2a.6.6 0 0 0-.6.8L9.7 9 5 8.2 3.4 5.8a.8.8 0 0 0-.7-.3H1.8a.5.5 0 0 0-.5.6l1 5.9-1 5.9a.5.5 0 0 0 .5.6h.9a.8.8 0 0 0 .7-.3L5 15.8l4.7-.8-2.1 6.1a.6.6 0 0 0 .6.8h1.1a1 1 0 0 0 .9-.5L14 14.8l7.6-1.9a.9.9 0 0 0 0-1.8z"
      />
    </svg>
  );
}

export function MenuIcon({ isOpen }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {isOpen ? (
        <path fill="currentColor" d="M18.3 5.7a1 1 0 0 0-1.4 0L12 10.6 7.1 5.7a1 1 0 1 0-1.4 1.4l4.9 4.9-4.9 4.9a1 1 0 1 0 1.4 1.4l4.9-4.9 4.9 4.9a1 1 0 0 0 1.4-1.4L13.4 12l4.9-4.9a1 1 0 0 0 0-1.4z" />
      ) : (
        <path fill="currentColor" d="M4 7a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1zm0 5a1 1 0 0 1 1-1h9a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1zm1 4a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2H5z" />
      )}
    </svg>
  );
}
