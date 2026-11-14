"use client";

import { useEffect, useId, useState } from "react";
import type { Path } from "@/lib/path";
import { fileUrl, resizeImage, saveFile } from "@/lib/files";
import { idbRef, isIdbRef } from "@/lib/resolveFiles";
import { checkpoint } from "@/lib/store";
import { useField } from "./state";

type Base = { path: Path; label: string; help?: string; placeholder?: string; required?: boolean };

/** Every text-ish field pushes an undo checkpoint on focus — captures "before you started typing here". */
const onFocusCheckpoint = () => checkpoint();

export function TextField({ path, label, help, placeholder, required, mono, disabled }: Base & { mono?: boolean; disabled?: boolean }) {
  const [value, setValue] = useField<string>(path);
  const id = useId();
  return (
    <label className="block" htmlFor={id}>
      <span className="st-label">
        {label} {required && <span className="text-st-danger">*</span>}
      </span>
      <input id={id} disabled={disabled} className={`st-field mt-1.5 ${mono ? "font-mono" : ""} ${disabled ? "opacity-60" : ""}`} value={value ?? ""} placeholder={placeholder} onFocus={onFocusCheckpoint} onChange={(e) => setValue(e.target.value)} />
      {help && <span className="st-help mt-1 block">{help}</span>}
    </label>
  );
}

export function AreaField({ path, label, help, placeholder, rows = 3 }: Base & { rows?: number }) {
  const [value, setValue] = useField<string>(path);
  const id = useId();
  return (
    <label className="block" htmlFor={id}>
      <span className="st-label">{label}</span>
      <textarea id={id} rows={rows} className="st-field mt-1.5 resize-y" value={value ?? ""} placeholder={placeholder} onFocus={onFocusCheckpoint} onChange={(e) => setValue(e.target.value)} />
      {help && <span className="st-help mt-1 block">{help}</span>}
    </label>
  );
}

export function NumField({ path, label, help, min, max, step = 1 }: Base & { min?: number; max?: number; step?: number }) {
  const [value, setValue] = useField<number>(path);
  const id = useId();
  return (
    <label className="block" htmlFor={id}>
      <span className="st-label">{label}</span>
      <input id={id} type="number" min={min} max={max} step={step} className="st-field mt-1.5" value={value ?? 0} onFocus={onFocusCheckpoint} onChange={(e) => setValue(Number(e.target.value))} />
      {help && <span className="st-help mt-1 block">{help}</span>}
    </label>
  );
}

export function CheckField({ path, label, help }: Omit<Base, "placeholder">) {
  const [value, setValue] = useField<boolean>(path);
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input type="checkbox" checked={!!value} onChange={(e) => { checkpoint(); setValue(e.target.checked); }} className="mt-0.5 h-4 w-4 accent-[var(--st-purple)]" />
      <span>
        <span className="block text-[13.5px] font-medium text-st-ink">{label}</span>
        {help && <span className="st-help">{help}</span>}
      </span>
    </label>
  );
}

export function SelectField<T extends string>({ path, label, help, options }: Base & { options: { value: T; label: string }[] }) {
  const [value, setValue] = useField<T>(path);
  const id = useId();
  return (
    <label className="block" htmlFor={id}>
      <span className="st-label">{label}</span>
      <select id={id} className="st-field mt-1.5" value={value} onChange={(e) => { checkpoint(); setValue(e.target.value as T); }}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {help && <span className="st-help mt-1 block">{help}</span>}
    </label>
  );
}

/** A colour (hex) field with a live swatch. Empty = "use the built-in colour". */
export function ColorField({ path, label, help }: Base) {
  const [value, setValue] = useField<string>(path);
  const id = useId();
  const valid = !value || /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
  return (
    <label className="block" htmlFor={id}>
      <span className="st-label">{label}</span>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="h-9 w-9 shrink-0 rounded-lg border border-st-border-strong" style={{ background: valid && value ? value : "repeating-conic-gradient(#ddd 0 25%, #fff 0 50%) 0 0/10px 10px" }} />
        <input id={id} className={`st-field ${valid ? "" : "!border-st-danger"}`} value={value ?? ""} placeholder="#6f55e8" onFocus={onFocusCheckpoint} onChange={(e) => setValue(e.target.value)} />
      </div>
      {help && <span className="st-help mt-1 block">{help}</span>}
    </label>
  );
}

