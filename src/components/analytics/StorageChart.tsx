import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { FileText, Image, Video, Music, Archive, File } from 'lucide-react';

interface FileData {
  mime_type: string | null;
  size: number;
}

interface StorageChartProps {
  files: FileData[];
}

const FILE_CATEGORIES = [
  { name: 'Images', color: 'hsl(var(--chart-1))', check: (t: string) => t.startsWith('image/'), icon: Image },
  { name: 'Videos', color: 'hsl(var(--chart-2))', check: (t: string) => t.startsWith('video/'), icon: Video },
  { name: 'Audio', color: 'hsl(var(--chart-3))', check: (t: string) => t.startsWith('audio/'), icon: Music },
  { name: 'Documents', color: 'hsl(var(--chart-4))', check: (t: string) => t.includes('pdf') || t.includes('document') || t.includes('text'), icon: FileText },
  { name: 'Archives', color: 'hsl(var(--chart-5))', check: (t: string) => t.includes('zip') || t.includes('archive') || t.includes('rar'), icon: Archive },
  { name: 'Other', color: 'hsl(var(--muted-foreground))', check: () => true, icon: File },
];

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const StorageChart = ({ files }: StorageChartProps) => {
  const chartData = useMemo(() => {
    const categorized = FILE_CATEGORIES.map(cat => ({
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      value: 0,
      count: 0
    }));

    files.forEach(file => {
      const type = file.mime_type || '';
      for (let i = 0; i < FILE_CATEGORIES.length; i++) {
        if (FILE_CATEGORIES[i].check(type)) {
          categorized[i].value += file.size;
          categorized[i].count++;
          break;
        }
      }
    });

    return categorized.filter(c => c.value > 0);
  }, [files]);

  const totalSize = chartData.reduce((acc, c) => acc + c.value, 0);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>No files to analyze</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => formatSize(value)}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3">
        {chartData.map((cat) => {
          const Icon = cat.icon;
          const percentage = ((cat.value / totalSize) * 100).toFixed(1);
          
          return (
            <div key={cat.name} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: cat.color + '20' }}
              >
                <Icon className="w-5 h-5" style={{ color: cat.color }} />
              </div>
              <div>
                <p className="font-medium text-sm">{cat.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(cat.value)} • {percentage}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
