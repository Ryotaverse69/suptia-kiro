const partners = [
  { name: 'iHerb', background: '#ffffff', color: '#6cab3f' },
  { name: 'Amazon', background: '#ffffff', color: '#f6991c' },
  { name: '楽天', background: '#ffffff', color: '#bf0000' },
  { name: 'LOHACO', background: '#ffffff', color: '#1e88e5' },
  { name: 'DHC', background: '#ffffff', color: '#153782' },
  { name: 'Qoo10', background: '#ffffff', color: '#ff3565' },
];

export function PartnerLogos() {
  return (
    <section className='bg-white py-10 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]'>
      <div className='mx-auto flex w-full max-w-[1100px] flex-col items-center gap-6 px-4 sm:px-6 lg:px-8'>
        <p className='text-center text-sm font-medium uppercase tracking-[0.4em] text-neutral-500'>
          TRUSTED BY TOP SUPPLEMENT STORES
        </p>
        <div className='flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-12'>
          {partners.map(partner => (
            <div
              key={partner.name}
              className='flex h-[60px] w-[120px] items-center justify-center rounded-[12px] border border-[#e0e0e0] bg-white shadow-[0_6px_16px_rgba(0,0,0,0.06)]'
              style={{ color: partner.color, background: partner.background }}
            >
              <span className='text-sm font-semibold tracking-wide'>
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
