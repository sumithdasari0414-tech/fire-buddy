import { indianCities, CityKey } from '@/data/mockData';
import { MapPin } from 'lucide-react';

export function CitySelector({ currentCity, onCityChange }: {
  currentCity: CityKey;
  onCityChange: (city: CityKey) => void;
}) {
  const city = indianCities.find(c => c.key === currentCity)!;

  return (
    <div className="flex items-center gap-2">
      <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
      <select
        value={currentCity}
        onChange={(e) => onCityChange(e.target.value as CityKey)}
        className="bg-secondary border border-border rounded-md px-2 py-1 text-xs font-mono text-foreground cursor-pointer hover:border-primary/40 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/30 appearance-none pr-6"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 6px center',
        }}
      >
        {indianCities.map(c => (
          <option key={c.key} value={c.key}>
            {c.name}, {c.state}
          </option>
        ))}
      </select>
    </div>
  );
}
