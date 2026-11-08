import React, { useMemo, useRef, useState, useEffect } from "react";

/**
 * Simple Chord Diagram Editor (Guitar)
 *
 * v4.8 (fix JSX + números laterales)
 * - Soluciona error por etiqueta/etiquetas sin cerrar (<g>/<text>).
 * - Mantiene números absolutos de traste en el lateral izquierdo.
 * - UI limpia (sin badge especial ni líneas de trazo naranja) + interacción completa.
 * - Exportación PNG/JSON con nombre basado en el acorde.
 */

// ===== Utilidades básicas =====
const STRINGS = ["E", "A", "D", "G", "B", "e"]; // grave→aguda
const OPEN_NOTES = ["E", "A", "D", "G", "B", "E"]; // afinación estándar
const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteAt(openNote: string, fret: number): string {
  const base = NOTES.indexOf(openNote);
  return NOTES[(base + fret) % 12];
}

// ===== Tipos =====
export type Marker = { stringIndex: number; fret: number; label: string };
export type StringTopState = { mute: boolean; open: boolean };
export type DiagramState = {
  frets: number;
  startFret: number; // 1 = cejuela
  chordName: string; // manual (opcional)
  markers: Marker[];
  tops: StringTopState[]; // 6 elementos
};

const defaultState: DiagramState = {
  frets: 5,
  startFret: 1,
  chordName: "",
  markers: [],
  tops: Array(6)
    .fill(null)
    .map(() => ({ mute: false, open: false })),
};

// ===== Persistencia =====
function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue] as const;
}

// ===== Motor de nombres =====
function buildNameFromNotes(notesUniq: string[], root: string): string {
  if (notesUniq.length === 0) return "Acorde";
  const rIdx = NOTES.indexOf(root);
  const has = (s: number) => notesUniq.some((n) => (NOTES.indexOf(n) - rIdx + 12) % 12 === s);

  const has2 = has(2) || has(14 % 12); // 2/9
  const b3 = has(3);
  const M3 = has(4);
  const sus4 = has(5);
  const b5 = has(6);
  const P5 = has(7);
  const sharp5 = has(8);
  const M6 = has(9);
  const b7 = has(10);
  const M7 = has(11);

  let name = root;
  let isSus = false;

  // Triadas / calidad
  if (b3 && b5) {
    name += "°"; // disminuido
  } else if (M3 && sharp5) {
    name += "+"; // aumentado
  } else if (b3) {
    name += "m";
  } else if (M3) {
    // mayor implícito
  } else {
    if (sus4 && !has2) { name += "sus4"; isSus = true; }
    else if (has2 && !sus4) { name += "sus2"; isSus = true; }
    else if (P5) { return root + "5"; }
    else { return root; }
  }

  // Séptimas
  if (M3 && b7) name += "7"; // dominante
  else if (b3 && b7) name = root + "m7";
  else if (M3 && M7) name += "maj7";
  else if (b3 && M7) name += "(maj7)"; // m(maj7)

  // Sexta (solo si no hay 7 ya)
  if (!/7/.test(name) && M6) name += "6";

  // Extensiones tipo add (si hay tercera y no es sus)
  if (!isSus && (M3 || b3)) {
    if (has2) name += "add9";
    if (sus4) name += "add11";
  }

  // Alteraciones de 5ª si no quedó como dim/aug
  const isDimTriad = b3 && b5;
  const isAugTriad = M3 && sharp5;
  if (!isDimTriad && !isAugTriad) {
    if (b5 && !P5) name += "(b5)";
    if (sharp5 && !P5) name += "(#5)";
  }

  return name;
}

function guessChordName(state: DiagramState): string {
  const played: { note: string; stringIndex: number }[] = [];
  for (let s = 0; s < STRINGS.length; s++) {
    const t = state.tops[s];
    if (t.mute) continue;
    const m = state.markers.find((x) => x.stringIndex === s);
    if (m) played.push({ note: noteAt(OPEN_NOTES[s], m.fret + state.startFret - 1), stringIndex: s });
    else if (t.open) played.push({ note: OPEN_NOTES[s], stringIndex: s });
  }
  if (played.length === 0) return "Acorde";
  const root = played[0].note; // más grave que suena
  const uniq = Array.from(new Set(played.map((p) => p.note)));
  return buildNameFromNotes(uniq, root);
}

