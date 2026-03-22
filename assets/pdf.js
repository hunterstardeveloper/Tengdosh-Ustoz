(function () {
  "use strict";

  const C = {
    white:       [255, 255, 255],
    headerBg:    [18, 36, 76],      
    headerDark:  [11, 22, 52],      
    headerText:  [235, 243, 255],   
    accent:      [23, 143, 209],    
    accentDim:   [15, 100, 160],    
    accentFaint: [218, 236, 250],   
    ink:         [22, 28, 45],      
    muted:       [105, 120, 148],   
    rowWhite:    [255, 255, 255],
    rowAlt:      [243, 247, 253],   
    tableHead:   [18, 36, 76],      
    border:      [206, 218, 238],   
  };

  function ensureDeps() {
    if (!window.jspdf || !window.jspdf.jsPDF)
      throw new Error("jsPDF not found. Include jspdf.umd.min.js before /assets/pdf.js");
  }

  function parseDDMMYYYY(s) {
    if (!s || typeof s !== "string") return null;
    const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!m) return null;
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return isNaN(d.getTime()) ? null : d;
  }

  function sortDatesDesc(a, b) {
    const da = parseDDMMYYYY(a), db = parseDDMMYYYY(b);
    if (da && db) return db.getTime() - da.getTime();
    if (da) return -1;
    if (db) return 1;
    return String(b).localeCompare(String(a));
  }

  function drawHeader(doc, teacherId) {
    const w = doc.internal.pageSize.getWidth();

    doc.setFillColor(...C.headerBg);
    doc.rect(0, 0, w, 72, "F");

    doc.setFillColor(...C.accent);
    doc.rect(0, 0, w, 4, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...C.headerText);
    doc.text("ATTENDANCE REPORT", 20, 32);

    const titleW = doc.getTextWidth("ATTENDANCE REPORT");
    doc.setDrawColor(...C.accent);
    doc.setLineWidth(1);
    doc.line(20, 36, 20 + titleW, 36);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.muted);
    doc.text(new Date().toLocaleString(), w - 20, 32, { align: "right" });

    doc.setFillColor(...C.headerDark);
    doc.rect(0, 46, w, 26, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.muted);
    doc.text("TEACHER", 20, 57);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...C.accent);
    doc.text(String(teacherId || "Unknown"), 68, 57);

    doc.setDrawColor(...C.accentDim);
    doc.setLineWidth(0.8);
    doc.line(0, 72, w, 72);
  }

  function drawFooter(doc) {
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    const page = doc.internal.getNumberOfPages();

    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.5);
    doc.line(20, h - 24, w - 20, h - 24);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.muted);
    doc.text("GENERATED REPORT · CONFIDENTIAL", 20, h - 12);
    doc.text(`Page ${page}`, w - 20, h - 12, { align: "right" });
  }

  function drawSectionTitle(doc, y, label) {
    const w = doc.internal.pageSize.getWidth();

    doc.setFillColor(...C.accentFaint);
    doc.roundedRect(20, y, w - 40, 16, 3, 3, "F");

    doc.setFillColor(...C.accent);
    doc.roundedRect(20, y, 4, 16, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...C.accentDim);
    doc.text(label.toUpperCase(), 30, y + 11);
  }

  async function loadAttendanceRows(db, teacherId) {
    const snap = await db.ref(`subscriptions/${teacherId}/attendants`).once("value");
    const data = snap.val();
    return data ? Object.values(data) : [];
  }

  async function createAttendancePdf(db, teacherId) {
    ensureDeps();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    drawHeader(doc, teacherId);

    const rows = await loadAttendanceRows(db, teacherId);

    if (!rows.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...C.muted);
      doc.text("No students registered yet.", 20, 110);
      drawFooter(doc);
      doc.save(`Attendance_${teacherId}_${new Date().toLocaleDateString()}.pdf`);
      return;
    }

    const groups = {};
    rows.forEach((s) => {
      const date = s.regDate || "Previous Records";
      if (!groups[date]) groups[date] = [];
      groups[date].push(s);
    });

    const dates = Object.keys(groups).sort(sortDatesDesc);

    const pageH = doc.internal.pageSize.getHeight();
    const marginBottom = 42;
    let y = 88;

    for (const date of dates) {
      if (y + 40 > pageH - marginBottom) {
        drawFooter(doc);
        doc.addPage();
        drawHeader(doc, teacherId);
        y = 88;
      }

      drawSectionTitle(doc, y, `Class Date: ${date}`);
      y += 22;

      const rows = groups[date].map((student, idx) => [
        String(idx + 1),
        `${student.name || ""} ${student.surename || ""}`.trim(),
        student["phone number"] || "—",
        student.groupInUniversity || student.group || "N/A",
      ]);

      if (typeof doc.autoTable !== "function")
        throw new Error("autoTable not found. Include jspdf-autotable before /assets/pdf.js");

      doc.autoTable({
        startY: y,
        head: [["#", "Full Name", "Phone", "Group"]],
        body: rows,
        margin: { left: 20, right: 20, top: 88, bottom: marginBottom },
        columnStyles: {
          0: { cellWidth: 30, halign: "center" },
          2: { cellWidth: 110 },
          3: { cellWidth: 90 },
        },
        styles: {
          font: "helvetica",
          fontSize: 9,
          textColor: C.ink,
          lineColor: C.border,
          lineWidth: 0.4,
          cellPadding: { top: 7, right: 10, bottom: 7, left: 10 },
        },
        headStyles: {
          fillColor: C.tableHead,
          textColor: C.headerText,
          fontStyle: "bold",
          fontSize: 8.5,
        },
        bodyStyles:          { fillColor: C.rowWhite },
        alternateRowStyles:  { fillColor: C.rowAlt  },
        theme: "grid",
        didDrawPage: () => {
          drawHeader(doc, teacherId);
          drawFooter(doc);
        },
      });

      y = doc.lastAutoTable.finalY + 24;
    }

    drawFooter(doc);
    doc.save(`Attendance_${teacherId}_${new Date().toLocaleDateString()}.pdf`);
  }

  function bindViewListButton(opts) {
    const buttonId = (opts && opts.buttonId) || "viewListBtn";
    const db = opts && opts.db;
    const teacherId = opts && (opts.teacherId || opts.teacher);
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    btn.addEventListener("click", async () => {
      try {
        if (!db || !teacherId) {
          console.error("pdf.js: Missing db or teacherId", { db, teacherId });
          alert("PDF generator is not configured correctly.");
          return;
        }
        btn.disabled = true;
        const orig = btn.textContent;
        btn.textContent = "Generating PDF…";
        await createAttendancePdf(db, teacherId);
        btn.textContent = orig;
        btn.disabled = false;
      } catch (e) {
        console.error("PDF Error:", e);
        btn.disabled = false;
        btn.textContent = "View Registered Students";
        alert("Could not generate PDF. Check console for details.");
      }
    });
  }

  window.TU_PDF = { createAttendancePdf, bindViewListButton };
})();
