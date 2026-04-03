interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  displayValue?: string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  displayValue,
}: SliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <label className="text-text font-medium">{label}</label>
        <span className="text-text-muted font-mono text-xs tabular-nums">
          {displayValue ?? value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full bg-border appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-text
                   [&::-webkit-slider-thumb]:shadow-sm
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
                   [&::-moz-range-thumb]:rounded-full
                   [&::-moz-range-thumb]:bg-text
                   [&::-moz-range-thumb]:border-0
                   [&::-moz-range-thumb]:cursor-pointer"
        style={{ accentColor: '#2c2c2c' }}
      />
    </div>
  );
}
