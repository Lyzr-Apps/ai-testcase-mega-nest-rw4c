'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VscBeaker, VscGitMerge, VscCode, VscTerminal, VscDebugAlt, VscRocket, VscRepo, VscWarning, VscFolderOpened, VscSymbolMisc, VscFileCode } from 'react-icons/vsc'
import { FiCopy, FiDownload, FiCheck, FiLoader, FiAlertTriangle, FiRefreshCw, FiChevronRight, FiActivity, FiZap, FiGitBranch } from 'react-icons/fi'

const MANAGER_AGENT_ID = '69917fc4c30574dfe0950003'

// -- Monokai color constants --
const MONO = {
  bg: '#1e1f1c',
  bgDark: '#191a17',
  bgCard: '#272822',
  bgCodeBlock: '#1a1b18',
  fg: '#f8f8f2',
  fgMuted: '#75715e',
  yellow: '#e6db74',
  yellowBright: '#f4e96c',
  green: '#a6e22e',
  pink: '#f92672',
  cyan: '#66d9ef',
  purple: '#ae81ff',
  orange: '#fd971f',
  border: '#3e3d32',
  borderLight: '#49483e',
  muted: '#49483e',
}

// -- TypeScript interfaces --
interface TestSection {
  title: string
  test_count: string
  code: string
  summary: string
}

interface RepositoryInfo {
  name: string
  languages: string
  structure_summary: string
}

interface ManagerResponse {
  repository_info: RepositoryInfo
  unit_tests: TestSection
  integration_tests: TestSection
  e2e_tests: TestSection
  edge_case_tests: TestSection
  performance_tests: TestSection
  overall_summary: string
}

interface TestTypeConfig {
  key: string
  label: string
  dataKey: keyof ManagerResponse
  icon: React.ReactNode
  color: string
}

const TEST_TYPES: TestTypeConfig[] = [
  { key: 'unit', label: 'Unit Tests', dataKey: 'unit_tests', icon: <VscBeaker size={14} />, color: MONO.green },
  { key: 'integration', label: 'Integration', dataKey: 'integration_tests', icon: <VscGitMerge size={14} />, color: MONO.cyan },
  { key: 'e2e', label: 'E2E Tests', dataKey: 'e2e_tests', icon: <VscTerminal size={14} />, color: MONO.yellow },
  { key: 'edgeCase', label: 'Edge Cases', dataKey: 'edge_case_tests', icon: <VscDebugAlt size={14} />, color: MONO.pink },
  { key: 'performance', label: 'Performance', dataKey: 'performance_tests', icon: <VscRocket size={14} />, color: MONO.purple },
]

