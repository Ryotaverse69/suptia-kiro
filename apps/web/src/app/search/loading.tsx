import { Skeleton } from '@/components/ui/Skeleton';

export default function SearchLoading() {
  return (
    <div className='mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-10'>
      <div className='grid gap-8 lg:grid-cols-[300px_1fr]'>
        <div className='space-y-4'>
          <Skeleton variant='filter' />
          <Skeleton variant='filter' />
        </div>
        <div className='space-y-6'>
          <Skeleton variant='card' className='h-[220px]' />
          <Skeleton variant='card' className='h-[220px]' />
          <Skeleton variant='card' className='h-[220px]' />
        </div>
      </div>
    </div>
  );
}
