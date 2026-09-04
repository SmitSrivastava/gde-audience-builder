import React, { useEffect, useState } from 'react';
import { Upload, Database, Trash2, RefreshCw, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CatalogRow {
  id: string;
  field: string;
  value: string;
  synonyms: string | null;
  source_sheet: string | null;
}

const AttributeCatalog = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('attribute_catalog')
      .select('id, field, value, synonyms, source_sheet')
      .order('field')
      .limit(2000);
    if (!error) setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const toInsert: { field: string; value: string; synonyms: string | null; source_sheet: string }[] = [];

      for (const sheetName of wb.SheetNames) {
        const sheet = wb.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
        for (const row of json) {
          const field = String(row['Field'] ?? row['field'] ?? row['Attribute'] ?? row['attribute'] ?? '').trim();
          const value = String(row['Value'] ?? row['value'] ?? '').trim();
          const synonyms = String(row['Synonyms'] ?? row['synonyms'] ?? '').trim();
          if (field && value) {
            toInsert.push({ field, value, synonyms: synonyms || null, source_sheet: sheetName });
          }
        }
      }

      if (toInsert.length === 0) {
        toast({ title: 'No rows found', description: 'Excel must have columns: Field, Value, Synonyms (optional)', variant: 'destructive' });
        return;
      }

      // Replace the catalog with the new upload
      await supabase.from('attribute_catalog').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { error } = await supabase.from('attribute_catalog').insert(toInsert);
      if (error) throw error;

      toast({ title: 'Catalog updated', description: `${toInsert.length} attribute values uploaded from ${file.name}` });
      await load();
    } catch (e) {
      console.error(e);
      toast({ title: 'Upload failed', description: 'Could not parse or save the Excel file.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const clearCatalog = async () => {
    await supabase.from('attribute_catalog').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    toast({ title: 'Catalog cleared' });
    load();
  };

  const fields = [...new Set(rows.map(r => r.field))];

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6 neon-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-primary" /> Attribute Catalog
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={load} className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors" title="Refresh">
              <RefreshCw size={16} />
            </button>
            <button onClick={clearCatalog} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Clear catalog">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Upload the attribute dictionary Excel used by the AI cohort interpreter. Expected columns: <span className="text-foreground font-mono text-xs">Field, Value, Synonyms (optional)</span>. Uploading replaces the existing catalog.
        </p>
        <label className={`flex items-center justify-center gap-3 px-6 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? 'border-border text-muted-foreground' : 'border-primary/40 hover:border-primary hover:bg-primary/5 text-foreground'}`}>
          <Upload size={20} className="text-primary" />
          <span className="text-sm font-medium">{uploading ? 'Uploading…' : 'Click to upload attribute Excel (.xlsx)'}</span>
          <input type="file" accept=".xlsx,.xls" className="hidden" disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
        </label>
      </div>

      <div className="bg-card rounded-xl p-6 neon-border">
        <div className="flex items-center gap-2 mb-4">
          <Database size={18} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Current Catalog</h3>
          <span className="pill-chip text-xs">{rows.length} values · {fields.length} fields</span>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attributes yet — upload an Excel to power the AI cohort builder.</p>
        ) : (
          <div className="max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                  <th className="py-2 pr-4">Field</th>
                  <th className="py-2 pr-4">Value</th>
                  <th className="py-2 pr-4">Synonyms</th>
                  <th className="py-2">Sheet</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b border-border/40">
                    <td className="py-2 pr-4 text-foreground font-medium">{r.field}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{r.value}</td>
                    <td className="py-2 pr-4 text-muted-foreground/70">{r.synonyms || '—'}</td>
                    <td className="py-2 text-muted-foreground/50 text-xs">{r.source_sheet || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttributeCatalog;
