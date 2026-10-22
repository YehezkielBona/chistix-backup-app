import React from 'react'
import { XMarkIcon, QrCodeIcon } from '@heroicons/react/24/outline'

interface QREntry {
    id: string
    customerName: string
    ticketCode: string
    ticketTier: string
    isScanned: boolean
}

interface QRListActionProps {
    isOpen: boolean
    eventTitle: string
    onClose: () => void
}

const DUMMY_QR_LIST: QREntry[] = [
    {id: "1", customerName: "Budi_Santoso", ticketCode: "TKT-001-A", ticketTier: "PresaleVIP", isScanned: true},
    {id: "2", customerName: "Siti_Aminah", ticketCode: "TKT-002-B", ticketTier: "PresaleVIP", isScanned: true},
    {id: "3", customerName: "Rani_Putri", ticketCode: "TKT-003-C", ticketTier: "PresaleVIP", isScanned: false},
    {id: "4", customerName: "Dimas_Putra", ticketCode: "TKT-004-D", ticketTier: "PresaleVIP", isScanned: false},
]

export default function QRListAction({
    isOpen,
    eventTitle,
    onClose
}: QRListActionProps) {
    if(!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4'>
      <div className='bg-white rounded-2xl w-full max-w-lg shadow-xl border border-neutral-100 overflow-hidden'>

        <div className='flex justify-between items-center px-6 py-4 border-b border-neutral-100'>
            <div className='flex items-center gap-2.5'>
                <div className='w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center'>
                    <QrCodeIcon className='w-5 h-5 text-blue-500' />
                </div>
                <div>
                    <h2 className='font-bold text-neutral-900 text-base'>E-Ticket List</h2>
                    <p className='text-xs text-neutral-400 max-w-64 truncate' title={eventTitle}>{eventTitle}</p>
                </div>
            </div>
            <button
            onClick={onClose}
            className='text-neutral-400 hover:text-neutral-700 p-1 hover:bg-neutral-100 rounded-lg cursor-pointer'
            >
                <XMarkIcon className='w-5 h-5' />
            </button>
        </div>

        <div className='px-6 pt-4'>
            <div className='bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-xs text-blue-700'>
                This QR code is only generated for transactions with <strong>DONE</strong> status. Use the <strong>Ticket Scanner page</strong> to scan ticket during the event.
            </div>
        </div>

        <div className='p-6 space-y-2.5 overflow-auto max-h-80'>
            {DUMMY_QR_LIST.map((entry) => (
                <div key={entry.id} className='flex items-center justify-between p-3.5 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors'>
                    <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center shrink-0'>
                            <QrCodeIcon className='w-6 h-6 text-neutral-400' />
                        </div>
                        <div>
                            <p className='font-semibold text-neutral-900 text-sm'>{entry.customerName}</p>
                            <p className='text-xs bg-neutral-400 font-mono'>{entry.ticketCode} · {entry.ticketTier}</p>
                        </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        entry.isScanned ? "bg-emerald-100 text-emerald-700" :
                        "bg-neutral-100 text-neutral-100"
                    }`}>
                        {entry.isScanned ? "Scannned" : "Not Scanned"}
                    </span>
                </div>
            ))}
        </div>

        <div className='px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex justify-end'>
            <button
            onClick={onClose}
            className='px-6 py-2 rounded-full text-sm font-semibold text-white bg-[#EA500C] hover:bg-[#BB4D00] cursor-pointer'
            >
                Close
            </button>
        </div>
        
      </div>
    </div>
  )
}
