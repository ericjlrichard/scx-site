export default function Container({ className = "", children }) {
  return (
    <div className={`mx-auto w-full max-w-screen-sm ${className}`}>
      {children}
    </div>
  );
}