// ===== Autotests simples (consola) =====
function runSelfTests() {
  const t = (label: string, notesLowToHigh: string[], expected: string) => {
    const root = notesLowToHigh[0];
    const uniq = Array.from(new Set(notesLowToHigh));
    const got = buildNameFromNotes(uniq, root);
    const ok = got === expected;
    // eslint-disable-next-line no-console
    console[ok ? "log" : "error"](`TEST ${label}: ${ok ? "OK" : `FAIL → ${got} (esperado ${expected})`}`);
  };
  t("C mayor", ["C", "E", "G"], "C");
  t("C menor", ["C", "D#", "G"], "Cm");
  t("G7", ["G", "B", "D", "F"], "G7");
  t("Dm7", ["D", "F", "A", "C"], "Dm7");
  t("Asus4", ["A", "D", "E"], "Asus4");
  t("Csus2", ["C", "D", "G"], "Csus2");
  t("Cmaj7", ["C", "E", "G", "B"], "Cmaj7");
  t("B°", ["B", "D", "F"], "B°");
  t("C+", ["C", "E", "G#"], "C+");
  t("Cadd9", ["C", "E", "G", "D"], "Cadd9");
  t("Am(maj7)", ["A", "C", "E", "G#"], "Am(maj7)");
  // Tests extra
  t("C5", ["C", "G"], "C5");
  t("E°", ["E", "G", "A#"], "E°"); // E dim triad (E G Bb)
}

