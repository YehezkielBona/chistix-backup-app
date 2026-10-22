export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded-md w-1/3"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="w-full aspect-[16/9] bg-gray-200 rounded-2xl"></div>
          <div className="h-40 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="lg:col-span-1">
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}