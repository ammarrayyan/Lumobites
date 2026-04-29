'use client';

export default function BudgetSlider({ 
  value, 
  onChange 
}: { 
  value: number; 
  onChange: (val: number) => void 
}) {
  return (
    <div className="w-full bg-white p-5 rounded-2xl shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <label htmlFor="budget-slider" className="font-semibold text-gray-800">Max Monthly Budget</label>
        <span className="font-bold text-[#8B5E3C] text-lg">${value}/mo</span>
      </div>
      
      <input 
        id="budget-slider"
        type="range" 
        min="15" 
        max="150" 
        step="5"
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#8B5E3C]"
      />
      
      <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
        <span>$15</span>
        <span>$150+</span>
      </div>
    </div>
  );
}
