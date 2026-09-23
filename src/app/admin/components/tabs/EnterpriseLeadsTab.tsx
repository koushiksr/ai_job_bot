'use client'

import React from 'react'
import {
  Building2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone
} from 'lucide-react'

interface EnterpriseLeadsTabProps {
  enterpriseLeads: any[]
  loadingLeads: boolean
  enterpriseLeadsCollapsed: boolean
  toggleEnterpriseLeadsTable: () => void
  fetchEnterpriseLeads: () => Promise<void>
  handleUpdateLeadStatus: (inquiryId: string, status: string) => Promise<void>
}

export default function EnterpriseLeadsTab({
  enterpriseLeads,
  loadingLeads,
  enterpriseLeadsCollapsed,
  toggleEnterpriseLeadsTable,
  fetchEnterpriseLeads,
  handleUpdateLeadStatus
}: EnterpriseLeadsTabProps) {
  return (
    <div className="space-y-4">
      <div
        onClick={toggleEnterpriseLeadsTable}
        className="p-4 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 flex items-center justify-between cursor-pointer select-none hover:bg-zinc-900/40 light:hover:bg-zinc-50 transition-colors group"
      >
        <div>
          <h3 className="text-sm font-bold text-white light:text-zinc-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Enterprise &amp; Bulk Candidate Licensing Inquiries</span>
            <span className="text-[10px] font-mono text-zinc-500 light:text-zinc-600 bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 px-2 py-0.5 rounded-full">
              {enterpriseLeads.length} leads
            </span>
          </h3>
          <p className="text-xs text-slate-400 light:text-zinc-600 mt-0.5">
            Direct inbound leads from staffing agencies, college placement cells, and enterprise cohorts.
          </p>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); fetchEnterpriseLeads() }}
            className="px-3 py-1.5 rounded-lg bg-slate-900 light:bg-zinc-100 hover:bg-slate-800 light:hover:bg-zinc-200 border border-slate-800 light:border-zinc-300 text-slate-300 light:text-zinc-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingLeads ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleEnterpriseLeadsTable() }}
            className="p-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 transition-colors cursor-pointer"
            title={enterpriseLeadsCollapsed ? 'Expand table' : 'Collapse table'}
          >
            {enterpriseLeadsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 overflow-hidden shadow-xl">
        {enterpriseLeadsCollapsed && (
          <div
            onClick={toggleEnterpriseLeadsTable}
            className="flex items-center justify-center gap-2 py-4 text-xs text-zinc-500 light:text-zinc-600 cursor-pointer hover:text-zinc-300 light:hover:text-zinc-900 hover:bg-zinc-900/30 light:hover:bg-zinc-100 transition-all select-none"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Table shrunk ({enterpriseLeads.length} leads hidden) · Click header card to expand</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        )}

        {!enterpriseLeadsCollapsed && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 light:text-zinc-700">
              <thead
                onClick={toggleEnterpriseLeadsTable}
                className="bg-slate-950 light:bg-zinc-100 text-slate-400 light:text-zinc-600 uppercase text-[10px] tracking-wider border-b border-slate-800 light:border-zinc-200 cursor-pointer group select-none"
                title="Click table head to shrink / expand"
              >
                <tr className="hover:bg-zinc-900/60 light:hover:bg-zinc-200/70 transition-colors">
                  <th className="py-3.5 px-4 flex items-center gap-1">
                    <span>Organization / Company</span>
                    <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-indigo-400" />
                  </th>
                  <th className="py-3.5 px-4">Contact Person</th>
                  <th className="py-3.5 px-4">Seats / Volume</th>
                  <th className="py-3.5 px-4">Phone / WhatsApp</th>
                  <th className="py-3.5 px-4">Notes / Requirements</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 light:divide-zinc-200">
                {loadingLeads ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 light:text-zinc-500">
                      <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-400" />
                      Loading enterprise inquiries...
                    </td>
                  </tr>
                ) : enterpriseLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 light:text-zinc-500">
                      No enterprise inquiries received yet. Inbound requests from /pricing will appear here.
                    </td>
                  </tr>
                ) : (
                  enterpriseLeads.map((lead, idx) => (
                    <tr key={lead.id || lead.inquiry_id || idx} className="hover:bg-slate-800/30 light:hover:bg-zinc-50 transition-colors">
                      <td className="py-4 px-4 font-bold text-white light:text-zinc-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate max-w-[160px]">{lead.company || lead.organization}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-white light:text-zinc-900">{lead.name}</div>
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Mail className="w-3 h-3" /> {lead.email}
                        </a>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          {lead.seats || lead.seat_count}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-200 light:text-zinc-800">
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone}`}
                            className="hover:text-cyan-400 flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-slate-500 light:text-zinc-500" />
                            {lead.phone}
                          </a>
                        ) : (
                          <span className="text-slate-500 light:text-zinc-500">N/A</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-400 light:text-zinc-600 max-w-xs truncate text-[11px]">
                        {lead.notes || 'No custom notes provided.'}
                      </td>
                      <td className="py-4 px-4 text-slate-400 light:text-zinc-600 text-[11px] font-mono">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <select
                          value={lead.status || 'new'}
                          onChange={(e) => handleUpdateLeadStatus(lead.inquiry_id || lead._id, e.target.value)}
                          className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border bg-slate-950 light:bg-white cursor-pointer focus:outline-none ${
                            lead.status === 'contacted'
                              ? 'border-blue-500/40 text-blue-400'
                              : lead.status === 'closed'
                              ? 'border-emerald-500/40 light:border-emerald-300 text-emerald-400 light:text-emerald-600'
                              : 'border-amber-500/40 light:border-amber-300 text-amber-400 light:text-amber-600'
                          }`}
                        >
                          <option value="new">NEW LEAD</option>
                          <option value="contacted">CONTACTED</option>
                          <option value="closed">CLOSED / ONBOARDED</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
