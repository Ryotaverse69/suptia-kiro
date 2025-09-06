export default function LoadingProducts() {
  return (
    <div className='container mx-auto px-4 py-10'>
      <div className='mb-8'>
        <div className='h-8 w-48 bg-gray-200 rounded animate-pulse' />
        <div className='h-4 w-72 bg-gray-200 rounded mt-3 animate-pulse' />
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className='card p-6'>
            <div className='h-5 w-3/4 bg-gray-200 rounded mb-3 animate-pulse' />
            <div className='flex gap-3'>
              <div className='h-6 w-20 bg-gray-200 rounded animate-pulse' />
              <div className='h-6 w-24 bg-gray-200 rounded animate-pulse' />
            </div>
            <div className='h-4 w-32 bg-gray-200 rounded mt-4 animate-pulse' />
          </div>
        ))}
      </div>
    </div>
  );
}
