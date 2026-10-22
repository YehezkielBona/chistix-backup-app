import React from 'react'
import { XMarkIcon, UserGroupIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'

interface AttendeeEntry {
    id: string
    customerName: string
    ticketTier: string
    ticketCode: string
    checkedInAt: string
    isAttended: boolean
}

interface AttendeeListActionProps{
  isOpen: boolean
  eventTitle: string
  onClose: () => void
}

const DUMMY_ATTENDEES: AttendeeEntry[] = [
  {id: "1", customerName: "Budi_Santoso", ticketTier: "Presale VIP", ticketCode: "TKT-001-A", checkedInAt: "15 Nov 2026, 19:32", isAttended: true},
  {id: "2", customerName: "Siti_Aminah", ticketTier: "Presale VIP", ticketCode: "TKT-002-B", checkedInAt: "15 Nov 2026, 19:45", isAttended: true},
  {id: "3", customerName: "Rani_Putri", ticketTier: "Presale VIP", ticketCode: "TKT-003-C", checkedInAt: "-", isAttended: false},
  {id: "4", customerName: "Dimas_Putra", ticketTier: "Presale VIP", ticketCode: "TKT-004-D", checkedInAt: "15 Nov 2026, 20:01", isAttended: true},
]

export default function AttendeeListAction({
  isOpen,
  eventTitle,
  onClose
}: AttendeeListActionProps) {
  if(!isOpen)return null

  const attendeeCount = DUMMY_ATTENDEES.filter(a => a.isAttended).length

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4'>
      <div className='bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-neutral-100 overflow-hidden max-h-screen'>

        <div className='flex justify-between items-center px-6 py-4 border-b border-neutral-100'>
          <div className='flex items-center gap-2.5'>
            <div className='w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center'>
              <UserGroupIcon className='w-5 h-5 text-emerald-600' />
            </div>
            <div>
              <h2 className='font-bold text-neutral-900 text-base'>Attendee List</h2>
              <p className='text-xs text-neutral-400 truncate max-w-72' title={eventTitle}>{eventTitle}</p>
            </div>
          </div>
            <div className='flex items-center gap-3'>
              <span className='text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full'>
                {attendeeCount}/{DUMMY_ATTENDEES.length} Attended
              </span>
              <button
              onClick={onClose}
              className='text-neutral-400 hover:text-neutral-700 cursor-pointer p-1 hover:bg-neutral-100 rounded-lg'
              >
                <XMarkIcon className='w-5 h-5' />
              </button>
          </div>
        </div>
          <div className='overflow-y-auto max-h-96 p-6'>
            <table className='w-full text-xs md:text-sm text-left'>
              <thead>
                <tr className='text-neutral-500 border-b border-neutral-100 font-medium'>
                  <th className='pb-3'>Customer</th>
                  <th className='pb-3'>Tier Ticket</th>
                  <th className='pb-3'>Ticket Code</th>
                  <th className='pb-3'>Check-In</th>
                  <th className='pb-3 text-center'>Status</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-neutral-50'>
                {DUMMY_ATTENDEES.map((attendee) => (
                  <tr key={attendee.id} className='hover:bg bg-neutral-50/60'>
                    <td className='py-3 font-semibold text-neutral-900'>{attendee.customerName}</td>
                    <td className='py-3 text-neutral-600'>{attendee.ticketTier}</td>
                    <td className='py-3 text-neutral-400 font-mono text-xs'>{attendee.ticketCode}</td>
                    <td className='py-3 text-neutral-500 text-xs'>{attendee.checkedInAt}</td>
                    <td className='py-3 text-center'>{attendee.isAttended ? (
                      <CheckBadgeIcon className='w-5 h-5 text-emerald-500 mx-auto' />
                    ): (
                      <span className='text-neutral-300 text-xs'>-</span>
                    )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end'>
            <button
            onClick={onClose}
            className='px-6 py-2 rounded-full text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#BB4D00] cursor-pointer'
            >
              Close
            </button>
          </div>
          
        </div>
      
    </div>
  )
}
