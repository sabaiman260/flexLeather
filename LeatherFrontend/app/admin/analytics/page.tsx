'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from 'recharts'

export default function AdminAnalyticsPage() {
  const [daily, setDaily] = useState<any[]>([])
  const [monthly, setMonthly] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const d = await apiFetch('/api/v1/admin/dashboard/reports/sales?range=daily')
        const m = await apiFetch('/api/v1/admin/dashboard/reports/sales?range=monthly')
        setDaily(d?.data?.results || [])
        setMonthly(m?.data?.results || [])
      } catch {}
    }
    load()
  }, [])

  const ReportTable = ({ data }: { data: any[] }) => (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="text-left p-3">Date</th>
            <th className="text-right p-3">Orders</th>
            <th className="text-right p-3">Revenue</th>
            <th className="text-right p-3">Paid</th>
            <th className="text-right p-3">Pending</th>
            <th className="text-right p-3">Failed</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r._id} className="border-t border-border">
              <td className="p-3">{r._id}</td>
              <td className="p-3 text-right">{r.ordersCount}</td>
              <td className="p-3 text-right">PKR {Number(r.revenue || 0).toLocaleString()}</td>
              <td className="p-3 text-right">{r.paidCount}</td>
              <td className="p-3 text-right">{r.pendingCount}</td>
              <td className="p-3 text-right">{r.failedCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const chartConfig = {
    revenue: { label: 'Revenue', color: '#16a34a' },
    ordersCount: { label: 'Orders', color: '#2563eb' },
  }

  return (
    <div>
      <h2 className="text-2xl font-serif mb-4">Analytics</h2>
      <p className="text-sm opacity-70 mb-6">Sales and trends overview.</p>

      <Tabs defaultValue="daily" className="space-y-6">
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChartContainer config={chartConfig} className="bg-card border border-border rounded-lg">
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
            <ChartContainer config={chartConfig} className="bg-card border border-border rounded-lg">
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="ordersCount" fill="var(--color-ordersCount)" />
              </BarChart>
            </ChartContainer>
          </div>
          <ReportTable data={daily} />
        </TabsContent>
        <TabsContent value="monthly">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChartContainer config={chartConfig} className="bg-card border border-border rounded-lg">
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot />
              </LineChart>
            </ChartContainer>
            <ChartContainer config={chartConfig} className="bg-card border border-border rounded-lg">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="ordersCount" fill="var(--color-ordersCount)" />
              </BarChart>
            </ChartContainer>
          </div>
          <ReportTable data={monthly} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
