'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { calculateActivityEmission } from '@/lib/calculation-engine';
import type { ActivityRecord, DataQualityRating, Department, EmissionFactor, RecordStatus, Scope, Site } from '@/lib/types';
import { T, useLanguage } from '@/components/language-provider';
import { buttonDanger, buttonPrimary, buttonSecondary, inputClass, requiredLabel } from './common';

interface Props {
  activities: ActivityRecord[];
  sites: Site[];
  departments: Department[];
  emissionFactors: EmissionFactor[];
  source: 'database' | 'sample';
  reportingPeriodId?: string;
  reportingPeriodLabel: string;
}

type ActivityForm = {
  id?: string;
  month: string;
  siteId: string;
  departmentId: string;
  activityType: string;
  scope: Scope;
  category: string;
  quantity: string;
  unit: string;
  emissionFactorId: string;
  evidenceFileReference: string;
  responsiblePerson: string;
  dataQualityRating: DataQualityRating;
  status: RecordStatus;
  remark: string;
  dataSource: string;
};

const emptyForm: ActivityForm = {
  month: new Date().toISOString().slice(0, 7),
  siteId: '',
  departmentId: '',
  activityType: '',
  scope: 'Scope 1',
  category: '',
  quantity: '',
  unit: '',
  emissionFactorId: '',
  evidenceFileReference: '',
  responsiblePerson: '',
  dataQualityRating: 'Medium',
  status: 'Draft',
  remark: '',
  dataSource: ''
};

function formFromActivity(activity: ActivityRecord): ActivityForm {
  return {
    id: activity.id,
    month: activity.month,
    siteId: activity.siteId,
    departmentId: activity.departmentId,
    activityType: activity.activityType,
    scope: activity.scope,
    category: activity.category,
    quantity: String(activity.quantity),
    unit: activity.unit,
    emissionFactorId: activity.emissionFactorId,
    evidenceFileReference: activity.evidenceFileReference ?? '',
    responsiblePerson: activity.responsiblePerson,
    dataQualityRating: activity.dataQualityRating,
    status: activity.status ?? 'Draft',
    remark: activity.remark ?? '',
    dataSource: activity.dataSource
  };
}

