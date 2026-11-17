"use client";

import { useId, useState } from "react";
import type { Path } from "@/lib/path";
import { checkpoint } from "@/studio/store";
import { Icon } from "./Icon";
import { useField } from "./state";
import { rememberUpload, useFileUrl } from "./useFileUrl";
import { resizeImage, uploadFile } from "./upload";
import { useToast } from "./ui";

type Base = { path: Path; label: string; help?: string; placeholder?: string; required?: boolean };

/** Every text-ish field pushes an undo checkpoint on focus — captures "before you started typing here". */
const onFocusCheckpoint = () => checkpoint();

export function TextField({ path, label, help, placeholder, required, mono, disabled, onValue }: Base & { mono?: boolean; disabled?: boolean; onValue?: (v: string) => void }) {
  const [value, setValue] = useField<string>(path);
  const id = useId();
  return (
    <label className="block" htmlFor={id}>
      <span className="st-label">
        {label} {required && <span className="text-st-purple">*</span>}
      </span>
      <input id={id} disabled={disabled} className={`st-field mt-1.5 ${mono ? "font-mono" : ""} ${disabled ? "opacity-60" : ""}`} value={value ?? ""} placeholder={placeholder} onFocus={onFocusCheckpoint} onChange={(e) => { setValue(e.target.value); onValue?.(e.target.value); }} />
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

/** A labelled range slider with a live, formattable value readout. */
export function Slider({ path, label, help, min, max, step = 1, format }: Base & { min: number; max: number; step?: number; format?: (v: number) => string }) {
  const [value, setValue] = useField<number>(path);
  const id = useId();
  const v = value ?? min;
  return (
    <label className="block" htmlFor={id}>
      <span className="flex items-center justify-between">
        <span className="st-label">{label}</span>
        <span className="st-num text-[12.5px] text-st-ink">{format ? format(v) : v}</span>
      </span>
      <input id={id} type="range" min={min} max={max} step={step} value={v} onFocus={onFocusCheckpoint} onChange={(e) => setValue(Number(e.target.value))} className="mt-2.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-st-panel-2 accent-[var(--st-purple)]" />
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

const expand3 = (hex: string) => (hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join("")}` : hex);

/** A colour (hex) field: a native picker swatch, a hex input, and a reset to the built-in colour. */
/** `fallback`: the built-in colour an empty value means — shown in the swatch and as the placeholder. */
export function ColorField({ path, label, help, fallback = "#6f55e8" }: Base & { fallback?: string }) {
  const [value, setValue] = useField<string>(path);
  const id = useId();
  const valid = !value || /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
  return (
    <label className="block" htmlFor={id}>
      <span className="st-label">{label}</span>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} — pick a colour`}
          value={valid && value ? expand3(value) : fallback}
          onFocus={onFocusCheckpoint}
          onChange={(e) => setValue(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-st-border-strong bg-transparent p-0.5"
        />
        <input id={id} className={`st-field ${valid ? "" : "!border-st-danger"}`} value={value ?? ""} placeholder={`${fallback} (built-in)`} onFocus={onFocusCheckpoint} onChange={(e) => setValue(e.target.value)} />
        {value && (
          <button type="button" title="Reset to the built-in colour" aria-label="Reset to the built-in colour" onClick={() => { checkpoint(); setValue(""); }} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-st-dim hover:bg-st-panel-2 hover:text-st-ink">
            <Icon name="close" size={13} />
          </button>
        )}
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

/** A drag & drop (or click) file picker. The general-purpose shell `ImageField`, `PdfField` and the Settings backup restore all render through. */
export function Dropzone({ accept, label, hint, onFile, current, busy }: { accept: string; label: string; hint?: string; onFile: (file: File | undefined) => void; current?: React.ReactNode; busy?: boolean }) {
  const [dragOver, setDragOver] = useState(false);
  const id = useId();
  return (
    <div>
      <span className="st-label">{label}</span>
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!busy) onFile(e.dataTransfer.files?.[0]);
        }}
        aria-busy={busy}
        className={`relative mt-1.5 flex flex-col ${busy ? "pointer-events-none cursor-wait opacity-70" : "cursor-pointer"} items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${dragOver ? "border-st-purple bg-st-panel-3" : "border-st-border-strong bg-st-panel-2 hover:border-st-purple/50"}`}
        style={dragOver ? { boxShadow: "var(--st-glow)" } : undefined}
      >
        <span className={`text-st-dim ${busy ? "animate-pulse" : ""}`}>
          <Icon name="upload" size={20} />
        </span>
        <span className="text-[13px] font-medium text-st-ink">{busy ? "Uploading…" : "Drop a file, or click to choose"}</span>
        {hint && <span className="text-[11.5px] text-st-dim">{hint}</span>}
        <input
          id={id}
          type="file"
          accept={accept}
          disabled={busy}
          className="sr-only"
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = ""; // picking the same file again still uploads it
          }}
        />
      </label>
      {current && <div className="mt-2.5">{current}</div>}
    </div>
  );
}

