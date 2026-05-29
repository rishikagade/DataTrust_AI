const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL as string | undefined
const BACKEND_URL = (configuredBackendUrl || (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/$/, '')

const demoDatasets = [
  { name: 'customer_master', label: 'Customer master', description: 'Duplicate keys, missing emails, category variants.' },
  { name: 'sales_transactions', label: 'Sales transactions', description: 'Mixed dates, negative totals, shipping inversions.' },
  { name: 'hr_employees', label: 'HR employees', description: 'Sparse termination dates, salary outliers, ID conflicts.' },
]

async function request(path: string, options?: RequestInit) {
  if (!BACKEND_URL) {
    throw new Error('Backend URL is not configured for this deployment.')
  }
  return fetch(`${BACKEND_URL}${path}`, options)
}

async function loadBundledDemo(name: string) {
  const res = await fetch(`/demo-audits/${encodeURIComponent(name)}.json`)
  if (!res.ok) throw new Error('Bundled demo is not available.')
  return res.json()
}

function localAgentReply(message: string, auditContext: any) {
  const score = auditContext?.scoring?.overall_score ?? 'N/A'
  const findings = [...(auditContext?.rule_results ?? [])].sort((a: any, b: any) => {
    const rank: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
    return (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9)
  })
  const topFinding = findings[0]
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('fix') || lowerMessage.includes('priority') || lowerMessage.includes('first')) {
    return topFinding
      ? `Start with ${topFinding.rule_name} in ${(topFinding.affected_columns ?? []).join(', ') || 'the dataset'}. It affects ${topFinding.affected_count ?? 'some'} rows and is marked ${topFinding.severity}. Suggested fix: ${topFinding.suggested_fix}`
      : `This demo audit scored ${score}/100 and did not return prioritized findings.`
  }

  return topFinding
    ? `This audit scored ${score}/100. The highest-priority finding is ${topFinding.rule_name}, affecting ${(topFinding.affected_columns ?? []).join(', ') || 'the dataset'} with ${topFinding.severity} severity.`
    : `This audit scored ${score}/100. I can summarize the bundled demo locally, but configure VITE_BACKEND_URL to enable the live backend agent.`
}

export const api = {
  audit: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const res = await request('/audit', { method: 'POST', body: form })
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(txt || res.statusText)
    }
    return res.json()
  },
  getAuditById: async (auditId: string) => {
    const bundledDemoName = auditId.startsWith('demo-') ? auditId.replace(/^demo-/, '') : ''
    if (!BACKEND_URL && bundledDemoName) return loadBundledDemo(bundledDemoName)

    const res = await request(`/audit/${encodeURIComponent(auditId)}`)
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(txt || res.statusText)
    }
    return res.json()
  },
  demoList: async () => {
    if (!BACKEND_URL) return demoDatasets

    const res = await request('/demo')
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  demo: async (name: string) => {
    if (!BACKEND_URL) return loadBundledDemo(name)

    try {
      const res = await request(`/demo/${encodeURIComponent(name)}`)
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    } catch (error) {
      if (import.meta.env.PROD) return loadBundledDemo(name)
      throw error
    }
  },
  auditChat: async (auditId: string, question: string) => {
    const res = await request(`/audit/${encodeURIComponent(auditId)}/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || res.statusText)
    }
    return res.json()
  },
  agentMessage: async (message: string, auditContext: any, conversationHistory: any[] = []) => {
    if (!BACKEND_URL) {
      return { reply: localAgentReply(message, auditContext), provider: 'local' }
    }

    const res = await request('/agent/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, audit_context: auditContext, conversation_history: conversationHistory }),
    })
    if (!res.ok) throw new Error('Unable to reach the audit agent.')
    return res.json()
  },
  pdfReport: async (audit: any) => {
    const res = await request('/report/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(audit),
    })
    if (!res.ok) throw new Error('Unable to generate the PDF report.')
    return res.blob()
  }
}
