export const InputIcon = ({ icon, name, placeholder, val, change, max, type = "text" }) => (
  <div className="flex items-center bg-white/5 rounded-2xl px-4 py-3 border border-white/10 focus-within:border-white/40 transition-all">
    <div className="opacity-40 mr-3">{icon}</div>
    <input 
      name={name} 
      type={type} 
      placeholder={placeholder} 
      className="bg-transparent outline-none w-full text-white placeholder-white/30 text-sm" 
      required 
      value={val} 
      onChange={change} 
      maxLength={max} 
    />
  </div>
);