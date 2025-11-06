(() => {
  if (window.__distanceTool) {
    window.__distanceTool.destroy();
    delete window.__distanceTool;
    console.log("🟡 Distance tool deactivated");
    return;
  }

  const state = {
    lines: [],
    drawing: null,
    color: "#ffcb00",
    thickness: 2,
    dragging: null,
    allowDraw: true
  };

  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    zIndex: "999999",
    cursor: "crosshair",
    pointerEvents: "auto"
  });
  const ctx = canvas.getContext("2d");
  document.body.appendChild(canvas);

  const panel = document.createElement("div");
  Object.assign(panel.style, {
    position: "fixed",
    top: "12px",
    left: "12px",
    background: "rgba(0,0,0,0.8)",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "10px",
    font: "13px system-ui",
    zIndex: "1000000",
    minWidth: "180px",
    maxHeight: "340px",
    overflowY: "auto",
    pointerEvents: "auto" // ensure panel is always clickable
  });
  panel.innerHTML = `
    <b>Distance Tool</b><br><br>
    Color: <input type="color" id="dtColor" value="${state.color}"><br>
    Thickness: <input type="range" id="dtThick" min="1" max="10" value="${state.thickness}"><br>
    <button id="dtToggle" style="margin-top:6px;width:100%;background:#333;color:#fff;border:none;padding:4px;border-radius:4px;">✏️ Drawing: ON</button>
    <div id="dtList" style="margin-top:8px;"></div>
    <button id="dtClear" style="margin-top:8px;width:100%">Clear All</button>
  `;
  document.body.appendChild(panel);

  const listDiv = panel.querySelector("#dtList");
  const toggleBtn = panel.querySelector("#dtToggle");

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    draw();
  }
  addEventListener("resize", resize);
  resize();

  const dist = (a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const angleDeg = (a,b)=>{
    const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    return ((angle + 360) % 360).toFixed(1);
  };

  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.font = "12px monospace";
    ctx.lineJoin = "round";

    // draw saved lines
    for (let l of state.lines) {
      ctx.strokeStyle = l.color;
      ctx.lineWidth = l.thickness;
      ctx.fillStyle = l.color;
      ctx.beginPath();
      ctx.moveTo(l.start.x, l.start.y);
      ctx.lineTo(l.end.x, l.end.y);
      ctx.stroke();

      const midX=(l.start.x+l.end.x)/2, midY=(l.start.y+l.end.y)/2;
      const d = dist(l.start,l.end).toFixed(1);
      const ang = angleDeg(l.start,l.end);
      ctx.fillText(`${d}px`, midX+5, midY-5);
      ctx.fillText(`${ang}°`, midX+5, midY+10);
    }

    // draw active (dotted) line
    if (state.drawing) {
      const {start,end,color,thickness}=state.drawing;
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.setLineDash([5,5]);
      ctx.beginPath();
      ctx.moveTo(start.x,start.y);
      ctx.lineTo(end.x,end.y);
      ctx.stroke();
      ctx.setLineDash([]);
      const midX=(start.x+end.x)/2, midY=(start.y+end.y)/2;
      const d = dist(start,end).toFixed(1);
      const ang = angleDeg(start,end);
      ctx.fillStyle = color;
      ctx.fillText(`${d}px`, midX+5, midY-5);
      ctx.fillText(`${ang}°`, midX+5, midY+10);
    }
  }

  function updateList() {
    listDiv.innerHTML = state.lines.map((l,i)=>
      `<div style="margin-bottom:4px;">
         <span style="color:${l.color}">Line ${i+1}</span>
         <button data-del="${i}" style="float:right;">🗑</button>
         <div style="clear:both;"></div>
       </div>`
    ).join("");
  }

  // ───────────────────────────────
  canvas.addEventListener("click", e => {
    if (!state.allowDraw) return; // no drawing when off

    const pos = {x:e.clientX, y:e.clientY};
    if (!state.drawing) {
      state.drawing = { start: pos, end: pos, color: state.color, thickness: state.thickness };
    } else {
      state.drawing.end = pos;
      state.lines.push(state.drawing);
      state.drawing = null;
      updateList();
      draw();
    }
  });

  canvas.addEventListener("mousemove", e => {
    if (state.drawing) {
      state.drawing.end = {x:e.clientX, y:e.clientY};
      draw();
    }
  });

  // ───────────────────────────────
  panel.addEventListener("input", e => {
    if (e.target.id === "dtColor") state.color = e.target.value;
    if (e.target.id === "dtThick") state.thickness = +e.target.value;
  });

  panel.addEventListener("click", e => {
    if (e.target.dataset.del) {
      state.lines.splice(+e.target.dataset.del,1);
      updateList();
      draw();
    }
    if (e.target.id === "dtClear") {
      state.lines.length = 0;
      updateList();
      draw();
    }
    if (e.target.id === "dtToggle") {
      state.allowDraw = !state.allowDraw;
      toggleBtn.textContent = state.allowDraw ? "✏️ Drawing: ON" : "🚫 Drawing: OFF";
      toggleBtn.style.background = state.allowDraw ? "#333" : "#900";
      canvas.style.pointerEvents = state.allowDraw ? "auto" : "none";
    }
  });

  const keyHandler = e=>{
    if (e.key==="Escape") {
      tool.destroy();
      delete window.__distanceTool;
      console.log("🟡 Distance tool deactivated");
    }
  };
  addEventListener("keydown", keyHandler);

  const tool = {
    destroy() {
      canvas.remove();
      panel.remove();
      removeEventListener("resize", resize);
      removeEventListener("keydown", keyHandler);
    }
  };
  window.__distanceTool = tool;

  console.log("🟢 Distance tool activated — toggle drawing mode to click through page, ESC to remove.");
})();
