import React from 'react';
import { Ruler } from 'lucide-react';

interface SizeChartHeader {
  key: string;
  label: string;
}

interface SizeChartMeasurement {
  size: string;
  [key: string]: string | undefined;
}

interface MeasurementGuide {
  part: string;
  instruction: string;
}

interface DynamicSizeChartData {
  _id?: string;
  displayTitle: string;
  headers: SizeChartHeader[];
  measurements: SizeChartMeasurement[];
  measurementGuide?: MeasurementGuide[];
  note?: string;
}

interface InlineSizeChartProps {
  productType?: 'tshirt' | 'hoodie' | 'tank' | 'oversized' | 'printed-tee';
  customTags?: string[];
  sizeChartData?: DynamicSizeChartData | null;
}

// Fallback hardcoded data (mirrors SizeChart.tsx)
const fallbackSizeData: Record<string, any> = {
  tshirt: {
    title: 'T-Shirt Size Chart',
    headers: ['Size', 'Chest (in)', 'Length (in)', 'Shoulder (in)'],
    headerKeys: [],
    sizes: [
      { size: 'S', chest: '36-38', length: '28', shoulder: '17' },
      { size: 'M', chest: '39-41', length: '29', shoulder: '18' },
      { size: 'L', chest: '42-44', length: '30', shoulder: '19' },
      { size: 'XL', chest: '45-47', length: '31', shoulder: '20' },
      { size: 'XXL', chest: '48-50', length: '32', shoulder: '21' },
    ],
    measurementGuide: [
      { part: 'Chest', instruction: 'Measure around the fullest part of your chest' },
      { part: 'Length', instruction: 'Measure from highest point of shoulder to bottom hem' },
      { part: 'Shoulder', instruction: 'Measure from shoulder seam to shoulder seam' },
    ],
  },
  'printed-tee': {
    title: 'BIOWASH T-Shirt Size Chart',
    headers: ['Size', 'Chest (in)', 'Length (in)'],
    headerKeys: [],
    sizes: [
      { size: 'S', chest: '38', length: '27' },
      { size: 'M', chest: '40', length: '28' },
      { size: 'L', chest: '42', length: '29' },
      { size: 'XL', chest: '44', length: '30' },
      { size: 'XXL', chest: '46', length: '31' },
    ],
    measurementGuide: [
      { part: 'Chest', instruction: 'Measure around the fullest part of your chest' },
      { part: 'Length', instruction: 'Measure from highest point of shoulder to bottom hem' },
    ],
    note: 'BIOWASH fabric provides superior comfort and softness with pre-shrunk material for consistent fit.',
  },
  oversized: {
    title: 'Over Sized T-Shirt Size Chart',
    headers: ['Size', 'Chest (in)', 'Length (in)', 'Shoulder (in)', 'Sleeve (in)'],
    headerKeys: [],
    sizes: [
      { size: 'S', chest: '42', length: '27.5', shoulder: '18', sleeve: '9.5' },
      { size: 'M', chest: '44', length: '28.5', shoulder: '18.5', sleeve: '10' },
      { size: 'L', chest: '46', length: '29.5', shoulder: '19', sleeve: '10.5' },
      { size: 'XL', chest: '48', length: '30.5', shoulder: '19.5', sleeve: '11' },
    ],
    measurementGuide: [
      { part: 'Chest', instruction: 'Measure around the fullest part of your chest (oversized fit)' },
      { part: 'Length', instruction: 'Measure from highest point of shoulder to bottom hem' },
      { part: 'Shoulder', instruction: 'Measure from seam to seam (drop shoulder design)' },
      { part: 'Sleeve', instruction: 'Measure from shoulder to cuff' },
    ],
    note: 'All sizes are approximate and may vary upto +/-0.5.',
  },
  hoodie: {
    title: 'Hoodie Size Chart (Regular Fit)',
    headers: ['Size', 'Chest (in)', 'Length (in)', 'Sleeve (in)'],
    headerKeys: [],
    sizes: [
      { size: 'S', chest: '19(38)', length: '27', sleeve: '24.5' },
      { size: 'M', chest: '20(40)', length: '28', sleeve: '25.5' },
      { size: 'L', chest: '21(42)', length: '29', sleeve: '26.5' },
      { size: 'XL', chest: '22(44)', length: '30', sleeve: '27.5' },
      { size: 'XXL', chest: '23(46)', length: '31', sleeve: '28.5' },
    ],
    measurementGuide: [
      { part: 'Chest', instruction: 'Measure around the fullest part of your chest' },
      { part: 'Length', instruction: 'Measure from highest point of shoulder to bottom hem' },
      { part: 'Sleeve', instruction: 'Measure from shoulder to cuff' },
    ],
    note: 'All sizes are approximate and may vary upto +/-0.5.',
  },
  'oversized-hoodie': {
    title: 'Hoodie Size Chart (Oversized Fit)',
    headers: ['Size', 'Chest (in)', 'Length (in)', 'Sleeve (in)'],
    headerKeys: [],
    sizes: [
      { size: 'S', chest: '42', length: '25', sleeve: '25.5' },
      { size: 'M', chest: '44', length: '26', sleeve: '26.5' },
      { size: 'L', chest: '46', length: '27', sleeve: '27.5' },
      { size: 'XL', chest: '48', length: '28', sleeve: '28.5' },
      { size: 'XXL', chest: '50', length: '29', sleeve: '29.5' },
    ],
    measurementGuide: [
      { part: 'Chest', instruction: 'Measure around the fullest part of your chest (extra roomy)' },
      { part: 'Length', instruction: 'Measure from highest point of shoulder to bottom hem' },
      { part: 'Sleeve', instruction: 'Measure from shoulder to cuff (drop shoulder design)' },
    ],
    note: 'Oversized fit provides extra comfort and a relaxed streetwear look. All sizes are approximate and may vary upto +/-0.5.',
  },
  tank: {
    title: 'Tank Top Size Chart',
    headers: ['Size', 'Chest (in)', 'Length (in)'],
    headerKeys: [],
    sizes: [
      { size: 'S', chest: '35-37', length: '27' },
      { size: 'M', chest: '38-40', length: '28' },
      { size: 'L', chest: '41-43', length: '29' },
      { size: 'XL', chest: '44-46', length: '30' },
      { size: 'XXL', chest: '47-49', length: '31' },
    ],
    measurementGuide: [
      { part: 'Chest', instruction: 'Measure around the fullest part of your chest' },
      { part: 'Length', instruction: 'Measure from highest point of shoulder to bottom hem' },
    ],
  },
};

