/**
 * Split-flap digits (airport-board style). Pure CSS: when a character changes, the old top
 * half folds down and the new bottom half drops into place. `k` changes on every flip so the
 * fold animation restarts.
 */
export function SplitFlap({ value, prev, k, className = "" }: { value: string; prev: string; k: number; className?: string }) {
  const chars = value.split("");
  const before = prev.padStart(chars.length, " ").split("");
  return (
    <span className={`inline-flex gap-[0.06em] ${className}`} aria-label={value} role="img">
      {chars.map((c, i) => {
        const p = before[i];
        const flip = k > 0 && p !== c;
        return (
          <span key={i} className="flap" aria-hidden="true">
            <span className="flap-half flap-top">
              <span>{c}</span>
            </span>
            <span className="flap-half flap-bottom">
              <span>{flip ? p : c}</span>
            </span>
            {flip && (
              <>
                <span key={`t${k}`} className="flap-half flap-top flap-fold-top">
                  <span>{p}</span>
                </span>
                <span key={`b${k}`} className="flap-half flap-bottom flap-fold-bottom">
                  <span>{c}</span>
                </span>
              </>
            )}
          </span>
        );
      })}
    </span>
  );
}