/**
 * An uploaded image (a book cover, a cover logo). Stores an R2 file ref (`makeRef`); empty = the built-in look.
 * A JPEG photo over 400KB is re-encoded to fit `maxSide`; with `keepFormat`, PNG/SVG/WebP are
 * never re-encoded, so an uploaded logo keeps its transparency.
 */
export function ImageField({ path, label, help, maxSide = 1400, keepFormat }: Base & { maxSide?: number; keepFormat?: boolean }) {
  const [value, setValue] = useField<string>(path);
  const { url: stored } = useFileUrl(value);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<string>();
  const preview = picked ?? stored;
  const toast = useToast();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast("bad", "That isn't an image.");
    setBusy(true);
    const shown = URL.createObjectURL(file);
    setPicked(shown);
    checkpoint();
    try {
      const skip = keepFormat && /^image\/(png|svg\+xml|webp)$/.test(file.type);
      const blob = !skip && file.type.startsWith("image/") && file.size > 400_000 ? await resizeImage(file, maxSide) : file;
      const ref = await uploadFile(blob, file.name, "image");
      rememberUpload(ref, blob);
      setValue(ref);
    } catch (err) {
      toast("bad", err instanceof Error && err.message ? err.message : "Could not upload that image. Try again.");
    } finally {
      URL.revokeObjectURL(shown);
      setPicked(undefined);
      setBusy(false);
    }
  };

  return (
    <Dropzone
      accept="image/*"
      label={label}
      hint={help}
      busy={busy}
      onFile={(f) => void onFile(f)}
      current={
        <div className="flex items-center gap-3">
          <span className={`grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-st-border-strong bg-st-panel ${busy ? "animate-pulse" : ""}`}>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- a blob: URL from IndexedDB; next/image can't load it
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] text-st-dim">None</span>
            )}
          </span>
          {busy && <span className="text-[12px] text-st-sub">Uploading…</span>}
          {value && !busy && (
            <button
              type="button"
              onClick={() => {
                checkpoint();
                setValue("");
              }}
              className="text-[12px] text-st-dim hover:text-st-danger"
            >
              Remove
            </button>
          )}
        </div>
      }
    />
  );
}

/** A required PDF upload (a book's file). Writes the id/name/size as three sibling fields. */
export function PdfField({ idPath, namePath, sizePath, label, help }: { idPath: Path; namePath: Path; sizePath: Path; label: string; help?: string }) {
  const [fileId, setFileId] = useField<string | undefined>(idPath);
  const [name, setName] = useField<string | undefined>(namePath);
  const [, setSize] = useField<number | undefined>(sizePath);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    checkpoint();
    try {
      const ref = await uploadFile(file, file.name, "pdf");
      setFileId(ref);
      setName(file.name);
      setSize(file.size);
    } catch (err) {
      toast("bad", err instanceof Error && err.message ? err.message : "Could not upload that PDF. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dropzone
      accept="application/pdf"
      label={label}
      hint={help}
      busy={busy}
      onFile={(f) => void onFile(f)}
      current={
        busy ? (
          <span className="text-[12.5px] text-st-sub">Uploading {"…"}</span>
        ) : fileId ? (
          <span className="flex items-center justify-center gap-1.5 text-[12.5px] text-st-ink">
            <span className="text-st-good">
              <Icon name="check" size={13} />
            </span>
            {name}
          </span>
        ) : (
          <span className="text-[12.5px] text-st-danger">No PDF yet — requests will wait</span>
        )
      }
    />
  );
}
