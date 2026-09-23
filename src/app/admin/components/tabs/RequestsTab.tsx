'use client'

import React from 'react'
import {
  MessageSquare,
  Clock,
  RefreshCw,
  CheckCircle2,
  Shield,
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  Trash2
} from 'lucide-react'
import { SupportTicket, TicketStats } from '../../types'

interface RequestsTabProps {
  ticketStats: TicketStats
  adminEmail: string
  onOpenHelp: () => void
  requestSearch: string
  setRequestSearch: (val: string) => void
  requestStatusFilter: string
  setRequestStatusFilter: (val: string) => void
  fetchSupportTickets: (status?: string, search?: string) => Promise<void>
  loadingTickets: boolean
  supportTickets: SupportTicket[]
  requestsTableCollapsed: boolean
  toggleRequestsTable: () => void
  ticketNotes: { [id: string]: string }
  setTicketNotes: React.Dispatch<React.SetStateAction<{ [id: string]: string }>>
  savingTicketId: string | null
  handleUpdateTicket: (ticketId: string, status?: string, notes?: string) => Promise<void>
  handleDeleteTicket: (ticketId: string) => Promise<void>
  formatTimestamp: (ts: any) => string
}

export default function RequestsTab({
  ticketStats,
  adminEmail,
  onOpenHelp,
  requestSearch,
  setRequestSearch,
  requestStatusFilter,
  setRequestStatusFilter,
  fetchSupportTickets,
  loadingTickets,
  supportTickets,
  requestsTableCollapsed,
  toggleRequestsTable,
  ticketNotes,
  setTicketNotes,
  savingTicketId,
  handleUpdateTicket,
  handleDeleteTicket,
  formatTimestamp
}: RequestsTabProps) {
  return (
    <div className="space-y-6">
      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 light:text-zinc-600">Total Queries</div>
            <div className="text-2xl font-extrabold text-white light:text-zinc-900 mt-1">{ticketStats.total}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 light:text-cyan-600">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-400 light:text-rose-600">Open / Pending</div>
            <div className="text-2xl font-extrabold text-rose-400 light:text-rose-600 mt-1">{ticketStats.open}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 light:text-rose-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 light:text-amber-600">In Progress</div>
            <div className="text-2xl font-extrabold text-amber-400 light:text-amber-600 mt-1">{ticketStats.in_progress}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 light:text-amber-600">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 light:text-emerald-600">Resolved / Closed</div>
            <div className="text-2xl font-extrabold text-emerald-400 light:text-emerald-600 mt-1">{ticketStats.resolved + ticketStats.closed}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 light:text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Admin Routing Banner */}
      <div className="p-4 rounded-2xl bg-zinc-950 light:bg-white border border-zinc-800/80 light:border-zinc-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 light:text-cyan-600 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-white light:text-zinc-900">Central Admin Inquiries Desk</div>
            <div className="text-[11px] text-zinc-400 light:text-zinc-600">
              Primary Super-Admin Email: <span className="font-mono text-teal-300 light:text-cyan-700 font-semibold">{adminEmail || 'technohmsit@gmail.com'}</span>. Candidate support questions, urgent issues, and profile inquiries arrive here for resolution.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenHelp}
          className="px-3 py-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <MessageSquare className="w-3 h-3 text-teal-400 light:text-cyan-600" />
          <span>Simulate / Log Query</span>
        </button>
      </div>

      {/* Search, Filter & Refresh Bar */}
      <div className="p-4 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-zinc-500 light:text-zinc-600 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search ticket ID, candidate name, email, subject..."
            value={requestSearch}
            onChange={e => {
              setRequestSearch(e.target.value)
              fetchSupportTickets(requestStatusFilter, e.target.value)
            }}
            className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs text-white light:text-zinc-900 placeholder-zinc-500 light:placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map(status => {
            const active = requestStatusFilter === status
            return (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setRequestStatusFilter(status)
                  fetchSupportTickets(status, requestSearch)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize cursor-pointer ${
                  active
                    ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 shadow-sm'
                    : 'bg-black light:bg-white text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 border border-zinc-800 light:border-zinc-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => fetchSupportTickets(requestStatusFilter, requestSearch)}
            className="p-2 rounded-lg bg-black light:bg-white hover:bg-zinc-900 light:hover:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 transition-colors ml-1 cursor-pointer"
            title="Refresh inquiries"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingTickets ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 overflow-hidden shadow-xl">
        <div 
          onClick={toggleRequestsTable}
          className="px-5 py-4 bg-zinc-950 light:bg-white hover:bg-zinc-900/60 border-b border-zinc-800 light:border-zinc-200 flex items-center justify-between cursor-pointer select-none transition-colors"
        >
          <div>
            <h4 className="text-sm font-bold text-white light:text-zinc-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-400 light:text-cyan-600" />
              <span>Candidate Inquiries &amp; Support Requests</span>
              <span className="text-[10px] font-mono text-zinc-400 light:text-zinc-600 bg-zinc-900 light:bg-zinc-100 px-2 py-0.5 rounded border border-zinc-800 light:border-zinc-200">
                {supportTickets.length} inquiries
              </span>
            </h4>
            <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
              User requests, error reports, and candidate inquiries submitted through the Help Desk.
            </p>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggleRequestsTable()
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              {requestsTableCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Expand</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        </div>

        {requestsTableCollapsed && (
          <div 
            onClick={toggleRequestsTable}
            className="px-5 py-3 bg-zinc-900/30 light:bg-zinc-100 hover:bg-zinc-900/60 border-t border-zinc-800 light:border-zinc-200 flex items-center justify-between text-xs text-zinc-400 light:text-zinc-600 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>Table shrunk (<strong>{supportTickets.length}</strong> inquiries hidden) &bull; Click anywhere on head to expand</span>
            </div>
            <span className="text-teal-400 light:text-cyan-600 font-semibold flex items-center gap-1">
              <span>Expand Table</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </span>
          </div>
        )}

        {!requestsTableCollapsed && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300 light:text-zinc-700">
              <thead 
                onClick={toggleRequestsTable}
                className="cursor-pointer group select-none"
                title="Click table head to shrink / expand"
              >
                <tr className="bg-black light:bg-white group-hover:bg-zinc-900/60 text-zinc-400 light:text-zinc-600 uppercase text-[10px] tracking-wider border-b border-zinc-800 light:border-zinc-200 transition-colors">
                  <th className="py-3.5 px-4 flex items-center gap-1">
                    <span>Ticket &amp; Priority</span>
                    <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-teal-400 transition-colors" />
                  </th>
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4">Category &amp; Message</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Admin Response / Note</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 light:divide-zinc-200/60">
                {loadingTickets ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-zinc-400 light:text-zinc-600">
                      <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-teal-400 light:text-cyan-600" />
                      Loading candidate requests &amp; queries...
                    </td>
                  </tr>
                ) : supportTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-zinc-500 light:text-zinc-600">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-zinc-400 light:text-zinc-600" />
                      No candidate requests found matching the current filters.
                    </td>
                  </tr>
                ) : (
                  supportTickets.map((t) => {
                    const noteValue = ticketNotes[t.ticket_id] !== undefined ? ticketNotes[t.ticket_id] : (t.admin_response || '')
                    const isSaving = savingTicketId === t.ticket_id
                    return (
                      <tr key={t.ticket_id || t._id} className="hover:bg-zinc-900/30 transition-colors align-top">
                        {/* Ticket & Priority */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono font-semibold text-white light:text-zinc-900 text-xs">{t.ticket_id}</div>
                          <div className="mt-1">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider ${
                              t.priority === 'urgent'
                                ? 'bg-rose-500/15 text-rose-400 light:text-rose-600 border border-rose-500/30'
                                : t.priority === 'high'
                                ? 'bg-amber-500/15 text-amber-400 light:text-amber-600 border border-amber-500/30 light:border-amber-300'
                                : 'bg-zinc-800 light:bg-zinc-200 text-zinc-300 light:text-zinc-700 border border-zinc-700 light:border-zinc-300'
                            }`}>
                              {t.priority || 'normal'}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500 light:text-zinc-600 mt-1">
                            {formatTimestamp(t.created_at)}
                          </div>
                        </td>

                        {/* Candidate Details */}
                        <td className="py-3.5 px-4 min-w-[180px]">
                          <div className="font-bold text-white light:text-zinc-900 text-xs">{t.name || 'Candidate'}</div>
                          {t.user_id && (
                            <div className="text-[10px] font-mono text-zinc-500 light:text-zinc-600">ID: {t.user_id}</div>
                          )}
                          <a
                            href={`mailto:${t.email}?subject=Re:%20[${t.ticket_id}]%20${encodeURIComponent(t.subject || 'Support Query')}`}
                            className="text-[11px] text-teal-400 light:text-cyan-600 hover:underline inline-flex items-center gap-1 mt-1 font-mono"
                          >
                            <Mail className="w-3 h-3" /> {t.email}
                          </a>
                        </td>

                        {/* Category & Message */}
                        <td className="py-3.5 px-4 max-w-sm">
                          <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 mb-1">
                            {t.category?.replace('_', ' ') || 'General'}
                          </span>
                          <div className="font-semibold text-white light:text-zinc-900 text-xs">{t.subject}</div>
                          <div className="text-[11px] text-zinc-400 light:text-zinc-600 mt-1 leading-relaxed bg-black/60 light:bg-white/85 p-2 rounded-lg border border-zinc-900 light:border-zinc-200">
                            {t.message}
                          </div>
                        </td>

                        {/* Status Selector */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <select
                            value={t.status || 'open'}
                            onChange={e => handleUpdateTicket(t.ticket_id, e.target.value)}
                            className={`text-xs rounded-lg px-2.5 py-1.5 font-medium border focus:outline-none cursor-pointer ${
                              t.status === 'open'
                                ? 'bg-rose-950/40 light:bg-rose-50 text-rose-300 light:text-rose-600 border-rose-800/60 light:border-rose-300'
                                : t.status === 'in_progress'
                                ? 'bg-amber-950/40 light:bg-amber-50 text-amber-300 light:text-amber-700 border-amber-800/60 light:border-amber-300'
                                : t.status === 'resolved'
                                ? 'bg-emerald-950/40 light:bg-emerald-50 text-emerald-300 light:text-emerald-700 border-emerald-800/60 light:border-emerald-300'
                                : 'bg-zinc-900 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 border-zinc-800 light:border-zinc-200'
                            }`}
                          >
                            <option value="open">Open / Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                          {t.resolved_at && (
                            <div className="text-[9px] font-mono text-emerald-400 light:text-emerald-600 mt-1">
                              Resolved: {formatTimestamp(t.resolved_at)}
                            </div>
                          )}
                        </td>

                        {/* Admin Response / Note */}
                        <td className="py-3.5 px-4 min-w-[240px] max-w-md">
                          <div className="space-y-1.5">
                            <textarea
                              rows={2}
                              placeholder="Type resolution reply or note for candidate..."
                              value={noteValue}
                              onChange={e => setTicketNotes({ ...ticketNotes, [t.ticket_id]: e.target.value })}
                              className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 rounded-lg p-2 text-xs text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none focus:border-zinc-500 font-mono transition-colors"
                            />
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => handleUpdateTicket(t.ticket_id, t.status, noteValue)}
                                disabled={isSaving}
                                className="px-2.5 py-1 rounded bg-zinc-800 light:bg-zinc-200 hover:bg-zinc-700 text-white light:text-zinc-900 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                              >
                                {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400 light:text-emerald-600" />}
                                <span>{isSaving ? 'Saving...' : 'Save Response'}</span>
                              </button>
                              {t.admin_response && (
                                <span className="text-[10px] text-emerald-400 light:text-emerald-600 flex items-center gap-1 font-mono">
                                  Responded
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`mailto:${t.email}?subject=Re:%20[${t.ticket_id}]%20${encodeURIComponent(t.subject || 'Support Query')}&body=${encodeURIComponent(
                                `Hi ${t.name || 'Candidate'},\n\nIn response to your query [${t.ticket_id}]:\n"${t.message}"\n\n${noteValue ? noteValue + '\n\n' : ''}Best regards,\nAdministrator (${adminEmail || 'technohmsit@gmail.com'})\nJobFlux AI Bot`
                              )}`}
                              className="p-1.5 rounded-lg bg-black light:bg-white hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 transition-colors inline-flex items-center cursor-pointer"
                              title="Reply via Email"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteTicket(t.ticket_id)}
                              className="p-1.5 rounded-lg bg-black light:bg-white hover:bg-rose-950/40 border border-zinc-800 light:border-zinc-200 hover:border-rose-900/60 text-zinc-400 light:text-zinc-600 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete Ticket"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