// -- Sample data for demo mode --
const SAMPLE_RESULTS: ManagerResponse = {
  repository_info: {
    name: 'acme/payment-service',
    languages: 'TypeScript, JavaScript',
    structure_summary: 'A Node.js payment processing service with Express.js API, Stripe integration, webhook handlers, and PostgreSQL database layer. Key modules: auth, payments, webhooks, db.',
  },
  unit_tests: {
    title: 'Unit Tests - Payment Service',
    test_count: '12',
    code: `import { describe, it, expect, jest } from '@jest/globals'
import { PaymentProcessor } from '../src/payments/processor'
import { validateCard } from '../src/payments/validation'

describe('PaymentProcessor', () => {
  it('should process a valid payment', async () => {
    const processor = new PaymentProcessor()
    const result = await processor.charge({
      amount: 1000,
      currency: 'usd',
      source: 'tok_visa',
    })
    expect(result.status).toBe('succeeded')
    expect(result.amount).toBe(1000)
  })

  it('should reject negative amounts', async () => {
    const processor = new PaymentProcessor()
    await expect(
      processor.charge({ amount: -100, currency: 'usd', source: 'tok_visa' })
    ).rejects.toThrow('Invalid amount')
  })

  it('should handle currency conversion', () => {
    const result = PaymentProcessor.convertCurrency(1000, 'usd', 'eur')
    expect(result).toBeGreaterThan(0)
    expect(typeof result).toBe('number')
  })
})

describe('validateCard', () => {
  it('should validate a correct card number', () => {
    expect(validateCard('4242424242424242')).toBe(true)
  })

  it('should reject an invalid card number', () => {
    expect(validateCard('1234567890123456')).toBe(false)
  })
})`,
    summary: 'Covers payment processing, validation, and currency conversion with 12 test cases across 2 describe blocks.',
  },
  integration_tests: {
    title: 'Integration Tests - API Endpoints',
    test_count: '8',
    code: `import request from 'supertest'
import { app } from '../src/app'
import { db } from '../src/db'

beforeAll(async () => { await db.connect() })
afterAll(async () => { await db.disconnect() })

describe('POST /api/payments', () => {
  it('should create a payment intent', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({ amount: 2000, currency: 'usd' })
      .set('Authorization', 'Bearer test_token')
    expect(res.status).toBe(201)
    expect(res.body.id).toBeDefined()
  })

  it('should return 401 without auth', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({ amount: 2000, currency: 'usd' })
    expect(res.status).toBe(401)
  })
})`,
    summary: 'Tests API endpoints with database integration, authentication flows, and error responses.',
  },
  e2e_tests: {
    title: 'E2E Tests - Payment Flow',
    test_count: '5',
    code: `import { test, expect } from '@playwright/test'

test('complete payment flow', async ({ page }) => {
  await page.goto('/checkout')
  await page.fill('#card-number', '4242424242424242')
  await page.fill('#expiry', '12/25')
  await page.fill('#cvc', '123')
  await page.click('#pay-button')
  await expect(page.locator('.success-message')).toBeVisible()
})

test('handles declined card', async ({ page }) => {
  await page.goto('/checkout')
  await page.fill('#card-number', '4000000000000002')
  await page.fill('#expiry', '12/25')
  await page.fill('#cvc', '123')
  await page.click('#pay-button')
  await expect(page.locator('.error-message')).toContainText('declined')
})`,
    summary: 'End-to-end tests covering the complete payment flow from checkout to confirmation.',
  },
  edge_case_tests: {
    title: 'Edge Case Tests - Boundary Conditions',
    test_count: '7',
    code: `describe('Edge Cases', () => {
  it('should handle zero amount', async () => {
    await expect(processor.charge({ amount: 0 }))
      .rejects.toThrow('Amount must be positive')
  })

  it('should handle maximum amount', async () => {
    const result = await processor.charge({ amount: 99999999 })
    expect(result.status).toBe('succeeded')
  })

  it('should handle concurrent requests', async () => {
    const promises = Array(100).fill(null).map(() =>
      processor.charge({ amount: 100, currency: 'usd' })
    )
    const results = await Promise.all(promises)
    results.forEach(r => expect(r.status).toBe('succeeded'))
  })

  it('should handle special characters in metadata', async () => {
    const result = await processor.charge({
      amount: 100,
      metadata: { note: 'Test <script>alert("xss")</script>' }
    })
    expect(result.metadata.note).not.toContain('<script>')
  })
})`,
    summary: 'Tests boundary conditions, concurrency, XSS prevention, and extreme input values.',
  },
  performance_tests: {
    title: 'Performance Tests - Load & Latency',
    test_count: '4',
    code: `describe('Performance', () => {
  it('should process payment under 500ms', async () => {
    const start = performance.now()
    await processor.charge({ amount: 1000, currency: 'usd' })
    const duration = performance.now() - start
    expect(duration).toBeLessThan(500)
  })

  it('should handle 50 concurrent requests under 2s', async () => {
    const start = performance.now()
    const promises = Array(50).fill(null).map(() =>
      processor.charge({ amount: 100 })
    )
    await Promise.all(promises)
    const duration = performance.now() - start
    expect(duration).toBeLessThan(2000)
  })
})`,
    summary: 'Validates response times and throughput under load conditions.',
  },
  overall_summary: 'Generated 36 comprehensive test cases across 5 categories for the acme/payment-service repository. Tests cover unit logic, API integration, end-to-end flows, edge cases, and performance benchmarks. The test suite provides strong coverage of payment processing, validation, authentication, and error handling.',
}

// -- Markdown renderer --
function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold" style={{ color: MONO.yellow }}>
        {part}
      </strong>
    ) : (
      part
    )
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return (
            <h4 key={i} className="font-semibold text-sm mt-3 mb-1" style={{ color: MONO.cyan }}>
              {line.slice(4)}
            </h4>
          )
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="font-semibold text-base mt-3 mb-1" style={{ color: MONO.cyan }}>
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('# '))
          return (
            <h2 key={i} className="font-bold text-lg mt-4 mb-2" style={{ color: MONO.yellow }}>
              {line.slice(2)}
            </h2>
          )
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} className="ml-4 list-disc text-sm" style={{ color: MONO.fg }}>
              {formatInline(line.slice(2))}
            </li>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-sm" style={{ color: MONO.fg }}>
              {formatInline(line.replace(/^\d+\.\s/, ''))}
            </li>
          )
        if (!line.trim()) return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm" style={{ color: MONO.fg }}>
            {formatInline(line)}
          </p>
        )
      })}
    </div>
  )
}