export function ActivityCrud({ activities, sites, departments, emissionFactors, source, reportingPeriodId, reportingPeriodLabel }: Props) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ActivityForm>(emptyForm);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const selectedFactor = emissionFactors.find((factor) => factor.id === form.emissionFactorId);
  const duplicate = activities.some((activity) => activity.id !== form.id && activity.month === form.month && activity.siteId === form.siteId && activity.activityType.trim().toLowerCase() === form.activityType.trim().toLowerCase());

  const preview = useMemo(() => {
    if (!selectedFactor || !form.quantity || !form.unit) return null;
    try {
      return calculateActivityEmission({
        id: form.id ?? 'preview',
        reportingPeriod: reportingPeriodLabel,
        month: form.month,
        siteId: form.siteId,
        departmentId: form.departmentId,
        activityType: form.activityType,
        scope: form.scope,
        category: form.category,
        quantity: Number(form.quantity),
        unit: form.unit,
        dataSource: form.dataSource,
        evidenceFileReference: form.evidenceFileReference || undefined,
        responsiblePerson: form.responsiblePerson,
        remark: form.remark || undefined,
        dataQualityRating: form.dataQualityRating,
        status: form.status,
        emissionFactorId: form.emissionFactorId
      }, selectedFactor);
    } catch {
      return null;
    }
  }, [form, reportingPeriodLabel, selectedFactor]);

  function validate() {
    const next = [];
    if (!form.quantity || Number(form.quantity) <= 0) next.push('Missing quantity');
    if (!form.unit.trim()) next.push('Missing unit');
    if (!form.emissionFactorId) next.push('Missing emission factor');
    if (!form.evidenceFileReference.trim()) next.push('Missing evidence');
    if (!form.scope || !form.category.trim()) next.push('Invalid scope/category');
    if (duplicate) next.push('Duplicate period/site/activity');
    if (selectedFactor?.verificationStatus !== 'Verified') next.push('Unverified EF');
    if (selectedFactor?.expiryDate && selectedFactor.expiryDate < form.month + '-01') next.push('Expired EF');
    setErrors(next);
    return !next.some((item) => !['Missing evidence', 'Unverified EF'].includes(item));
  }

  async function save() {
    setMessage('');
    if (!validate()) return;
    if (source === 'sample') {
      setMessage('Demo mode: connect DATABASE_URL to save activity records.');
      return;
    }
    const payload = {
      reportingPeriodId,
      month: form.month,
      siteId: form.siteId,
      departmentId: form.departmentId,
      activityType: form.activityType,
      scope: form.scope,
      category: form.category,
      quantity: Number(form.quantity),
      unit: form.unit,
      dataSource: form.dataSource || 'Manual entry',
      evidenceFileReference: form.evidenceFileReference || undefined,
      responsiblePerson: form.responsiblePerson,
      remark: form.remark || undefined,
      dataQualityRating: form.dataQualityRating,
      status: form.status,
      emissionFactorId: form.emissionFactorId
    };
    const response = await fetch(form.id ? `/api/activity-data/${form.id}` : '/api/activity-data', {
      method: form.id ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error ?? 'Could not save activity record.');
      return;
    }
    setMessage('Activity record saved and recalculated.');
    setOpen(false);
    setForm(emptyForm);
    startTransition(() => router.refresh());
  }

  async function remove(activity: ActivityRecord) {
    if (!window.confirm(t('Delete this activity record? Records with evidence/calculations may be blocked.'))) return;
    if (source === 'sample') {
      setMessage('Demo mode: connect DATABASE_URL to delete activity records.');
      return;
    }
    const response = await fetch(`/api/activity-data/${activity.id}`, { method: 'DELETE' });
    const result = await response.json();
    setMessage(response.ok ? 'Activity record deleted.' : result.error ?? 'Could not delete activity record.');
    startTransition(() => router.refresh());
  }

  return (
    <div className="mb-4 grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-carbon-muted">{t(source === 'sample' ? 'Demo mode: changes are preview-only until DATABASE_URL is configured.' : 'Database mode: changes save through Prisma APIs.')}</p>
          {message ? <p className="mt-1 text-sm font-semibold text-carbon-green">{t(message)}</p> : null}
        </div>
        <button className={buttonPrimary} onClick={() => { setForm({ ...emptyForm, siteId: sites[0]?.id ?? '', departmentId: departments[0]?.id ?? '', emissionFactorId: emissionFactors[0]?.id ?? '' }); setErrors([]); setOpen(true); }}><T>Add Activity Record</T></button>
      </div>

      {open ? (
        <section className="rounded-lg border border-carbon-line bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{t(form.id ? 'Edit Activity Record' : 'Add Activity Record')}</h2>
            <button className={buttonSecondary} onClick={() => setOpen(false)}><T>Cancel</T></button>
          </div>
          <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
            <label className="grid gap-1 text-sm font-semibold">{requiredLabel('Month')}<input className={inputClass} type="month" value={form.month} onChange={(event) => setForm({ ...form, month: event.target.value })} /></label>
            <label className="grid gap-1 text-sm font-semibold">{requiredLabel('Facility/site')}<select className={inputClass} value={form.siteId} onChange={(event) => setForm({ ...form, siteId: event.target.value })}>{sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></label>
            <label className="grid gap-1 text-sm font-semibold">{requiredLabel('Department')}<select className={inputClass} value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })}>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
            <label className="grid gap-1 text-sm font-semibold">{requiredLabel('Scope')}<select className={inputClass} value={form.scope} onChange={(event) => setForm({ ...form, scope: event.target.value as Scope })}>{['Scope 1', 'Scope 2', 'Scope 3'].map((scope) => <option key={scope} value={scope}>{t(scope)}</option>)}</select></label>
            <label className="grid gap-1 text-sm font-semibold">{requiredLabel('Activity type')}<input className={inputClass} value={form.activityType} onChange={(event) => setForm({ ...form, activityType: event.target.value })} /></label>
            <label className="grid gap-1 text-sm font-semibold">{requiredLabel('Category')}<input className={inputClass} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>
            <label className="grid gap-1 text-sm font-semibold">{requiredLabel('Quantity')}<input className={inputClass} type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></label>
            <label className="grid gap-1 text-sm font-semibold">{requiredLabel('Unit')}<input className={inputClass} value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} /></label>
            <label className="grid gap-1 text-sm font-semibold">{requiredLabel('Emission factor')}<select className={inputClass} value={form.emissionFactorId} onChange={(event) => setForm({ ...form, emissionFactorId: event.target.value })}>{emissionFactors.map((factor) => <option key={factor.id} value={factor.id}>{factor.factorCode} v{factor.version}</option>)}</select></label>
            <label className="grid gap-1 text-sm font-semibold"><T>Evidence reference</T><input className={inputClass} value={form.evidenceFileReference} onChange={(event) => setForm({ ...form, evidenceFileReference: event.target.value })} /></label>
            <label className="grid gap-1 text-sm font-semibold">{requiredLabel('Responsible person')}<input className={inputClass} value={form.responsiblePerson} onChange={(event) => setForm({ ...form, responsiblePerson: event.target.value })} /></label>
            <label className="grid gap-1 text-sm font-semibold"><T>Data quality</T><select className={inputClass} value={form.dataQualityRating} onChange={(event) => setForm({ ...form, dataQualityRating: event.target.value as DataQualityRating })}>{['High', 'Medium', 'Low', 'Estimated'].map((item) => <option key={item} value={item}>{t(item)}</option>)}</select></label>
            <label className="grid gap-1 text-sm font-semibold"><T>Status</T><select className={inputClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as RecordStatus })}>{['Draft', 'Ready', 'Reviewed', 'Rejected', 'Inactive'].map((item) => <option key={item} value={item}>{t(item)}</option>)}</select></label>
            <label className="grid gap-1 text-sm font-semibold"><T>Data source</T><input className={inputClass} value={form.dataSource} onChange={(event) => setForm({ ...form, dataSource: event.target.value })} /></label>
            <label className="grid gap-1 text-sm font-semibold md:col-span-2"><T>Remark</T><textarea className={inputClass + ' min-h-20'} value={form.remark} onChange={(event) => setForm({ ...form, remark: event.target.value })} /></label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button className={buttonPrimary} disabled={isPending} onClick={save}><T>Save</T></button>
            <button className={buttonSecondary} onClick={() => setForm(emptyForm)}><T>Clear</T></button>
            <span className="text-sm font-semibold text-carbon-muted"><T>Preview</T>: {preview ? preview.tCO2e.toFixed(3) + ' tCO2e · EF v' + preview.emissionFactorVersion : t('enter quantity/unit/factor')}</span>
          </div>
          {selectedFactor?.verificationStatus !== 'Verified' ? <p className="mt-2 text-sm font-semibold text-carbon-amber">{t('Warning: selected EF is')} {t(selectedFactor?.verificationStatus ?? 'Demo')}.</p> : null}
          {errors.length ? <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-carbon-amber">{errors.map((error) => t(error)).join(' · ')}</div> : null}
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {activities.length ? activities.map((activity) => (
          <span key={activity.id} className="inline-flex items-center gap-2 rounded-full bg-carbon-bg px-3 py-2 text-xs font-semibold">
            {activity.activityType}
            <button className="text-carbon-green" onClick={() => { setForm(formFromActivity(activity)); setErrors([]); setOpen(true); }}><T>Edit</T></button>
            <button className="text-carbon-danger" onClick={() => remove(activity)}><T>Delete</T></button>
          </span>
        )) : <p className="text-sm text-carbon-muted">{t('No activity records yet.')}</p>}
      </div>
    </div>
  );
}