const InlineSizeChart: React.FC<InlineSizeChartProps> = ({
  productType = 'tshirt',
  customTags = [],
  sizeChartData = null,
}) => {
  const isOversizedHoodie =
    productType === 'hoodie' &&
    customTags.some(
      (tag) =>
        tag.toLowerCase().includes('oversized') ||
        tag.toLowerCase().includes('over sized')
    );

  let currentData: any;
  let headerKeys: string[] = [];

  if (sizeChartData) {
    const headers = sizeChartData.headers || [];
    const measurements = sizeChartData.measurements || [];
    currentData = {
      title: sizeChartData.displayTitle || 'Size Chart',
      headers: headers.map((h) => h.label),
      headerKeys: headers.map((h) => h.key),
      sizes: measurements,
      measurementGuide: sizeChartData.measurementGuide || [],
      note: sizeChartData.note,
    };
    headerKeys = currentData.headerKeys;
  } else {
    const chartType = isOversizedHoodie ? 'oversized-hoodie' : productType;
    currentData = fallbackSizeData[chartType] || fallbackSizeData.tshirt;
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <Ruler className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>Size Chart</span>
      </div>

      {/* Size Table */}
      <div className="w-full overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surfaceHover)' }}>
              {currentData.headers.map((header: string, index: number) => (
                <th
                  key={index}
                  className="py-2 px-2.5 text-left font-semibold whitespace-nowrap"
                  style={{ color: index === 0 ? 'var(--color-primary)' : 'var(--color-text)' }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.sizes.map((row: any, rowIndex: number) => (
              <tr
                key={row.size ?? rowIndex}
                className="last:border-0"
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: rowIndex % 2 !== 0 ? 'var(--color-surfaceHover)' : 'transparent',
                }}
              >
                {headerKeys.length > 0 ? (
                  headerKeys.map((key: string, colIndex: number) => (
                    <td
                      key={key}
                      className="py-2 px-2.5 whitespace-nowrap"
                      style={{
                        color: colIndex === 0 ? 'var(--color-primary)' : 'var(--color-text)',
                        fontWeight: colIndex === 0 ? 600 : 400,
                      }}
                    >
                      {row[key] || '—'}
                    </td>
                  ))
                ) : (
                  <>
                    <td className="py-2 px-2.5 font-semibold" style={{ color: 'var(--color-primary)' }}>{row.size}</td>
                    <td className="py-2 px-2.5" style={{ color: 'var(--color-text)' }}>{row.chest}</td>
                    <td className="py-2 px-2.5" style={{ color: 'var(--color-text)' }}>{row.length}</td>
                    {row.shoulder !== undefined && (
                      <td className="py-2 px-2.5" style={{ color: 'var(--color-text)' }}>{row.shoulder}</td>
                    )}
                    {row.sleeve !== undefined && (
                      <td className="py-2 px-2.5" style={{ color: 'var(--color-text)' }}>{row.sleeve}</td>
                    )}
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InlineSizeChart;
