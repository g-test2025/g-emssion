import { T } from '@/components/language-provider';
import { CategoryPieChart, MonthlyTrendChart } from '@/components/dashboard-charts';
import { Card, PageHeader, StatusPill } from '@/components/ui';
import { calculateInventory, groupByDimension, rankHotspots, summarizeByScope } from '@/lib/calculation-engine';
import { getInventoryData } from '@/lib/data';

function format(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { activities, departments, emissionFactors, organization, sites, source } = await getInventoryData();
  const results = calculateInventory(activities, emissionFactors);
  const scopeSummary = summarizeByScope(activities, results);
  const monthly = groupByDimension(activities, results, 'month');
  const category = groupByDimension(activities, results, 'category');
  const bySite = groupByDimension(activities, results, 'siteId');
  const total = results.reduce((sum, result) => sum + result.tCO2e, 0);
  const missingEvidence = activities.filter((activity) => !activity.evidenceFileReference);
  const hotspots = rankHotspots(activities, results).slice(0, 5);

  return (
    <div>
      <PageHeader eyebrow="Phase 2.2" title="G-Emission ESG Carbon Report Assistant" description={`Database-backed scaffold for ISO 14064-1, TGO CFO, GHG Inventory, evidence readiness, and ESG report generation. Data source: ${source}.`} />
      <div className="mb-5 grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <Card><p className="text-sm text-carbon-muted"><T>Total emissions</T></p><strong className="mt-2 block text-3xl">{format(total)} tCO2e</strong><span className="text-sm text-carbon-muted">FY{organization.reportingYear}</span></Card>
        {Object.entries(scopeSummary).map(([scope, value]) => <Card key={scope}><p className="text-sm text-carbon-muted">{scope}</p><strong className="mt-2 block text-3xl">{format(value)}</strong><span className="text-sm text-carbon-muted">tCO2e</span></Card>)}
      </div>
      <div className="grid grid-cols-2 gap-4 max-xl:grid-cols-1">
        <Card><h2 className="mb-4 text-xl font-bold"><T>Monthly trend</T></h2><MonthlyTrendChart data={Object.entries(monthly).map(([month, tCO2e]) => ({ month, tCO2e }))} /></Card>
        <Card><h2 className="mb-4 text-xl font-bold"><T>Emission by source category</T></h2><CategoryPieChart data={Object.entries(category).map(([name, value]) => ({ name, value }))} /></Card>
        <Card>
          <h2 className="mb-4 text-xl font-bold"><T>Site summary</T></h2>
          <div className="grid gap-3">{Object.entries(bySite).length ? Object.entries(bySite).map(([siteId, value]) => <div key={siteId} className="flex justify-between border-b border-carbon-line pb-2"><span>{sites.find((site) => site.id === siteId)?.name}</span><strong>{format(value)} tCO2e</strong></div>) : <p className="text-sm text-carbon-muted"><T>No site summary yet.</T></p>}</div>
        </Card>
        <Card>
          <h2 className="mb-4 text-xl font-bold"><T>Hotspot ranking</T></h2>
          <div className="grid gap-3">{hotspots.length ? hotspots.map(({ activity, result }, index) => <div key={activity.id} className="flex justify-between gap-4 border-b border-carbon-line pb-2"><span>{index + 1}. {activity.category}<br /><small className="text-carbon-muted">{departments.find((department) => department.id === activity.departmentId)?.name}</small></span><strong>{format(result.tCO2e)} tCO2e</strong></div>) : <p className="text-sm text-carbon-muted"><T>No hotspot data yet.</T></p>}</div>
        </Card>
        <Card>
          <h2 className="mb-4 text-xl font-bold"><T>Data completeness</T></h2>
          <p className="text-3xl font-bold">{activities.length - missingEvidence.length}/{activities.length}</p>
          <p className="text-carbon-muted"><T>activity records have evidence references.</T></p>
        </Card>
        <Card>
          <h2 className="mb-4 text-xl font-bold"><T>Missing evidence list</T></h2>
          <div className="grid gap-3">{missingEvidence.length ? missingEvidence.map((activity) => <div key={activity.id} className="flex items-center justify-between gap-4"><span>{activity.activityType}</span><StatusPill status="Missing" /></div>) : <p className="text-sm text-carbon-muted"><T>No missing evidence records.</T></p>}</div>
        </Card>
      </div>
    </div>
  );
}
