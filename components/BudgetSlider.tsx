'use client';

export default function BudgetSlider({ 
  value, 
  onChange 
}: { 
  value: number; 
  onChange: (val: number) => void 
}) {
  return (
    <div className="w-full bg-white p-6 rounded-3xl shadow-sm border border-[#F0E6DD] mb-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <label htmlFor="budget-slider" className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Max Monthly Budget</label>
          <p className="text-xs text-gray-500">Slide to adjust your monthly spending</p>
        </div>
        <span className="font-black text-[#8B5E3C] text-3xl leading-none">${value}<span className="text-sm font-bold text-gray-400">/mo</span></span>
      </div>
      
      <input 
        id="budget-slider"
        type="range" 
        min="15" 
        max="150" 
        step="5"
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-[#8B5E3C] hover:accent-[#724a2e] transition-all"
      />
      
      <div className="flex justify-between text-[10px] text-gray-400 mt-4 font-bold uppercase tracking-widest">
        <span>$15</span>
        <span>$150+</span>
      </div>
    </div>
  );
}
