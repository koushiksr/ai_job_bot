'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit, X } from 'lucide-react'
import CandidateProfileEditor from '@/components/CandidateProfileEditor'

interface CandidateProfileEditModalProps {
  editingUser: any | null
  onClose: () => void
  onSaveSuccess: () => void
}

export default function CandidateProfileEditModal({
  editingUser,
  onClose,
  onSaveSuccess
}: CandidateProfileEditModalProps) {
  useEffect(() => {
    if (!editingUser) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingUser, onClose])

  if (!editingUser) return null

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 bg-black/80 light:bg-white/85 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        >
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <div className="flex items-center gap-2">
              <Edit className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-white light:text-zinc-900">
                {editingUser.isNew ? 'Create New Candidate Profile' : `Edit Candidate Profile — ${editingUser.name || editingUser.user_id}`}
              </h3>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              aria-label="Close profile editor"
              className="text-slate-400 hover:text-white light:hover:text-zinc-900 p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer z-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            <CandidateProfileEditor
              userId={editingUser.user_id}
              isNew={editingUser.isNew}
              isAdmin={true}
              onSaveSuccess={() => {
                onSaveSuccess()
                onClose()
              }}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