// -- Code block with copy button --
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  if (!code) return null

  return (
    <div className="relative group" style={{ borderRadius: 0 }}>
      <div className="flex items-center justify-between px-4 py-2" style={{ background: MONO.border, borderBottom: `1px solid ${MONO.borderLight}` }}>
        <span className="text-xs font-mono" style={{ color: MONO.fgMuted }}>
          {language ?? 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono transition-colors"
          style={{ color: copied ? MONO.green : MONO.fgMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <ScrollArea className="w-full" style={{ maxHeight: '400px' }}>
        <pre className="p-4 overflow-x-auto font-mono text-sm leading-relaxed" style={{ background: MONO.bgCodeBlock, color: MONO.fg, margin: 0, borderRadius: 0 }}>
          <code>{code}</code>
        </pre>
      </ScrollArea>
    </div>
  )
}

// -- Status animation dots --
function LoadingDots() {
  return (
    <span className="inline-flex gap-1 ml-2">
      <span className="animate-bounce inline-block w-1.5 h-1.5 rounded-full" style={{ background: MONO.yellow, animationDelay: '0ms' }} />
      <span className="animate-bounce inline-block w-1.5 h-1.5 rounded-full" style={{ background: MONO.green, animationDelay: '150ms' }} />
      <span className="animate-bounce inline-block w-1.5 h-1.5 rounded-full" style={{ background: MONO.pink, animationDelay: '300ms' }} />
    </span>
  )
}

// -- Generation status messages --
const STATUS_MESSAGES = [
  'Connecting to repository...',
  'Analyzing repository structure...',
  'Scanning source files...',
  'Identifying test targets...',
  'Generating unit tests...',
  'Generating integration tests...',
  'Generating E2E tests...',
  'Generating edge case tests...',
  'Generating performance tests...',
  'Compiling test suite...',
]

// -- Agent info card --
function AgentInfoPanel({ activeAgentId, isGenerating }: { activeAgentId: string | null; isGenerating: boolean }) {
  return (
    <div className="p-4" style={{ background: MONO.bgCard, border: `1px solid ${MONO.border}` }}>
      <div className="flex items-center gap-2 mb-3">
        <VscSymbolMisc size={14} style={{ color: MONO.purple }} />
        <span className="text-xs font-mono font-semibold tracking-wider uppercase" style={{ color: MONO.fgMuted }}>
          Agent Pipeline
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: isGenerating && activeAgentId === MANAGER_AGENT_ID ? MONO.green : MONO.muted }} />
          <span className="text-xs font-mono" style={{ color: MONO.fg }}>Test Generation Manager</span>
          <span className="text-xs font-mono ml-auto" style={{ color: MONO.fgMuted }}>coordinator</span>
        </div>
        {['Unit Test Agent', 'Integration Test Agent', 'E2E Test Agent', 'Edge Case Agent', 'Performance Agent'].map((name, idx) => (
          <div key={idx} className="flex items-center gap-2 ml-4">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: isGenerating ? MONO.yellow : MONO.muted }} />
            <span className="text-xs font-mono" style={{ color: MONO.fgMuted }}>{name}</span>
            <span className="text-xs font-mono ml-auto" style={{ color: MONO.border }}>sub-agent</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// -- Test result tab panel --
function TestResultPanel({ section, testType }: { section: TestSection | undefined; testType: TestTypeConfig }) {
  if (!section) {
    return (
      <div className="p-8 text-center" style={{ color: MONO.fgMuted }}>
        <VscWarning size={24} className="mx-auto mb-2" />
        <p className="text-sm font-mono">No results available for {testType.label}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span style={{ color: testType.color }}>{testType.icon}</span>
          <h3 className="text-sm font-mono font-semibold" style={{ color: MONO.fg }}>
            {section?.title ?? testType.label}
          </h3>
        </div>
        <Badge className="rounded-none font-mono text-xs" style={{ background: testType.color, color: MONO.bgDark, border: 'none', borderRadius: 0 }}>
          {section?.test_count ?? '0'} tests
        </Badge>
      </div>

      {section?.summary && (
        <div className="p-3" style={{ background: MONO.bgDark, border: `1px solid ${MONO.border}` }}>
          {renderMarkdown(section.summary)}
        </div>
      )}

      {section?.code && (
        <CodeBlock code={section.code} language="typescript" />
      )}
    </div>
  )
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function Page() {
  // -- Core state --
  const [repoUrl, setRepoUrl] = useState('')
  const [branch, setBranch] = useState('main')
  const [isConnected, setIsConnected] = useState(false)
  const [priorities, setPriorities] = useState('')
  const [selectedTests, setSelectedTests] = useState<Record<string, boolean>>({
    unit: true,
    integration: true,
    e2e: true,
    edgeCase: true,
    performance: true,
  })
  const [framework, setFramework] = useState('auto')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState('')
  const [activeTab, setActiveTab] = useState('unit')
  const [results, setResults] = useState<ManagerResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [showSample, setShowSample] = useState(false)
  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Derived data: either sample or real results
  const displayResults = showSample ? SAMPLE_RESULTS : results

  // Determine which tabs are visible based on selection
  const visibleTabs = TEST_TYPES.filter((t) => selectedTests[t.key])

  // Ensure activeTab is valid
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.find((t) => t.key === activeTab)) {
      setActiveTab(visibleTabs[0].key)
    }
  }, [selectedTests, activeTab, visibleTabs])

  // Populate sample data into form fields
  useEffect(() => {
    if (showSample && !results) {
      setRepoUrl('acme/payment-service')
      setBranch('main')
      setIsConnected(true)
      setPriorities('Focus on payment processing module, API endpoint security, and Stripe integration error handling')
    }
  }, [showSample, results])

  // Validate repo format
  const isValidRepo = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(repoUrl.trim())

  const handleConnect = useCallback(() => {
    if (isValidRepo) {
      setIsConnected(true)
      setError(null)
    }
  }, [isValidRepo])

  const handleDisconnect = useCallback(() => {
    setIsConnected(false)
    setResults(null)
    setError(null)
  }, [])

  // Toggle individual test type
  const toggleTest = useCallback((key: string) => {
    setSelectedTests((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  // Toggle all test types
  const toggleAll = useCallback(() => {
    const allSelected = Object.values(selectedTests).every(Boolean)
    const newVal = !allSelected
    setSelectedTests({
      unit: newVal,
      integration: newVal,
      e2e: newVal,
      edgeCase: newVal,
      performance: newVal,
    })
  }, [selectedTests])

  const atLeastOneSelected = Object.values(selectedTests).some(Boolean)
  const allSelected = Object.values(selectedTests).every(Boolean)
  const canGenerate = isConnected && atLeastOneSelected && !isGenerating

  // Start rotating status messages during generation
  const startStatusRotation = useCallback(() => {
    let idx = 0
    setGenerationStatus(STATUS_MESSAGES[0])
    statusIntervalRef.current = setInterval(() => {
      idx = (idx + 1) % STATUS_MESSAGES.length
      setGenerationStatus(STATUS_MESSAGES[idx])
    }, 3000)
  }, [])

  const stopStatusRotation = useCallback(() => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current)
      statusIntervalRef.current = null
    }
    setGenerationStatus('')
  }, [])

  // Generate tests
  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return

    setIsGenerating(true)
    setError(null)
    setResults(null)
    setActiveAgentId(MANAGER_AGENT_ID)
    startStatusRotation()

    const selectedNames = Object.entries(selectedTests)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(', ')

    const message = `Analyze the GitHub repository "${repoUrl}" (branch: ${branch}) and generate comprehensive test cases.

Testing Priorities: ${priorities || 'No specific priorities - generate tests for all major components'}

Test Types Requested: ${selectedNames}

Framework Preference: ${framework}

Please analyze the repository structure, identify key components, and generate thorough test cases for each requested test type.`

    try {
      const result = await callAIAgent(message, MANAGER_AGENT_ID)

      if (result.success && result?.response?.result) {
        let parsed: ManagerResponse | null = null
        const rawResult = result.response.result

        if (typeof rawResult === 'string') {
          try {
            parsed = JSON.parse(rawResult)
          } catch {
            const jsonMatch = rawResult.match(/```(?:json)?\s*([\s\S]*?)```/)
            if (jsonMatch) {
              try {
                parsed = JSON.parse(jsonMatch[1].trim())
              } catch {
                parsed = null
              }
            }
          }
        } else if (typeof rawResult === 'object') {
          parsed = rawResult as ManagerResponse
        }

        if (parsed) {
          setResults(parsed)
          setShowSample(false)
          // Set active tab to first available result
          const firstTab = TEST_TYPES.find((t) => selectedTests[t.key] && (parsed as ManagerResponse)?.[t.dataKey])
          if (firstTab) {
            setActiveTab(firstTab.key)
          }
        } else {
          setError('Failed to parse test generation results. The agent returned an unexpected format.')
        }
      } else {
        setError(result?.error ?? result?.response?.message ?? 'Test generation failed. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsGenerating(false)
      setActiveAgentId(null)
      stopStatusRotation()
    }
  }, [canGenerate, repoUrl, branch, priorities, selectedTests, framework, startStatusRotation, stopStatusRotation])

  // Export all tests
  const exportAllTests = useCallback(() => {
    const data = displayResults
    if (!data) return
    let content = '// Generated Test Suite\n// Repository: ' + (data?.repository_info?.name ?? repoUrl) + '\n\n'
    const sections: { key: string; data: TestSection | undefined }[] = [
      { key: 'unit_tests', data: data?.unit_tests },
      { key: 'integration_tests', data: data?.integration_tests },
      { key: 'e2e_tests', data: data?.e2e_tests },
      { key: 'edge_case_tests', data: data?.edge_case_tests },
      { key: 'performance_tests', data: data?.performance_tests },
    ]
    sections.forEach((s) => {
      if (s.data?.code) {
        content += `\n// ==========================================\n`
        content += `// ${s.data?.title ?? s.key}\n`
        content += `// ==========================================\n\n`
        content += s.data.code + '\n\n'
      }
    })
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const repoName = data?.repository_info?.name ?? repoUrl
    a.download = `test-suite-${repoName.replace(/\//g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [displayResults, repoUrl])

  // Compute total test count
  const totalTests = (() => {
    if (!displayResults) return 0
    let total = 0
    const sections = [displayResults.unit_tests, displayResults.integration_tests, displayResults.e2e_tests, displayResults.edge_case_tests, displayResults.performance_tests]
    sections.forEach((s) => {
      const count = parseInt(s?.test_count ?? '0', 10)
      if (!isNaN(count)) total += count
    })
    return total
  })()

  return (
    <div className="min-h-screen" style={{ background: MONO.bg, color: MONO.fg }}>
      {/* Header */}
      <header className="sticky top-0 z-30" style={{ background: MONO.bgDark, borderBottom: `1px solid ${MONO.border}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-1.5" style={{ background: MONO.yellow, color: MONO.bgDark }}>
              <VscBeaker size={18} />
            </div>
            <div>
              <h1 className="text-base font-mono font-bold tracking-tight" style={{ color: MONO.fg }}>
                GitHub Test Case Generator
              </h1>
              <p className="text-xs font-mono" style={{ color: MONO.fgMuted }}>
                AI-powered test suite generation from repository analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isConnected && (
              <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: MONO.bgCard, border: `1px solid ${MONO.border}` }}>
                <div className="w-2 h-2 rounded-full" style={{ background: MONO.green }} />
                <VscRepo size={12} style={{ color: MONO.green }} />
                <span className="text-xs font-mono" style={{ color: MONO.green }}>{repoUrl}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Label htmlFor="sample-toggle" className="text-xs font-mono cursor-pointer" style={{ color: MONO.fgMuted }}>
                Sample Data
              </Label>
              <Switch
                id="sample-toggle"
                checked={showSample}
                onCheckedChange={setShowSample}
                className="rounded-none"
                style={{ borderRadius: 0 }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ============================================================ */}
          {/* LEFT PANEL - Configuration */}
          {/* ============================================================ */}
          <div className="lg:col-span-4 space-y-4">
            {/* Repository Configuration */}
            <div style={{ background: MONO.bgCard, border: `1px solid ${MONO.border}` }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${MONO.border}` }}>
                <VscRepo size={14} style={{ color: MONO.yellow }} />
                <span className="text-xs font-mono font-semibold tracking-wider uppercase" style={{ color: MONO.fgMuted }}>
                  Repository
                </span>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-mono mb-1.5" style={{ color: MONO.fgMuted }}>
                    GitHub Repository
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={repoUrl}
                      onChange={(e) => {
                        setRepoUrl(e.target.value)
                        if (isConnected) setIsConnected(false)
                      }}
                      placeholder="owner/repository"
                      className="flex-1 font-mono text-sm rounded-none"
                      style={{ background: MONO.bgDark, color: MONO.fg, border: `1px solid ${MONO.border}`, borderRadius: 0 }}
                      disabled={isGenerating}
                    />
                    {!isConnected ? (
                      <Button
                        onClick={handleConnect}
                        disabled={!isValidRepo || isGenerating}
                        className="font-mono text-xs rounded-none px-4"
                        style={{ background: isValidRepo ? MONO.green : MONO.muted, color: MONO.bgDark, border: 'none', borderRadius: 0, opacity: isValidRepo && !isGenerating ? 1 : 0.5 }}
                      >
                        Connect
                      </Button>
                    ) : (
                      <Button
                        onClick={handleDisconnect}
                        disabled={isGenerating}
                        className="font-mono text-xs rounded-none px-3"
                        style={{ background: 'transparent', color: MONO.pink, border: `1px solid ${MONO.pink}`, borderRadius: 0 }}
                      >
                        Disconnect
                      </Button>
                    )}
                  </div>
                  {repoUrl && !isValidRepo && (
                    <p className="text-xs font-mono mt-1" style={{ color: MONO.orange }}>
                      Format: owner/repository
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono mb-1.5" style={{ color: MONO.fgMuted }}>
                    Branch
                  </label>
                  <div className="flex items-center gap-2">
                    <FiGitBranch size={14} style={{ color: MONO.cyan }} />
                    <Input
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="main"
                      className="font-mono text-sm rounded-none"
                      style={{ background: MONO.bgDark, color: MONO.fg, border: `1px solid ${MONO.border}`, borderRadius: 0 }}
                      disabled={isGenerating}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Testing Configuration */}
            <div style={{ background: MONO.bgCard, border: `1px solid ${MONO.border}` }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${MONO.border}` }}>
                <VscCode size={14} style={{ color: MONO.cyan }} />
                <span className="text-xs font-mono font-semibold tracking-wider uppercase" style={{ color: MONO.fgMuted }}>
                  Test Configuration
                </span>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-mono mb-1.5" style={{ color: MONO.fgMuted }}>
                    Testing Priorities
                  </label>
                  <Textarea
                    value={priorities}
                    onChange={(e) => setPriorities(e.target.value)}
                    placeholder="Describe your testing priorities... e.g., Focus on payment module, API endpoints are critical"
                    className="font-mono text-sm rounded-none resize-none"
                    rows={3}
                    style={{ background: MONO.bgDark, color: MONO.fg, border: `1px solid ${MONO.border}`, borderRadius: 0 }}
                    disabled={isGenerating}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-mono" style={{ color: MONO.fgMuted }}>
                      Test Types
                    </label>
                    <button
                      onClick={toggleAll}
                      className="text-xs font-mono transition-colors"
                      style={{ color: allSelected ? MONO.pink : MONO.cyan, background: 'transparent', border: 'none', cursor: 'pointer' }}
                      disabled={isGenerating}
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {TEST_TYPES.map((t) => (
                      <label
                        key={t.key}
                        className="flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors"
                        style={{ background: selectedTests[t.key] ? MONO.bgDark : 'transparent', border: `1px solid ${selectedTests[t.key] ? MONO.border : 'transparent'}` }}
                      >
                        <Checkbox
                          checked={selectedTests[t.key]}
                          onCheckedChange={() => toggleTest(t.key)}
                          className="rounded-none"
                          style={{ borderRadius: 0 }}
                          disabled={isGenerating}
                        />
                        <span style={{ color: t.color }}>{t.icon}</span>
                        <span className="text-xs font-mono" style={{ color: MONO.fg }}>
                          {t.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono mb-1.5" style={{ color: MONO.fgMuted }}>
                    Framework Preference
                  </label>
                  <Select value={framework} onValueChange={setFramework} disabled={isGenerating}>
                    <SelectTrigger className="font-mono text-sm rounded-none" style={{ background: MONO.bgDark, color: MONO.fg, border: `1px solid ${MONO.border}`, borderRadius: 0 }}>
                      <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none font-mono" style={{ background: MONO.bgCard, color: MONO.fg, border: `1px solid ${MONO.border}`, borderRadius: 0 }}>
                      <SelectItem value="auto" className="rounded-none font-mono text-sm">Auto-detect</SelectItem>
                      <SelectItem value="jest" className="rounded-none font-mono text-sm">Jest</SelectItem>
                      <SelectItem value="pytest" className="rounded-none font-mono text-sm">Pytest</SelectItem>
                      <SelectItem value="mocha" className="rounded-none font-mono text-sm">Mocha</SelectItem>
                      <SelectItem value="cypress" className="rounded-none font-mono text-sm">Cypress</SelectItem>
                      <SelectItem value="playwright" className="rounded-none font-mono text-sm">Playwright</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full py-3 px-4 font-mono text-sm font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2"
              style={{
                background: canGenerate ? MONO.yellow : MONO.muted,
                color: MONO.bgDark,
                border: 'none',
                cursor: canGenerate ? 'pointer' : 'not-allowed',
                opacity: canGenerate ? 1 : 0.5,
              }}
            >
              {isGenerating ? (
                <>
                  <FiLoader size={14} className="animate-spin" />
                  Generating Tests
                  <LoadingDots />
                </>
              ) : (
                <>
                  <FiZap size={14} />
                  Generate Tests
                </>
              )}
            </button>

            {/* Generation status */}
            {isGenerating && generationStatus && (
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: MONO.bgCard, border: `1px solid ${MONO.border}` }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: MONO.yellow }} />
                <span className="text-xs font-mono" style={{ color: MONO.yellow }}>
                  {generationStatus}
                </span>
              </div>
            )}

            {/* Agent Info */}
            <AgentInfoPanel activeAgentId={activeAgentId} isGenerating={isGenerating} />
          </div>

          {/* ============================================================ */}
          {/* RIGHT PANEL - Results */}
          {/* ============================================================ */}
          <div className="lg:col-span-8">
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 flex items-start gap-3" style={{ background: MONO.bgCard, border: `1px solid ${MONO.pink}` }}>
                <FiAlertTriangle size={16} style={{ color: MONO.pink, flexShrink: 0, marginTop: 2 }} />
                <div className="flex-1">
                  <p className="text-sm font-mono font-semibold" style={{ color: MONO.pink }}>Generation Failed</p>
                  <p className="text-xs font-mono mt-1" style={{ color: MONO.fg }}>{error}</p>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono transition-colors"
                  style={{ background: MONO.pink, color: MONO.fg, border: 'none', cursor: canGenerate ? 'pointer' : 'not-allowed' }}
                >
                  <FiRefreshCw size={12} />
                  Retry
                </button>
              </div>
            )}

            {/* No results state */}
            {!displayResults && !isGenerating && !error && (
              <div className="flex flex-col items-center justify-center py-20 px-6" style={{ background: MONO.bgCard, border: `1px solid ${MONO.border}` }}>
                <VscFileCode size={48} style={{ color: MONO.border }} />
                <h2 className="text-base font-mono font-semibold mt-4" style={{ color: MONO.fg }}>
                  No Tests Generated Yet
                </h2>
                <p className="text-xs font-mono mt-2 text-center max-w-md" style={{ color: MONO.fgMuted }}>
                  Connect a GitHub repository, configure your test preferences, and click &quot;Generate Tests&quot; to create a comprehensive test suite powered by AI analysis.
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <FiChevronRight size={12} style={{ color: MONO.yellow }} />
                  <span className="text-xs font-mono" style={{ color: MONO.yellow }}>
                    Enable &quot;Sample Data&quot; to preview the interface
                  </span>
                </div>
              </div>
            )}

            {/* Generating state */}
            {isGenerating && !displayResults && (
              <div className="flex flex-col items-center justify-center py-20 px-6" style={{ background: MONO.bgCard, border: `1px solid ${MONO.border}` }}>
                <FiLoader size={32} className="animate-spin" style={{ color: MONO.yellow }} />
                <h2 className="text-base font-mono font-semibold mt-4" style={{ color: MONO.fg }}>
                  Generating Test Suite
                </h2>
                <p className="text-xs font-mono mt-2" style={{ color: MONO.fgMuted }}>
                  {generationStatus || 'Analyzing repository...'}
                </p>
                <div className="w-full max-w-xs mt-6 h-1" style={{ background: MONO.border }}>
                  <div className="h-1 animate-pulse" style={{ background: MONO.yellow, width: '60%' }} />
                </div>
              </div>
            )}

            {/* Results */}
            {displayResults && (
              <div className="space-y-4">
                {/* Repository Info + Summary Header */}
                <div style={{ background: MONO.bgCard, border: `1px solid ${MONO.border}` }}>
                  <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: `1px solid ${MONO.border}` }}>
                    <div className="flex items-center gap-3">
                      <VscFolderOpened size={14} style={{ color: MONO.orange }} />
                      <span className="text-sm font-mono font-semibold" style={{ color: MONO.fg }}>
                        {displayResults?.repository_info?.name ?? repoUrl}
                      </span>
                      {displayResults?.repository_info?.languages && (
                        <Badge className="rounded-none font-mono text-xs" style={{ background: MONO.purple, color: MONO.fg, border: 'none', borderRadius: 0 }}>
                          {displayResults.repository_info.languages}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="rounded-none font-mono text-xs" style={{ background: MONO.green, color: MONO.bgDark, border: 'none', borderRadius: 0 }}>
                        <FiActivity size={10} className="mr-1" />
                        {totalTests} total tests
                      </Badge>
                      <button
                        onClick={exportAllTests}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono transition-colors"
                        style={{ background: MONO.cyan, color: MONO.bgDark, border: 'none', cursor: 'pointer' }}
                      >
                        <FiDownload size={12} />
                        Export All
                      </button>
                    </div>
                  </div>
                  {displayResults?.repository_info?.structure_summary && (
                    <div className="px-4 py-3">
                      <p className="text-xs font-mono" style={{ color: MONO.fgMuted }}>
                        {displayResults.repository_info.structure_summary}
                      </p>
                    </div>
                  )}
                </div>

                {/* Overall Summary */}
                {displayResults?.overall_summary && (
                  <div className="p-4" style={{ background: MONO.bgCard, border: `1px solid ${MONO.border}` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <VscSymbolMisc size={14} style={{ color: MONO.yellow }} />
                      <span className="text-xs font-mono font-semibold tracking-wider uppercase" style={{ color: MONO.fgMuted }}>
                        Overall Summary
                      </span>
                    </div>
                    {renderMarkdown(displayResults.overall_summary)}
                  </div>
                )}

                {/* Tabbed Results */}
                <div style={{ background: MONO.bgCard, border: `1px solid ${MONO.border}` }}>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="overflow-x-auto" style={{ borderBottom: `1px solid ${MONO.border}` }}>
                      <TabsList className="w-full justify-start rounded-none h-auto p-0" style={{ background: 'transparent', borderRadius: 0 }}>
                        {visibleTabs.map((t) => {
                          const section = displayResults?.[t.dataKey] as TestSection | undefined
                          return (
                            <TabsTrigger
                              key={t.key}
                              value={t.key}
                              className="rounded-none px-4 py-2.5 font-mono text-xs data-[state=active]:shadow-none relative"
                              style={{
                                background: activeTab === t.key ? MONO.bgCard : 'transparent',
                                color: activeTab === t.key ? t.color : MONO.fgMuted,
                                borderBottom: activeTab === t.key ? `2px solid ${t.color}` : '2px solid transparent',
                                borderRadius: 0,
                              }}
                            >
                              <span className="flex items-center gap-1.5">
                                {t.icon}
                                <span className="hidden sm:inline">{t.label}</span>
                                {section?.test_count && (
                                  <span className="ml-1 px-1.5 py-0.5 text-xs font-mono" style={{ background: `${t.color}22`, color: t.color, fontSize: '10px' }}>
                                    {section.test_count}
                                  </span>
                                )}
                              </span>
                            </TabsTrigger>
                          )
                        })}
                      </TabsList>
                    </div>
                    {visibleTabs.map((t) => (
                      <TabsContent key={t.key} value={t.key} className="mt-0 p-4">
                        <TestResultPanel
                          section={displayResults?.[t.dataKey] as TestSection | undefined}
                          testType={t}
                        />
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 py-4 px-4" style={{ borderTop: `1px solid ${MONO.border}` }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-xs font-mono" style={{ color: MONO.border }}>
            Powered by Lyzr AI Agent Pipeline
          </span>
          <span className="text-xs font-mono" style={{ color: MONO.border }}>
            5 sub-agents coordinated by Manager
          </span>
        </div>
      </footer>
    </div>
  )
}