// ===== Componente principal =====
export default function ChordEditor() {
  const [state, setState] = useLocalState<DiagramState>("chord-editor-state-v4", defaultState);
  const [markerStyle, setMarkerStyle] = useState<"dot" | "1" | "2" | "3" | "4">("dot");
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [pngUrl, setPngUrl] = useState<string>("");
  const [jsonUrl, setJsonUrl] = useState<string>("");
  const [jsonText, setJsonText] = useState<string>("");

  useEffect(() => { runSelfTests(); }, []);

  const width = 420; const height = 520;
  const padding = { top: 90, right: 40, bottom: 50, left: 60 } as const;
  const gridW = width - padding.left - padding.right;
  const gridH = height - padding.top - padding.bottom;
  const stringX = (i: number) => padding.left + (i * gridW) / (STRINGS.length - 1);
  const fretY = (f: number) => padding.top + ((f - 1) * gridH) / state.frets;

  const markerAt = (stringIndex: number) => state.markers.find((m) => m.stringIndex === stringIndex);
  const autoName = useMemo(() => guessChordName(state), [state]);
  const safeFile = (state.chordName || autoName || "acorde").replace(/[^a-zA-Z0-9_\-]+/g, "_");

  // ===== Interacción =====
  const toggleCell = (stringIndex: number, fret: number) => {
    setState((prev) => {
      const ex = prev.markers.find((m) => m.stringIndex === stringIndex);
      let next: Marker[];
      if (ex && ex.fret === fret) next = prev.markers.filter((m) => m !== ex);
      else {
        const label = markerStyle === "dot" ? "•" : markerStyle;
        next = prev.markers.filter((m) => m.stringIndex !== stringIndex).concat([{ stringIndex, fret, label }]);
      }
      const tops = prev.tops.map((t, i) => (i === stringIndex && next.some((m) => m.stringIndex === i)) ? { mute: false, open: false } : t);
      return { ...prev, markers: next, tops };
    });
  };

  const cycleTop = (stringIndex: number) => {
    setState((prev) => {
      const t = prev.tops[stringIndex];
      const next: StringTopState = t.open ? { mute: true, open: false } : t.mute ? { mute: false, open: false } : { mute: false, open: true };
      const markers = prev.markers.filter((m) => m.stringIndex !== stringIndex);
      return { ...prev, tops: prev.tops.map((v, i) => (i === stringIndex ? next : v)), markers };
    });
  };

  const clearAll = () => { setState(defaultState); setPngUrl(""); setJsonUrl(""); setJsonText(""); };

  // ===== Exportación (CSP-safe) =====
  const forceDownload = (href: string, filename: string) => {
    try { const a = document.createElement("a"); a.href = href; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); } catch {}
  };

  const exportJSON = () => {
    try {
      const data = JSON.stringify(state, null, 2);
      const dataUrl = "data:application/json;charset=utf-8," + encodeURIComponent(data);
      setJsonText(data); setJsonUrl(dataUrl);
      forceDownload(dataUrl, `acorde_${safeFile}.json`);
    } catch { alert("No se pudo exportar el JSON"); }
  };

  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try { const obj = JSON.parse(String(reader.result)); setState({ ...defaultState, ...obj }); }
      catch { alert("Archivo JSON inválido"); }
    };
    reader.readAsText(file);
  };

  const exportPNG = async () => {
    const svg = svgRef.current; if (!svg) return;
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const xml = new XMLSerializer().serializeToString(svg);
    const svgDataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height; // 1x para preview estable
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      ctx.fillStyle = "#eef2f7"; ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const url = canvas.toDataURL("image/png"); setPngUrl(url); forceDownload(url, `acorde_${safeFile}.png`);
    };
    img.src = svgDataUrl;
  };

  // ===== Grid =====
  const grid = useMemo(() => {
    const lines: JSX.Element[] = [];
    for (let f = 0; f <= state.frets; f++) {
      const y = padding.top + (f * gridH) / state.frets;
      const thick = f === 0 && state.startFret === 1;
      lines.push(
        <line key={`f${f}`} x1={padding.left} x2={padding.left + gridW} y1={y} y2={y} stroke="#1f2937" strokeWidth={thick ? 6 : 2} opacity={thick ? 1 : 0.85} />
      );

      if (f > 0) {
        const absolute = state.startFret + f - 1;
        const yTop = fretY(f);
        const yBot = fretY(f + 1) || padding.top + gridH;
        const cy = (yTop + yBot) / 2;
        lines.push(
          <text key={`fnum-${f}`} x={padding.left - 10} y={cy + 4} textAnchor="end" fontSize={12} fill="#64748b">{absolute}</text>
        );
      }
    }
    for (let s = 0; s < STRINGS.length; s++) {
      const x = stringX(s);
      lines.push(
        <line key={`s${s}`} x1={x} x2={x} y1={padding.top} y2={padding.top + gridH} stroke="#1f2937" strokeWidth={2} opacity={0.85} />
      );
    }
    return lines;
  }, [state.frets, state.startFret]);

  return (
    <div className="w-full min-h-screen bg-slate-100 flex items-start justify-center p-6">
      <div className="grid gap-6 max-w-5xl w-full" style={{ gridTemplateColumns: "420px 1fr" }}>
        {/* Lienzo */}
        <div className="bg-white rounded-2xl shadow p-4">
          <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" className="rounded-xl" xmlns="http://www.w3.org/2000/svg">
            <rect x={0} y={0} width={width} height={height} fill="#eef2f7" />
            <text x={width / 2} y={40} textAnchor="middle" fontSize={28} fontWeight={700} fill="#ef7e51">{state.chordName || autoName || "Acorde"}</text>

            {/* Etiquetas de cuerdas */}
            {STRINGS.map((name, i) => (
              <text key={`lbl${i}`} x={stringX(i)} y={70} textAnchor="middle" fontSize={14} fill="#334155">{name}</text>
            ))}

            {grid}

            {/* Celdas clicables (marcadores) */}
            {Array.from({ length: state.frets }, (_, f) => f + 1).map((fret) => (
              <g key={`row${fret}`}>
                {STRINGS.map((_, s) => {
                  const x = stringX(s);
                  const yTop = fretY(fret);
                  const yBot = fretY(fret + 1) || padding.top + gridH;
                  const cx = x; const cy = (yTop + yBot) / 2; const r = 14;
                  const m = markerAt(s); const isHere = !!m && m.fret === fret;
                  return (
                    <g key={`cell${s}-${fret}`} onClick={() => toggleCell(s, fret)} className="cursor-pointer">
                      <circle cx={cx} cy={cy} r={r} fill={isHere ? "#ef7e51" : "transparent"} opacity={isHere ? 1 : 0.1} />
                      {isHere && (
                        <text
                          x={cx}
                          y={cy + 5}
                          textAnchor="middle"
                          fontSize={m?.label === "•" ? 26 : 16}
                          fontWeight={600}
                          fill="#ffffff"
                        >
                          {m?.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            ))}

            {/* X / O arriba (zona ampliada y letra clicable) */}
            {STRINGS.map((_, s) => {
              const x = stringX(s); const t = state.tops[s]; const label = t.mute ? "X" : t.open ? "O" : "";
              return (
                <g key={`top${s}`} className="cursor-pointer">
                  <rect x={x - 20} y={padding.top - 40} width={40} height={36} fill="transparent" onClick={() => cycleTop(s)} />
                  <text x={x} y={padding.top - 18} textAnchor="middle" fontSize={18} fontWeight={700} fill="#334155" onClick={() => cycleTop(s)}>{label}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Panel de control */}
        <div className="bg-white rounded-2xl shadow p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <label className="col-span-2 text-sm text-slate-600">Nombre del acorde (manual, opcional)</label>
            <input className="col-span-2 border rounded-xl px-3 py-2" value={state.chordName} onChange={(e) => setState({ ...state, chordName: e.target.value })} placeholder={autoName || "Acorde"} />

            <div>
              <label className="text-sm text-slate-600">Frets visibles</label>
              <input type="number" min={3} max={8} className="w-full border rounded-xl px-3 py-2" value={state.frets} onChange={(e) => setState({ ...state, frets: Math.max(3, Math.min(8, Number(e.target.value) || 5)) })} />
            </div>
            <div>
              <label className="text-sm text-slate-600">Traste inicial</label>
              <input type="number" min={1} max={20} className="w-full border rounded-xl px-3 py-2" value={state.startFret} onChange={(e) => setState({ ...state, startFret: Math.max(1, Number(e.target.value) || 1) })} />
            </div>

            <div>
              <label className="text-sm text-slate-600">Estilo del marcador</label>
              <select className="w-full border rounded-xl px-3 py-2" value={markerStyle} onChange={(e) => setMarkerStyle(e.target.value as any)}>
                <option value="dot">Punto (•)</option>
                <option value="1">Dedo 1</option>
                <option value="2">Dedo 2</option>
                <option value="3">Dedo 3</option>
                <option value="4">Dedo 4</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300" onClick={() => setState({ ...state, markers: [] })}>Borrar marcadores</button>
              <button className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300" onClick={() => setState({ ...state, tops: defaultState.tops })}>Borrar X/O</button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 rounded-2xl bg-slate-900 text-white hover:opacity-90" onClick={exportPNG}>Generar PNG</button>
            <button className="px-4 py-2 rounded-2xl bg-slate-700 text-white hover:opacity-90" onClick={exportJSON}>Generar JSON</button>
            {pngUrl && (<a className="px-4 py-2 rounded-2xl bg-emerald-600 text-white hover:opacity-90" href={pngUrl} download={`acorde_${safeFile}.png`} target="_blank" rel="noreferrer">Descargar PNG</a>)}
            {jsonUrl && (<a className="px-4 py-2 rounded-2xl bg-emerald-600 text-white hover:opacity-90" href={jsonUrl} download={`acorde_${safeFile}.json`} target="_blank" rel="noreferrer">Descargar JSON</a>)}
            <label className="px-4 py-2 rounded-2xl bg-slate-200 cursor-pointer hover:bg-slate-300">
              Importar JSON
              <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files && importJSON(e.target.files[0])} />
            </label>
            <button className="px-4 py-2 rounded-2xl bg-rose-600 text-white hover:opacity-90" onClick={clearAll}>Limpiar todo</button>
          </div>

          {pngUrl && (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">Previsualización PNG (clic derecho → Guardar imagen como...):</p>
              <img src={pngUrl} alt="preview" className="bg-white rounded-xl shadow max-w-sm" />
            </div>
          )}

          {jsonText && (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">JSON exportado (puedes copiar/pegar si el navegador bloquea la descarga):</p>
              <textarea className="w-full h-40 border rounded-xl p-2 font-mono text-xs" readOnly value={jsonText} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
