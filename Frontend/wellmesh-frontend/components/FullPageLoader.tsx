export default function FullPageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="h-12 w-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
