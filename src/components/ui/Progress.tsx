export function Progress({ value = 0 }: { value?: number }) { return <div className="bar"><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>; }
