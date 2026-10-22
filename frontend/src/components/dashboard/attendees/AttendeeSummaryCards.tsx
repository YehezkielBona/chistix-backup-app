import React from 'react'

interface AttendeeSummaryCardsProps {
    totalRegistered: number
    totalAttended: number
    notYetArrived: number
}


export default function AttendeeSummaryCards({
    totalRegistered,
    totalAttended,
    notYetArrived
}: AttendeeSummaryCardsProps) {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6'>

        <div className='bg-[#EA580C] text-white p-5 rounded-2xl shadow-xs flex flex-col justify-between'>
            <span className='text-xs font-medium text-orange-100 uppercase tracking-wider'>
                Registered
            </span>
            <div className='mt-3'>
                <p className='text-2xl md:text-3xl font-extrabold tracking-tight'>
                    {totalRegistered} Customers
                </p>
            </div>
        </div>

        <div className='bg-[#16A34A] text-white p-5 rounded-2xl shadow-xs flex flex-col justify-between'>
            <span className='text-xs font-medium text-emerald-100 uppercase tracking-wider'>
                Attended
            </span>
            <div className='mt-3'>
                <p className='text-2xl md:text-3xl font-extrabold tracking-tight'>
                    {totalAttended} Customers
                </p>
            </div>
        </div>

        <div className='bg-[#52525B] text-white p-5 rounded-2xl shadow-xs flex flex-col justify-between'>
            <span className='text-xs font-medium text-zinc-100 uppercase tracking-wider'>
                Not yet Arrived
            </span>
            <div className='mt-3'>
                <p className='text-2xl md:text-3xl font-extrabold tracking-tight'>
                    {notYetArrived} Customers
                </p>
            </div>
        </div>

    </div>
  )
}
