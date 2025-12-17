import React, { useEffect, useMemo, useRef, useState } from "react";

// UB Brand-inspired palette (primary + a few neutrals)
const COLORS = {
  ubBlue: "#005bbb",
  white: "#ffffff",
  ink: "#0b1220",
  slate: "#334155",
  slate2: "#475569",
  border: "#e2e8f0",
  bg: "#f8fafc",
  card: "#ffffff",
  dangerBg: "#fff1f2",
  dangerBorder: "#fecdd3",
  successBg: "#f0fdf4",
  successBorder: "#bbf7d0",
};

// Letter-grade scale (from the spreadsheet)
const GRADE_VALUES: Record<string, number> = {
  A: 4.0,
  "A-": 3.67,
  "B+": 3.33,
  B: 3.0,
  "B-": 2.67,
  "C+": 2.33,
  C: 2.0,
  "C-": 1.67,
  "D+": 1.33,
  D: 1.0,
  F: 0.0,
};

const LETTER_GRADE_OPTIONS = ["", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"] as const;
const SU_GRADE_OPTIONS = ["", "S", "U"] as const;

// Probation rules (internal):
// - Any core/non-elective course below B-
// - OR overall GPA below 3.0
// - OR any Field/Field Seminar course with a U (S/U does not impact GPA)
const B_MINUS_VALUE = GRADE_VALUES["B-"];

type CourseDef = {
  id: string; // e.g., "500" or "555 part 1"
  title?: string;
  creditOptions: number[];
  isCore?: boolean;
  isField?: boolean;
};

type RowKind = "core" | "elective" | "field";

type Row = {
  key: string;
  kind: RowKind;
  courseId: string;
  credit: number;
  grade: string; // validated per row kind
};

// Courses/credits from the spreadsheet (Simplified tab)
// Titles for the core required courses are from the Traditional MSW Curriculum Advising Guide.
const COURSE_DEFS: CourseDef[] = [
  // Core (GPA-bearing)
  { id: "500", title: "SW 500 Social Welfare History", creditOptions: [3], isCore: true },
  { id: "502", title: "SW 502 Social Welfare Policy", creditOptions: [3], isCore: true },
  { id: "503", title: "SW 503 Power, Privilege and Oppression", creditOptions: [3], isCore: true },
  { id: "505", title: "SW 505 Theories of Human Behavior and Development", creditOptions: [3], isCore: true },
  { id: "506", title: "SW 506 Theories of Organizational Behavior and Development", creditOptions: [3], isCore: true },
  { id: "510", title: "SW 510 Introduction to Social Work Research and Evaluation", creditOptions: [3], isCore: true },
  { id: "520", title: "SW 520 Interventions I", creditOptions: [3], isCore: true },
  { id: "521", title: "SW 521 Interventions II", creditOptions: [3], isCore: true },
  { id: "542", title: "SW 542 Perspectives on Trauma and Human Rights", creditOptions: [3], isCore: true },

  // Field / Practicum (S/U only; excluded from GPA)
  { id: "550", title: "SW 550 Field Instruction I", creditOptions: [3], isField: true },
  { id: "551", title: "SW 551 Field Instruction II", creditOptions: [4], isField: true },
  { id: "552", title: "SW 552 Field Instruction III", creditOptions: [4], isField: true },
  { id: "553", title: "SW 553 Field Instruction IV", creditOptions: [3], isField: true },
  { id: "555 part 1", title: "SW 555 Field Seminar (Part 1)", creditOptions: [0.5], isField: true },
  { id: "555 part 2", title: "SW 555 Field Seminar (Part 2)", creditOptions: [0.5], isField: true },

  // Electives/other courses listed in the spreadsheet’s credit table
  { id: "522", title: "SW 522", creditOptions: [3] },
  { id: "523", title: "SW 523", creditOptions: [3] },
  { id: "524", title: "SW 524", creditOptions: [3] },
  { id: "525", title: "SW 525", creditOptions: [3] },
  { id: "526", title: "SW 526", creditOptions: [3] },
  { id: "527", title: "SW 527", creditOptions: [3] },
  { id: "528", title: "SW 528", creditOptions: [3] },
  { id: "530", title: "SW 530", creditOptions: [3] },
  { id: "531", title: "SW 531", creditOptions: [3] },
  { id: "560", title: "SW 560", creditOptions: [3] },
  { id: "561", title: "SW 561", creditOptions: [3] },
  { id: "562", title: "SW 562", creditOptions: [3] },
  { id: "563", title: "SW 563", creditOptions: [3] },
  { id: "564", title: "SW 564", creditOptions: [3] },
  { id: "565", title: "SW 565", creditOptions: [3] },
  { id: "566", title: "SW 566", creditOptions: [3] },
  { id: "567", title: "SW 567", creditOptions: [3] },
  { id: "568", title: "SW 568", creditOptions: [3] },
  { id: "569", title: "SW 569", creditOptions: [3] },
  { id: "570", title: "SW 570", creditOptions: [3] },
  { id: "571", title: "SW 571", creditOptions: [3] },
  { id: "572", title: "SW 572", creditOptions: [3] },
  { id: "574", title: "SW 574", creditOptions: [3] },
  { id: "575", title: "SW 575", creditOptions: [3] },
  { id: "576", title: "SW 576", creditOptions: [3] },
  { id: "577", title: "SW 577", creditOptions: [3] },
  { id: "578", title: "SW 578", creditOptions: [3] },
  { id: "579", title: "SW 579", creditOptions: [3] },
  { id: "581", title: "SW 581", creditOptions: [3] },
  { id: "582", title: "SW 582", creditOptions: [3] },
  { id: "583", title: "SW 583", creditOptions: [3] },
  { id: "585", title: "SW 585", creditOptions: [3] },
  { id: "586", title: "SW 586", creditOptions: [3] },
  { id: "588", title: "SW 588", creditOptions: [3] },
  { id: "590", title: "SW 590", creditOptions: [3] },
  { id: "592", title: "SW 592", creditOptions: [3] },
  { id: "594", title: "SW 594", creditOptions: [3] },
  { id: "596", title: "SW 596", creditOptions: [3] },
  { id: "599", title: "SW 599", creditOptions: [3] },
  { id: "617", title: "SW 617", creditOptions: [3] },
  { id: "618", title: "SW 618", creditOptions: [3] },
  { id: "619", title: "SW 619", creditOptions: [3] },
  { id: "621", title: "SW 621", creditOptions: [3] },
  { id: "622", title: "SW 622", creditOptions: [3] },
  { id: "623", title: "SW 623", creditOptions: [3] },
  { id: "624", title: "SW 624", creditOptions: [3] },
  { id: "625", title: "SW 625", creditOptions: [3] },
  { id: "626", title: "SW 626", creditOptions: [3] },
  { id: "627", title: "SW 627", creditOptions: [3] },
  { id: "628", title: "SW 628", creditOptions: [3] },
  { id: "629", title: "SW 629", creditOptions: [3] },
  { id: "630", title: "SW 630", creditOptions: [3] },
  { id: "631", title: "SW 631", creditOptions: [3] },
  { id: "700", title: "SW 700", creditOptions: [1, 2] },
  { id: "703", title: "SW 703", creditOptions: [2] },
  { id: "704", title: "SW 704", creditOptions: [2] },
  { id: "705", title: "SW 705", creditOptions: [2] },
  { id: "706", title: "SW 706", creditOptions: [3] },
  { id: "554", title: "SW 554", creditOptions: [3] },
  { id: "556", title: "SW 556", creditOptions: [3] },
  { id: "557", title: "SW 557", creditOptions: [3] },
  { id: "559", title: "SW 559", creditOptions: [3] },
  { id: "573", title: "SW 573", creditOptions: [3] },
  { id: "580", title: "SW 580", creditOptions: [3] },
  { id: "584", title: "SW 584", creditOptions: [3] },
  { id: "587", title: "SW 587", creditOptions: [3] },
  { id: "589", title: "SW 589", creditOptions: [3] },
  { id: "591", title: "SW 591", creditOptions: [3] },
  { id: "593", title: "SW 593", creditOptions: [3] },
  { id: "595", title: "SW 595", creditOptions: [3] },
  { id: "597", title: "SW 597", creditOptions: [3] },
  { id: "598", title: "SW 598", creditOptions: [3] },

  // Manual elective placeholder
  { id: "MANUAL", title: "Manual elective entry", creditOptions: [1, 2, 3] },
];

const CORE_ORDER = ["500", "502", "503", "505", "506", "510", "520", "521", "542"];
const FIELD_ORDER = ["550", "551", "552", "553", "555 part 1", "555 part 2"];

function uid(prefix = "row") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function formatGpa(x: number | null) {
  if (x == null || !Number.isFinite(x)) return "—";
  return x.toFixed(3);
}

function safeNumber(n: unknown): number | null {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : null;
}

function getCourseDef(courseId: string): CourseDef | undefined {
  return COURSE_DEFS.find((c) => c.id === courseId);
}

function defaultCreditFor(courseId: string): number {
  const def = getCourseDef(courseId);
  return def?.creditOptions?.[0] ?? 3;
}

function courseLabel(def: CourseDef) {
  return def.title ? def.title : `SW ${def.id}`;
}

function isBelowBMinus(letterGrade: string) {
  const v = GRADE_VALUES[letterGrade];
  if (v == null) return false;
  return v < B_MINUS_VALUE;
}

function normalizeKind(k: any): RowKind {
  if (k === "core" || k === "elective" || k === "field") return k;
  return "core";
}

function normalizeGrade(kind: RowKind, g: any): string {
  const s = typeof g === "string" ? g : "";
  if (kind === "field") {
    return (SU_GRADE_OPTIONS as readonly string[]).includes(s) ? s : "";
  }
  return (LETTER_GRADE_OPTIONS as readonly string[]).includes(s) ? s : "";
}

const STORAGE_KEY = "ub_ssw_internal_gpa_calc_v2";

function calcTotals(rows: Row[]) {
  const coreRows = rows.filter((r) => r.kind === "core");
  const fieldRows = rows.filter((r) => r.kind === "field");

  let totalCreditsAttempted = 0;
  let gpaCredits = 0;
  let points = 0;

  for (const r of rows) {
    totalCreditsAttempted += r.credit;

    // Field/Practicum is S/U only and excluded from GPA
    if (r.kind === "field") continue;

    // Only count GPA for letter grades (A-F); blank means not yet graded
    if (!r.grade) continue;
    const gv = GRADE_VALUES[r.grade];
    if (gv == null) continue;

    points += r.credit * gv;
    gpaCredits += r.credit;
  }

  const gpa = gpaCredits > 0 ? points / gpaCredits : null;

  const coreViolations = coreRows.filter((r) => r.grade && isBelowBMinus(r.grade));
  const fieldViolations = fieldRows.filter((r) => r.grade === "U");
  const gpaViolation = gpa != null ? gpa < 3.0 : false;

  return {
    totalCreditsAttempted,
    gpaCredits,
    points,
    gpa,
    coreViolations,
    fieldViolations,
    gpaViolation,
    onProbation: coreViolations.length > 0 || fieldViolations.length > 0 || gpaViolation,
  };
}

function runSelfTestsOnce() {
  // Lightweight dev-time checks (no external test runner in this environment)
  const r1: Row[] = [
    { key: "1", kind: "core", courseId: "500", credit: 3, grade: "A" },
    { key: "2", kind: "core", courseId: "502", credit: 3, grade: "B" },
    { key: "3", kind: "field", courseId: "550", credit: 3, grade: "S" },
  ];
  const t1 = calcTotals(r1);
  console.assert(Math.abs((t1.gpa ?? 0) - 3.5) < 1e-9, "Test 1 GPA should be 3.5");
  console.assert(t1.onProbation === false, "Test 1 should not be on probation");

  const r2: Row[] = [
    { key: "1", kind: "core", courseId: "500", credit: 3, grade: "B-" },
    { key: "2", kind: "core", courseId: "502", credit: 3, grade: "C+" },
  ];
  const t2 = calcTotals(r2);
  console.assert(t2.coreViolations.length === 1, "Test 2 should flag C+ as below B-");
  console.assert(t2.onProbation === true, "Test 2 should be on probation");

  const r3: Row[] = [{ key: "1", kind: "field", courseId: "551", credit: 4, grade: "U" }];
  const t3 = calcTotals(r3);
  console.assert(t3.fieldViolations.length === 1, "Test 3 should flag U in field");
  console.assert(t3.onProbation === true, "Test 3 should be on probation");

  // Additional tests: GPA threshold trigger only
  const r4: Row[] = [
    { key: "1", kind: "core", courseId: "500", credit: 3, grade: "B" }, // 3.0
    { key: "2", kind: "elective", courseId: "522", credit: 3, grade: "C" }, // 2.0 => overall 2.5
  ];
  const t4 = calcTotals(r4);
  console.assert(t4.gpa != null && t4.gpa < 3.0, "Test 4 GPA should be below 3.0");
  console.assert(t4.coreViolations.length === 0, "Test 4 should have no core below B-");
  console.assert(t4.fieldViolations.length === 0, "Test 4 should have no field violations");
  console.assert(t4.onProbation === true, "Test 4 should be on probation due to GPA < 3.0");

  // Additional tests: Field S should not affect GPA credits/points
  const r5: Row[] = [
    { key: "1", kind: "core", courseId: "500", credit: 3, grade: "A" }, // 12 points
    { key: "2", kind: "field", courseId: "550", credit: 3, grade: "S" }, // ignored
  ];
  const t5 = calcTotals(r5);
  console.assert(t5.gpaCredits === 3, "Test 5 GPA credits should ignore field");
  console.assert(Math.abs((t5.gpa ?? 0) - 4.0) < 1e-9, "Test 5 GPA should be 4.0");
}

export default function App() {
  const didRunTests = useRef(false);
  useEffect(() => {
    if (didRunTests.current) return;
    didRunTests.current = true;
    runSelfTestsOnce();
  }, []);

  const [rows, setRows] = useState<Row[]>(() => {
    const coreRows: Row[] = CORE_ORDER.map((cid) => ({
      key: uid("core"),
      kind: "core",
      courseId: cid,
      credit: defaultCreditFor(cid),
      grade: "",
    }));

    const fieldRows: Row[] = FIELD_ORDER.map((cid) => ({
      key: uid("field"),
      kind: "field",
      courseId: cid,
      credit: defaultCreditFor(cid),
      grade: "",
    }));

    return [...coreRows, ...fieldRows];
  });

  // Load from localStorage (if present)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      const cleaned: Row[] = parsed
        .filter((r: any) => r && typeof r === "object")
        .map((r: any) => {
          const kind = normalizeKind(r.kind);
          const courseId = typeof r.courseId === "string" ? r.courseId : "MANUAL";
          const credit = typeof r.credit === "number" && Number.isFinite(r.credit) ? r.credit : 3;
          return {
            key: typeof r.key === "string" ? r.key : uid("row"),
            kind,
            courseId,
            credit,
            grade: normalizeGrade(kind, r.grade),
          };
        });

      // Rebuild core in canonical order
      const coreMap = new Map(cleaned.filter((r) => r.kind === "core").map((r) => [r.courseId, r]));
      const rebuiltCore: Row[] = CORE_ORDER.map((cid) =>
        coreMap.get(cid) ?? {
          key: uid("core"),
          kind: "core",
          courseId: cid,
          credit: defaultCreditFor(cid),
          grade: "",
        }
      );

      // Rebuild field in canonical order
      const fieldMap = new Map(cleaned.filter((r) => r.kind === "field").map((r) => [r.courseId, r]));
      const rebuiltField: Row[] = FIELD_ORDER.map((cid) =>
        fieldMap.get(cid) ?? {
          key: uid("field"),
          kind: "field",
          courseId: cid,
          credit: defaultCreditFor(cid),
          grade: "",
        }
      );

      const electives = cleaned.filter((r) => r.kind === "elective");
      setRows([...rebuiltCore, ...electives, ...rebuiltField]);
    } catch {
      // ignore
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch {
      // ignore
    }
  }, [rows]);

  const core = useMemo(() => rows.filter((r) => r.kind === "core"), [rows]);
  const electives = useMemo(() => rows.filter((r) => r.kind === "elective"), [rows]);
  const field = useMemo(() => rows.filter((r) => r.kind === "field"), [rows]);

  const totals = useMemo(() => calcTotals(rows), [rows]);

  const setRow = (key: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const addElective = () => {
    const firstElectiveCourse = COURSE_DEFS.find((c) => !c.isCore && !c.isField)?.id ?? "MANUAL";
    setRows((prev) => [
      ...prev,
      {
        key: uid("el"),
        kind: "elective",
        courseId: firstElectiveCourse,
        credit: defaultCreditFor(firstElectiveCourse),
        grade: "",
      },
    ]);
  };

  const removeElective = (key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const resetAll = () => {
    const coreRows: Row[] = CORE_ORDER.map((cid) => ({
      key: uid("core"),
      kind: "core",
      courseId: cid,
      credit: defaultCreditFor(cid),
      grade: "",
    }));

    const fieldRows: Row[] = FIELD_ORDER.map((cid) => ({
      key: uid("field"),
      kind: "field",
      courseId: cid,
      credit: defaultCreditFor(cid),
      grade: "",
    }));

    setRows([...coreRows, ...fieldRows]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const Card = ({
    title,
    tone = "neutral",
    children,
    right,
  }: {
    title: string;
    tone?: "neutral" | "danger" | "success";
    children: React.ReactNode;
    right?: React.ReactNode;
  }) => {
    const toneStyles =
      tone === "danger"
        ? { background: COLORS.dangerBg, borderColor: COLORS.dangerBorder }
        : tone === "success"
        ? { background: COLORS.successBg, borderColor: COLORS.successBorder }
        : { background: COLORS.card, borderColor: COLORS.border };

    return (
      <div
        style={{
          border: `1px solid ${toneStyles.borderColor}`,
          background: toneStyles.background,
          borderRadius: 16,
          boxShadow: "0 1px 0 rgba(2,6,23,0.04)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: `1px solid ${toneStyles.borderColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 800, color: COLORS.ink }}>{title}</div>
          {right}
        </div>
        <div style={{ padding: 16 }}>{children}</div>
      </div>
    );
  };

  const SummaryPill = ({ label, value }: { label: string; value: string }) => (
    <div
      style={{
        border: `1px solid ${COLORS.border}`,
        background: COLORS.white,
        borderRadius: 999,
        padding: "10px 12px",
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        minWidth: 180,
      }}
    >
      <div style={{ fontSize: 12, color: COLORS.slate2, fontWeight: 800, letterSpacing: 0.2 }}>{label}</div>
      <div style={{ fontSize: 18, color: COLORS.ink, fontWeight: 900, marginLeft: "auto" }}>{value}</div>
    </div>
  );

  const ProbationBanner = () => {
    if (!totals.onProbation) return null;

    const reasons: string[] = [];
    if (totals.coreViolations.length > 0) reasons.push("at least one core/non-elective grade is below B-");
    if (totals.fieldViolations.length > 0) reasons.push("a Field/Field Seminar grade is U");
    if (totals.gpaViolation) reasons.push("overall GPA is below 3.0");

    return (
      <div
        style={{
          border: `1px solid ${COLORS.dangerBorder}`,
          background: COLORS.dangerBg,
          borderRadius: 16,
          padding: 16,
          fontWeight: 900,
          color: "#9f1239",
        }}
      >
        Academic probation indicator: <span style={{ fontWeight: 900 }}>{reasons.join(" and ")}</span>.
      </div>
    );
  };

  const Table = ({
    title,
    data,
    kind,
    showRemove,
    tone,
  }: {
    title: string;
    data: Row[];
    kind: RowKind;
    showRemove?: boolean;
    tone?: "neutral" | "danger" | "success";
  }) => {
    const courseOptions =
      kind === "elective"
        ? COURSE_DEFS.filter((c) => !c.isCore && !c.isField)
        : kind === "core"
        ? COURSE_DEFS.filter((c) => c.isCore)
        : COURSE_DEFS.filter((c) => c.isField);

    const gradeOptions = kind === "field" ? SU_GRADE_OPTIONS : LETTER_GRADE_OPTIONS;

    return (
      <Card
        title={title}
        tone={tone}
        right={
          title === "Electives" ? (
            <button
              onClick={addElective}
              style={{
                background: COLORS.ubBlue,
                color: COLORS.white,
                border: "none",
                borderRadius: 12,
                padding: "10px 12px",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              + Add elective
            </button>
          ) : null
        }
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr>
                <th style={thStyle}>Course</th>
                <th style={thStyle}>Credits</th>
                <th style={thStyle}>Grade</th>
                <th style={thStyle}>Value</th>
                <th style={thStyle}>Points</th>
                {showRemove ? <th style={thStyle}></th> : null}
              </tr>
            </thead>
            <tbody>
              {data.map((r) => {
                const def = getCourseDef(r.courseId);
                const isField = r.kind === "field";
                const gradeValue = !isField && r.grade ? GRADE_VALUES[r.grade] ?? null : null;
                const points = gradeValue == null ? null : r.credit * gradeValue;

                const coreBad = r.kind === "core" && r.grade && isBelowBMinus(r.grade);
                const fieldBad = r.kind === "field" && r.grade === "U";

                return (
                  <tr key={r.key}>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <select
                          value={r.courseId}
                          disabled={kind !== "elective"}
                          onChange={(e) => {
                            const nextCourse = e.target.value;
                            const nextDef = getCourseDef(nextCourse);
                            setRow(r.key, {
                              courseId: nextCourse,
                              credit: nextDef ? nextDef.creditOptions[0] : 3,
                            });
                          }}
                          style={selectStyle(kind !== "elective")}
                          aria-label="Course"
                        >
                          {courseOptions.map((c) => (
                            <option key={c.id} value={c.id}>
                              {courseLabel(c)}
                            </option>
                          ))}
                        </select>

                        {coreBad ? (
                          <div style={{ fontSize: 12, fontWeight: 900, color: "#9f1239" }}>
                            Below B- (probation trigger)
                          </div>
                        ) : fieldBad ? (
                          <div style={{ fontSize: 12, fontWeight: 900, color: "#9f1239" }}>U grade (probation trigger)</div>
                        ) : null}
                      </div>
                    </td>

                    <td style={tdStyle}>
                      {def && def.creditOptions.length > 1 ? (
                        <select
                          value={String(r.credit)}
                          onChange={(e) => setRow(r.key, { credit: Number(e.target.value) })}
                          style={selectStyle(false)}
                          aria-label="Credits"
                        >
                          {def.creditOptions.map((c) => (
                            <option key={c} value={String(c)}>
                              {c}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={String(r.credit)}
                          onChange={(e) => {
                            const n = safeNumber(e.target.value);
                            setRow(r.key, { credit: n ?? 0 });
                          }}
                          style={inputStyle}
                          aria-label="Credits"
                        />
                      )}
                    </td>

                    <td style={tdStyle}>
                      <select
                        value={r.grade}
                        onChange={(e) => setRow(r.key, { grade: normalizeGrade(r.kind, e.target.value) })}
                        style={selectStyle(false)}
                        aria-label="Grade"
                      >
                        {gradeOptions.map((g) => (
                          <option key={g} value={g}>
                            {g === "" ? "—" : g}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td style={tdStyle}>
                      <span style={{ fontVariantNumeric: "tabular-nums", color: COLORS.slate }}>
                        {gradeValue == null ? "—" : gradeValue.toFixed(2)}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 900, color: COLORS.ink }}>
                        {points == null ? "—" : points.toFixed(2)}
                      </span>
                    </td>

                    {showRemove ? (
                      <td style={tdStyle}>
                        <button
                          onClick={() => removeElective(r.key)}
                          style={{
                            background: "transparent",
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 12,
                            padding: "10px 12px",
                            cursor: "pointer",
                            fontWeight: 900,
                            color: COLORS.slate,
                          }}
                          aria-label="Remove elective"
                        >
                          Remove
                        </button>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {title === "Electives" ? (
          <div style={{ marginTop: 12, color: COLORS.slate2, fontSize: 13, lineHeight: 1.4 }}>
            Tip: If a course isn’t listed, pick <b>Manual elective entry</b> and enter the credits.
          </div>
        ) : null}

        {title.startsWith("Field") ? (
          <div style={{ marginTop: 12, color: COLORS.slate2, fontSize: 13, lineHeight: 1.4 }}>
            Field / Field Seminar are graded <b>S/U</b> and are excluded from GPA. A <b>U</b> is treated as a probation
            trigger.
          </div>
        ) : null}
      </Card>
    );
  };

  const coreCardTone = totals.coreViolations.length > 0 ? "danger" : "neutral";
  const fieldCardTone = totals.fieldViolations.length > 0 ? "danger" : "neutral";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${COLORS.bg} 0%, #ffffff 55%)`,
        color: COLORS.ink,
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
      }}
    >
      <div
        style={{
          background: COLORS.ubBlue,
          color: COLORS.white,
          padding: "18px 16px",
          boxShadow: "0 2px 0 rgba(2,6,23,0.08)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 10, height: 36, borderRadius: 999, background: COLORS.white, opacity: 0.9 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 18, fontWeight: 950, letterSpacing: 0.2 }}>UB SSW Internal GPA Calculator</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              Weighted GPA (letter grades only) + probation highlighting (core below B-, GPA &lt; 3.0, or Field U).
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <button
              onClick={resetAll}
              style={{
                background: "rgba(255,255,255,0.14)",
                color: COLORS.white,
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 12,
                padding: "10px 12px",
                fontWeight: 950,
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "18px auto", padding: "0 16px" }}>
        <div style={{ display: "grid", gap: 14 }}>
          <ProbationBanner />

          <Card
            title="Summary"
            tone={totals.onProbation ? "danger" : totals.gpa != null && totals.gpa >= 3.0 ? "success" : "neutral"}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <SummaryPill label="GPA credits" value={String(totals.gpaCredits)} />
              <SummaryPill label="Total points" value={totals.gpaCredits > 0 ? totals.points.toFixed(2) : "—"} />
              <SummaryPill label="Overall GPA" value={formatGpa(totals.gpa)} />

              <div style={{ marginLeft: "auto", color: COLORS.slate2, fontSize: 13, lineHeight: 1.4 }}>
                <div>
                  <b>Probation logic (internal):</b> any core below <b>B-</b>, or overall GPA below <b>3.0</b>, or any
                  Field/Field Seminar <b>U</b>.
                </div>
                <div>Core + Field are preloaded; electives can be added below. Entries save locally in this browser.</div>
              </div>
            </div>
          </Card>

          <Table title="Core (non-elective)" data={core} kind="core" tone={coreCardTone} />

          <Table title="Electives" data={electives} kind="elective" showRemove tone="neutral" />

          <Table title="Field / Practicum (S/U — excluded from GPA)" data={field} kind="field" tone={fieldCardTone} />

          <Card title="Notes" tone="neutral">
            <ul style={{ margin: 0, paddingLeft: 18, color: COLORS.slate2, lineHeight: 1.6 }}>
              <li>GPA excludes Field/Field Seminar and ignores blank grades.</li>
              <li>
                This does not yet implement special cases (repeat/retake rules, withdrawals, transfer credit, pass/fail
                outside Field, etc.).
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  fontSize: 12,
  letterSpacing: 0.2,
  textTransform: "uppercase",
  color: COLORS.slate2,
  padding: "10px 12px",
  borderBottom: `1px solid ${COLORS.border}`,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: `1px solid ${COLORS.border}`,
  verticalAlign: "top",
};

const baseControl: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: `1px solid ${COLORS.border}`,
  padding: "10px 10px",
  background: COLORS.white,
  color: COLORS.ink,
  fontWeight: 800,
  outline: "none",
};

function selectStyle(disabled: boolean): React.CSSProperties {
  return {
    ...baseControl,
    appearance: "none",
    background: disabled ? "#f1f5f9" : COLORS.white,
    cursor: disabled ? "default" : "pointer",
  };
}

const inputStyle: React.CSSProperties = {
  ...baseControl,
  fontVariantNumeric: "tabular-nums",
};