/** A tag list: type one, press Enter to add; click a tag to remove it. */
export function ListField({ path, label, help }: Omit<Base, "placeholder"> & { placeholder?: string }) {
  const [value, setValue] = useField<string[]>(path);
  const items = value ?? [];
  const [draft, setDraft] = useState("");
  const commit = () => {
    const v = draft.trim();
    if (!v) return;
    checkpoint();
    setValue([...items, v]);
    setDraft("");
  };
  return (
    <div>
      <span className="st-label">{label}</span>
      <div className="st-field mt-1.5 flex flex-wrap items-center gap-1.5 !h-auto !min-h-[42px] !py-1.5">
        {items.map((t, i) => (
          <button
            key={`${t}-${i}`}
            type="button"
            onClick={() => {
              checkpoint();
              setValue(items.filter((_, j) => j !== i));
            }}
            className="group inline-flex items-center gap-1 rounded-full bg-st-panel-2 px-2.5 py-1 text-[12.5px] text-st-ink"
            title="Remove"
          >
            {t}
            <span className="text-st-dim group-hover:text-st-danger">×</span>
          </button>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={onFocusCheckpoint}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            } else if (e.key === "Backspace" && !draft && items.length) {
              setValue(items.slice(0, -1));
            }
          }}
          onBlur={commit}
          placeholder="Type and press Enter…"
          className="min-w-[100px] flex-1 border-0 bg-transparent p-1 text-[13.5px] text-st-ink outline-none placeholder:text-st-dim"
        />
      </div>
      {help && <span className="st-help mt-1 block">{help}</span>}
    </div>
  );
}

/** An uploaded image (logo, favicon, a book cover). Stores `idb:<fileId>`; empty = the built-in look. */
export function ImageField({ path, label, help, maxSide = 1400 }: Base & { maxSide?: number }) {
  const [value, setValue] = useField<string>(path);
  const [preview, setPreview] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!isIdbRef(value)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the preview mirrors an id that can only be resolved against IndexedDB, after mount
      setPreview(undefined);
      return;
    }
    let cancelled = false;
    void fileUrl(value.slice(4)).then((u) => !cancelled && setPreview(u));
    return () => {
      cancelled = true;
    };
  }, [value]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    checkpoint();
    const blob = file.type.startsWith("image/") && file.size > 400_000 ? await resizeImage(file, maxSide) : file;
    const fileId = await saveFile(blob, file.name);
    setValue(idbRef(fileId));
    setBusy(false);
  };

  return (
    <div>
      <span className="st-label">{label}</span>
      <div className="mt-1.5 flex items-center gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-st-border-strong bg-st-panel-2">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- a blob: URL from IndexedDB; next/image can't load it
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-st-dim">None</span>
          )}
        </span>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id} className="st-btn w-fit cursor-pointer">
            {busy ? "Uploading…" : "Choose image"}
          </label>
          <input id={id} type="file" accept="image/*" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
          {value && (
            <button type="button" onClick={() => { checkpoint(); setValue(""); }} className="text-left text-[12px] text-st-dim hover:text-st-danger">
              Remove
            </button>
          )}
        </div>
      </div>
      {help && <span className="st-help mt-1.5 block">{help}</span>}
    </div>
  );
}

/** A required PDF upload (a book's file). Writes the id/name/size as three sibling fields. */
export function PdfField({ idPath, namePath, sizePath, label, help }: { idPath: Path; namePath: Path; sizePath: Path; label: string; help?: string }) {
  const [fileId, setFileId] = useField<string | undefined>(idPath);
  const [name, setName] = useField<string | undefined>(namePath);
  const [, setSize] = useField<number | undefined>(sizePath);
  const [busy, setBusy] = useState(false);
  const id = useId();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    checkpoint();
    const newId = await saveFile(file, file.name);
    setFileId(newId);
    setName(file.name);
    setSize(file.size);
    setBusy(false);
  };

  return (
    <div>
      <span className="st-label">{label}</span>
      <div className="mt-1.5 flex items-center gap-3">
        <label htmlFor={id} className="st-btn w-fit cursor-pointer">
          {busy ? "Uploading…" : fileId ? "Replace PDF" : "Choose PDF"}
        </label>
        <input id={id} type="file" accept="application/pdf" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
        {fileId ? <span className="truncate text-[12.5px] text-st-ink">{name}</span> : <span className="text-[12.5px] text-st-danger">No PDF yet — requests will wait</span>}
      </div>
      {help && <span className="st-help mt-1.5 block">{help}</span>}
    </div>
  );
}

/** A heading + its highlighted gradient ending, side by side — the site's recurring pattern. */
export function HighlightField({ headingPath, accentPath, label = "Heading" }: { headingPath: Path; accentPath: Path; label?: string }) {
  return (
    <div className="grid gap-3.5 sm:grid-cols-2">
      <TextField path={headingPath} label={label} />
      <TextField path={accentPath} label={`${label} — highlighted ending`} help="The last words, shown in italic gradient style." />
    </div>
  );
}
