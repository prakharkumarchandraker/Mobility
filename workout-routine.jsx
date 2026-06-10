import { useState, useEffect, useRef } from "react";

// ─── ANTHROPIC IMAGE SEARCH ────────────────────────────────────────────────
const fetchExerciseImages = async (exerciseName) => {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{
          role: "user",
          content: `Search the web for "${exerciseName} exercise how to" and find exercise demonstration images. Also try searching "site:giphy.com ${exerciseName} exercise". Collect all direct image URLs you find (ending in .gif, .jpg, .jpeg, .png, or .webp) AND all giphy.com/gifs/ page URLs. Return ONLY a raw JSON array — no markdown, no explanation — just the array. Example: ["https://media.giphy.com/media/abc/giphy.gif","https://example.com/img.jpg"]. Return [] if nothing found.`
        }]
      })
    });
    const data = await response.json();
    const text = (data.content || []).filter(c => c.type === "text").map(c => c.text).join(" ");

    const urls = new Set();

    // Direct image URL extraction
    const imgRx = /https?:\/\/[^\s"'<>\]\\]+\.(?:gif|jpg|jpeg|png|webp)(?:\?[^\s"'<>\]\\]*)?/gi;
    (text.match(imgRx) || []).forEach(u => urls.add(u));

    // Giphy page URL → CDN GIF conversion
    const giphyRx = /https?:\/\/(?:www\.)?giphy\.com\/gifs\/([A-Za-z0-9_-]+)/gi;
    let m;
    while ((m = giphyRx.exec(text)) !== null) {
      const slug = m[1];
      const id = slug.split("-").pop();
      if (id && id.length > 5) urls.add(`https://media.giphy.com/media/${id}/giphy.gif`);
    }

    // JSON array fallback
    try {
      const jm = text.match(/\[[\s\S]*?\]/);
      if (jm) {
        const parsed = JSON.parse(jm[0]);
        if (Array.isArray(parsed)) parsed.filter(u => typeof u === "string" && u.startsWith("http")).forEach(u => urls.add(u));
      }
    } catch {}

    return [...urls].slice(0, 6);
  } catch { return []; }
};

// ─── CSS ANIMATIONS ────────────────────────────────────────────────────────
const CSS = `
@keyframes sq{0%,100%{transform:scaleY(1) translateY(0)}50%{transform:scaleY(0.72) translateY(12px)}}
@keyframes hn{0%,100%{transform:rotate(0)}50%{transform:rotate(44deg)}}
@keyframes br{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
@keyframes ml{0%,50%,100%{transform:translateY(0)}25%{transform:translateY(-18px)}}
@keyframes mr{0%,74%,100%{transform:translateY(0)}62%{transform:translateY(-18px)}}
@keyframes sw{0%,100%{transform:rotate(-38deg)}50%{transform:rotate(38deg)}}
@keyframes hp{0%,62%,100%{transform:translateY(0)}28%{transform:translateY(-22px)}}
@keyframes kg{0%,100%{transform:scale(1)}50%{transform:scale(0.55)}}
@keyframes kr{0%{transform:scale(1);opacity:0.8}100%{transform:scale(2.4);opacity:0}}
@keyframes bth{0%,100%{transform:scale(1)}50%{transform:scale(1.25)}}
@keyframes sc{0%,100%{transform:scaleX(1)}50%{transform:scaleX(0.65)}}
@keyframes cc{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes rt{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
@keyframes th{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
@keyframes ln{0%,100%{transform:translateX(0) translateY(0)}50%{transform:translateX(12px) translateY(6px)}}
@keyframes pl{0%,100%{opacity:1}50%{opacity:0.65}}
@keyframes fr{0%,100%{transform:scaleY(1)}50%{transform:scaleY(0.68) scaleX(1.18)}}
@keyframes fh{0%,100%{transform:rotate(0)}50%{transform:rotate(-58deg)}}
@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
`;

// ─── IMPROVED FIGURE ───────────────────────────────────────────────────────
const Fig = ({ type, color }) => {
  const c = color, bg = c + "15";
  // Thin limb helpers
  const H = (x, y, r=9) => <circle cx={x} cy={y} r={r} fill={c} opacity={0.92}/>;
  const B = (x, y, w, h, op=0.82, tr) => <rect x={x} y={y} width={w} height={h} rx={Math.min(w,h)/2} fill={c} opacity={op} transform={tr}/>;
  const J = (x, y, r=3) => <circle cx={x} cy={y} r={r} fill={c} opacity={0.6}/>;

  const base = <rect x={1} y={1} width={88} height={88} rx={14} fill={bg}/>;

  // Standing upright base pose (reused in many animations)
  // Head at (45,12), torso 37-53 x 21-41, legs below
  const standParts = (headX=45, headY=12) => (<>
    {H(headX, headY, 9)}
    {B(headX-8, headY+9, 16, 20, 0.82)} {/* torso */}
    {J(headX-8, headY+9)} {J(headX+8, headY+9)} {/* shoulder joints */}
    {J(headX-8, headY+29)} {J(headX+8, headY+29)} {/* hip joints */}
  </>);

  const figs = {
    squat: (
      <g style={{animation:"sq 1.4s ease-in-out infinite", transformBox:"fill-box", transformOrigin:"center bottom"}}>
        {H(45,11,9)}
        {B(37,20,16,20,0.82)} {J(37,20)} {J(53,20)}
        {B(35,40,8,18,0.72,`rotate(12,39,40)`)} {B(47,40,8,18,0.72,`rotate(-12,51,40)`)}
        {J(35,40)} {J(55,40)}
        {B(30,22,7,5,0.6)} {B(53,22,7,5,0.6)}
      </g>
    ),
    bridge: (<>
      {H(14,64,8)}
      {B(22,60,8,14,0.5)}
      <g style={{animation:"br 1.4s ease-in-out infinite", transformBox:"fill-box", transformOrigin:"center bottom"}}>
        {B(30,38,38,24,0.78,undefined)} {J(30,38)} {J(68,38)}
      </g>
      {B(38,62,8,18,0.65)} {B(54,62,8,18,0.65)}
      {J(38,62)} {J(62,62)}
    </>),
    plank: (
      <g style={{animation:"pl 2s ease-in-out infinite"}}>
        {H(14,40,8)} {B(22,36,42,12,0.82)} {J(22,36)} {J(64,36)}
        {B(14,46,7,22,0.6)} {B(65,46,7,22,0.6)}
        {J(14,46)} {J(64,46)}
      </g>
    ),
    march: (<>
      {H(45,11,9)} {B(37,20,16,20,0.82)} {J(37,20)} {J(53,20)}
      <g style={{animation:"ml 1.1s ease-in-out infinite", transformBox:"fill-box", transformOrigin:"37px 40px"}}>
        {B(33,40,8,16,0.7)} {B(32,56,7,14,0.65)} {J(33,56)}
      </g>
      <g style={{animation:"mr 1.1s ease-in-out infinite", transformBox:"fill-box", transformOrigin:"53px 40px"}}>
        {B(49,40,8,16,0.7)} {B(50,56,7,14,0.65)} {J(57,56)}
      </g>
      {B(28,22,9,5,0.6)} {B(53,22,9,5,0.6)}
    </>),
    hinge: (<>
      {B(35,42,8,18,0.65)} {B(47,42,8,18,0.65)} {/* legs stay */}
      {B(35,60,7,14,0.6)} {B(49,60,7,14,0.6)}
      {J(35,42)} {J(55,42)}
      <g style={{animation:"hn 1.6s ease-in-out infinite", transformBox:"fill-box", transformOrigin:"center bottom"}}>
        {H(45,11,9)} {B(37,20,16,20,0.82)}
        {B(25,22,12,5,0.6)} {B(53,22,12,5,0.6)}
        {J(37,20)} {J(53,20)}
      </g>
    </>),
    swing: (<>
      {H(45,11,9)} {B(37,20,16,20,0.82)} {J(37,20)} {J(53,20)}
      {B(48,40,8,18,0.65)} {B(49,58,7,14,0.6)} {J(56,40)}
      <g style={{animation:"sw 1s ease-in-out infinite", transformBox:"fill-box", transformOrigin:"37px 40px"}}>
        {B(33,40,8,18,0.7)} {B(32,58,7,14,0.65)} {J(33,58)}
      </g>
      {B(28,22,9,5,0.6)} {B(53,22,9,5,0.6)}
    </>),
    hop: (
      <g style={{animation:"hp 0.85s ease-in-out infinite", transformBox:"fill-box", transformOrigin:"center bottom"}}>
        {H(45,11,9)} {B(37,20,16,20,0.82)} {J(37,20)} {J(53,20)}
        {B(35,40,8,18,0.7)} {B(47,40,8,18,0.7)}
        {B(34,58,7,14,0.65)} {B(49,58,7,14,0.65)}
        {J(35,40)} {J(55,40)} {J(34,58)} {J(56,58)}
        {B(28,22,9,5,0.6)} {B(53,22,9,5,0.6)}
      </g>
    ),
    lunge: (<>
      {H(38,11,9)} {B(30,20,16,20,0.82)} {J(30,20)} {J(46,20)}
      {B(27,40,8,18,0.65)} {B(27,58,7,14,0.6)} {J(27,40)} {J(27,58)}
      <g style={{animation:"ln 1.3s ease-in-out infinite", transformBox:"fill-box", transformOrigin:"46px 40px"}}>
        {B(43,40,8,18,0.7)} {B(52,58,14,7,0.5)} {J(51,40)}
      </g>
      {B(21,22,9,5,0.6)} {B(46,22,9,5,0.6)}
    </>),
    kegel: (<>
      {[1,2,3].map(i=><circle key={i} cx={45} cy={45} r={i*14} fill="none" stroke={c} strokeWidth={3.5-i*0.8} opacity={0.8-i*0.2}
        style={{animation:`kr ${0.9+i*0.3}s ease-out infinite`, animationDelay:`${(i-1)*0.28}s`, transformBox:"fill-box", transformOrigin:"center"}}/>)}
      <circle cx={45} cy={45} r={12} fill={c}
        style={{animation:"kg 1s ease-in-out infinite", transformBox:"fill-box", transformOrigin:"center"}}/>
    </>),
    breathe: (
      <circle cx={45} cy={45} r={26} fill={c} opacity={0.62}
        style={{animation:"bth 3s ease-in-out infinite", transformBox:"fill-box", transformOrigin:"center"}}/>
    ),
    squeeze: (<>
      {H(45,11,9)} {B(37,20,16,20,0.82)} {J(37,20)} {J(53,20)}
      <g style={{animation:"sc 1.1s ease-in-out infinite", transformBox:"fill-box", transformOrigin:"45px 54px"}}>
        {B(33,40,8,18,0.7)} {B(49,40,8,18,0.7)}
        {B(32,58,7,14,0.65)} {B(51,58,7,14,0.65)}
        {J(33,40)} {J(57,40)}
      </g>
      {B(28,22,9,5,0.6)} {B(53,22,9,5,0.6)}
    </>),
    catcow: (<>
      {H(14,40,8)}
      <g style={{animation:"cc 1.5s ease-in-out infinite", transformBox:"fill-box", transformOrigin:"center"}}>
        {B(22,34,46,16,0.82,undefined)} {J(22,34)} {J(68,34)}
      </g>
      {B(15,50,7,22,0.6)} {B(68,50,7,22,0.6)}
      {J(15,50)} {J(68,50)}
    </>),
    rotate: (<>
      {H(45,11,9)}
      {B(35,42,8,18,0.65)} {B(47,42,8,18,0.65)} {B(35,60,7,14,0.6)} {B(49,60,7,14,0.6)}
      {J(35,42)} {J(55,42)}
      <g style={{animation:"rt 2.5s linear infinite", transformBox:"fill-box", transformOrigin:"45px 31px"}}>
        {B(37,20,16,22,0.82)} {B(22,23,15,6,0.6)} {B(53,23,15,6,0.6)}
        {J(37,20)} {J(53,20)}
      </g>
    </>),
    thrust: (<>
      {H(12,65,8)}
      {B(70,67,14,7,0.55)}
      <g style={{animation:"th 1.1s ease-in-out infinite", transformBox:"fill-box", transformOrigin:"65px 65px"}}>
        {B(20,44,48,26,0.8,undefined)} {J(20,44)} {J(68,44)}
      </g>
    </>),
    stretch: (
      <g style={{animation:"bth 2s ease-in-out infinite", transformBox:"fill-box", transformOrigin:"45px 45px"}}>
        {H(45,11,9)} {B(37,20,16,20,0.82)}
        {B(18,40,9,22,0.65,`rotate(30,22,40)`)} {B(58,40,9,22,0.65,`rotate(-30,63,40)`)}
        {B(22,22,14,6,0.6,`rotate(-28,29,25)`)} {B(54,22,14,6,0.6,`rotate(28,61,25)`)}
        {J(37,20)} {J(53,20)}
      </g>
    ),
    frog: (
      <g style={{animation:"fr 1.3s ease-in-out infinite", transformBox:"fill-box", transformOrigin:"center"}}>
        {H(45,11,9)} {B(37,20,16,20,0.82)}
        {B(14,40,12,8,0.65,`rotate(42,20,40)`)} {B(62,40,12,8,0.65,`rotate(-42,68,40)`)}
        {B(8,52,18,7,0.5,`rotate(22,17,55)`)} {B(62,52,18,7,0.5,`rotate(-22,71,55)`)}
        {J(37,20)} {J(53,20)}
      </g>
    ),
    fire: (<>
      {H(45,11,9)} {B(37,20,16,20,0.82)} {J(37,20)} {J(53,20)}
      {B(35,40,8,18,0.65)} {B(35,58,7,14,0.6)} {J(35,40)}
      <g style={{animation:"fh 1.1s ease-in-out infinite", transformBox:"fill-box", transformOrigin:"53px 40px"}}>
        {B(49,40,8,18,0.72)} {B(50,58,7,14,0.65)} {J(57,40)}
      </g>
      {B(28,22,9,5,0.6)} {B(53,22,9,5,0.6)}
    </>),
  };
  return (
    <svg viewBox="0 0 90 90" width={82} height={82}>
      {base}
      {figs[type] || figs.breathe}
    </svg>
  );
};

// ─── IMAGE MODAL ───────────────────────────────────────────────────────────
const ImgModal = ({ name, query, color, onClose }) => {
  const [imgs, setImgs] = useState(null);
  useEffect(() => {
    fetchExerciseImages(query + " exercise").then(setImgs);
  }, [query]);

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.93)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#16161E",borderRadius:18,padding:18,width:"100%",maxWidth:460,maxHeight:"88vh",overflow:"auto",boxShadow:"0 20px 60px #000"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:"#E8E8EC",lineHeight:1.3}}>{name}</div>
            <div style={{fontSize:11,color:"#555",marginTop:3}}>Live web search · may take a moment</div>
          </div>
          <button onClick={onClose} style={{background:"#2A2A38",border:"none",color:"#aaa",width:32,height:32,borderRadius:10,cursor:"pointer",fontSize:18,flexShrink:0,marginLeft:10}}>×</button>
        </div>

        {!imgs && (
          <div style={{textAlign:"center",padding:"44px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:"50%",border:`3px solid ${color}`,borderTopColor:"transparent",animation:"spin 0.8s linear infinite"}}/>
            <div style={{color:"#555",fontSize:13}}>Searching the web for demonstrations...</div>
          </div>
        )}

        {imgs && imgs.length === 0 && (
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:32,marginBottom:10}}>😕</div>
            <div style={{color:"#666",fontSize:14,marginBottom:6}}>No images found for this exercise</div>
            <div style={{color:"#444",fontSize:12}}>Try the CSS animation — tap the card to expand it</div>
          </div>
        )}

        {imgs && imgs.length > 0 && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {imgs.map((url,i) => (
              <ImgTile key={i} url={url} color={color}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ImgTile = ({ url, color }) => {
  const [ok, setOk] = useState(null);
  return (
    <div style={{borderRadius:10,overflow:"hidden",background:"#0F0F16",aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center"}}>
      {ok === false ? (
        <div style={{textAlign:"center",padding:10,color:"#333",fontSize:11}}>Image failed</div>
      ) : (
        <img src={url} alt="exercise demo"
          onLoad={() => setOk(true)}
          onError={() => setOk(false)}
          style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
      )}
    </div>
  );
};

// ─── INLINE GIF LOADER ─────────────────────────────────────────────────────
const InlineLoader = ({ query, animType, color }) => {
  const [phase, setPhase] = useState("idle"); // idle | loading | loaded | none
  const [url, setUrl] = useState(null);

  const load = async () => {
    setPhase("loading");
    const results = await fetchExerciseImages(query + " exercise gif");
    if (results.length > 0) { setUrl(results[0]); setPhase("loaded"); }
    else setPhase("none");
  };

  return (
    <div style={{margin:"14px 0 10px"}}>
      {(phase === "idle" || phase === "none") && (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          <Fig type={animType} color={color}/>
          <button onClick={load} style={{background:color+"20",border:`1px solid ${color}40`,borderRadius:8,color:color,fontSize:12,fontWeight:700,padding:"7px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
            🌐 Load from Web
          </button>
          {phase === "none" && <div style={{fontSize:11,color:"#444"}}>No image found online</div>}
        </div>
      )}
      {phase === "loading" && (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,padding:"16px 0"}}>
          <div style={{width:30,height:30,borderRadius:"50%",border:`3px solid ${color}`,borderTopColor:"transparent",animation:"spin 0.7s linear infinite"}}/>
          <div style={{fontSize:12,color:"#555"}}>Searching web...</div>
        </div>
      )}
      {phase === "loaded" && url && (
        <div style={{borderRadius:12,overflow:"hidden",background:"#0F0F16",display:"flex",alignItems:"center",justifyContent:"center",maxHeight:220}}>
          <img src={url} alt="exercise" style={{maxHeight:220,maxWidth:"100%",objectFit:"contain",display:"block"}} onError={()=>setPhase("none")}/>
        </div>
      )}
    </div>
  );
};

// ─── EXERCISE CARD ─────────────────────────────────────────────────────────
const ExCard = ({ ex, cardKey, color, isChecked, onCheck, isExpanded, onExpand, onSearch, weekNum }) => (
  <div style={{background:isChecked?color+"14":"#13131B",border:`1px solid ${isChecked?color+"50":"#1E1E28"}`,borderRadius:12,marginBottom:10,overflow:"hidden",transition:"background 0.2s,border 0.2s"}}>
    <div style={{display:"flex",alignItems:"center",padding:"13px 12px",gap:10}}>
      <button onClick={e=>{e.stopPropagation();onCheck();}} style={{width:30,height:30,borderRadius:8,border:`2px solid ${isChecked?color:"#444"}`,background:isChecked?color:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,flexShrink:0,color:"#000",transition:"all 0.15s"}}>
        {isChecked?"✓":""}
      </button>
      <div style={{flex:1,minWidth:0}} onClick={onExpand} role="button">
        <div style={{fontSize:14,fontWeight:700,color:isChecked?color:"#E8E8EC",textDecoration:isChecked?"line-through":"none",lineHeight:1.3}}>{ex.name}</div>
        <div style={{fontSize:11,color:"#555",marginTop:2}}>
          {weekNum&&ex.getTarget?ex.getTarget(weekNum):`${ex.sets!=="—"?ex.sets+" × ":""}${ex.reps}`}
        </div>
      </div>
      <div style={{display:"flex",gap:5,flexShrink:0}}>
        <button onClick={onSearch} title="Search images online" style={{background:color+"22",border:"none",borderRadius:7,color:color,fontSize:11,fontWeight:700,padding:"5px 9px",cursor:"pointer",whiteSpace:"nowrap"}}>🔍 Images</button>
        <button onClick={onExpand} style={{background:"#1A1A24",border:"none",borderRadius:7,color:"#555",fontSize:12,width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{isExpanded?"▴":"▾"}</button>
      </div>
    </div>
    {isExpanded&&(
      <div style={{padding:"0 12px 14px",borderTop:"1px solid #1A1A24"}}>
        <InlineLoader query={ex.gifQuery||ex.name} animType={ex.anim} color={color}/>
        {ex.steps.map((s,i)=>(
          <div key={i} style={{display:"flex",gap:10,marginBottom:8}}>
            <div style={{width:22,height:22,borderRadius:11,background:color+"22",color:color,fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{i+1}</div>
            <div style={{fontSize:13,color:"#C0C0CC",lineHeight:1.55}}>{s}</div>
          </div>
        ))}
        {ex.tip&&<div style={{background:color+"10",borderLeft:`3px solid ${color}`,borderRadius:"0 8px 8px 0",padding:"9px 12px",fontSize:12,color:"#999",lineHeight:1.5,marginTop:8}}>💡 {ex.tip}</div>}
      </div>
    )}
  </div>
);

// ─── DATA ──────────────────────────────────────────────────────────────────
const DAYS = [
  {id:1,name:"MOBILITY",color:"#4CAF82",emoji:"🌿",duration:"35 min",note:"Move slowly. Any pain = stop immediately.",exercises:[
    {name:"Malasana (Deep Squat Hold)",sets:"3",reps:"45 sec",anim:"squat",gifQuery:"malasana deep squat yoga",steps:["Stand feet wider than shoulders, toes out 45°","Lower into deepest squat possible — heels on floor","Palms together, elbows push knees open wider","Hold and breathe into lower back. Towel under heels if they lift."],tip:"Single most important mobility move — hips, ankles, lower back all at once."},
    {name:"Hip CARs (Controlled Rotation)",sets:"3",reps:"5 each side",anim:"rotate",gifQuery:"hip controlled articular rotation exercise",steps:["Stand on one leg, hold wall","Lift free knee to hip height","Draw the BIGGEST circle with that knee — forward, out, behind, return","Go extremely slow — joint lubrication, not speed"],tip:"Oiling your hip joint from the inside. Slow = effective."},
    {name:"World's Greatest Stretch",sets:"2",reps:"6 each side",anim:"lunge",gifQuery:"worlds greatest stretch exercise",steps:["Lunge with right foot forward, left knee on floor","Left hand inside right foot on ground","Rotate right arm up toward ceiling, follow with eyes","Return, straighten front leg to stretch hamstring. 1 rep."],tip:"Hits hip flexor, spine, hamstring, groin simultaneously. Best stretch in existence."},
    {name:"Cossack Squat",sets:"3",reps:"8 each side",anim:"squat",gifQuery:"cossack squat exercise",steps:["Very wide stance, toes out","Shift weight right, bending that knee deeply","Left leg stays straight, toes point to ceiling","Hold 2 sec, slide across to other side"],tip:"Hold door frame at first. Opens inner thighs fast."},
    {name:"Forward Leg Swings",sets:"2",reps:"15 each leg",anim:"swing",gifQuery:"forward leg swing dynamic stretch",steps:["Hold wall with one hand","Let outer leg hang loose","Swing forward as high as comfortable, let swing naturally behind","Let momentum carry it — don't force range"],tip:"Swinging leg should feel like a rope. Completely loose."},
    {name:"90-90 Hip Rotation",sets:"3",reps:"8 each side",anim:"rotate",gifQuery:"90 90 hip rotation stretch",steps:["Sit on floor, both knees at 90° — one front, one side","Back straight and tall","Rotate hips to switch sides","Pause 2 seconds each side"],tip:"If painful, hold each side and breathe into it 60 sec instead."},
    {name:"Shoulder Pendulum ⚠️",sets:"3",reps:"30 sec each direction",anim:"swing",gifQuery:"shoulder pendulum exercise impingement",steps:["Lean on table, good arm supports weight","Injured arm hangs COMPLETELY loose","Rock body to create circular swings with hanging arm","Clockwise 30s, counterclockwise 30s — gravity does everything"],tip:"⚠️ Do EVERY DAY. #1 home treatment for shoulder impingement."},
    {name:"Band External Rotation ⚠️",sets:"3",reps:"15 each side",anim:"squeeze",gifQuery:"band shoulder external rotation rotator cuff",steps:["Band at elbow height on door handle","Elbow bent 90°, TUCKED to ribs — never moves","Slowly rotate forearm outward — small range (45°)","Slow return. Light band. Zero pain ever."],tip:"⚠️ Rebuilds rotator cuff. Daily = shoulder healed in 3 months."},
  ]},
  {id:2,name:"LOWER BODY",color:"#E05A2B",emoji:"🔥",duration:"45 min",note:"Zero shoulder load. Go heavy with perfect form. Legs drive fat loss.",exercises:[
    {name:"Goblet Squat",sets:"4",reps:"12",anim:"squat",gifQuery:"goblet squat dumbbell exercise",steps:["Hold 10kg at chest vertically","Feet shoulder-width, toes slightly out","3 full seconds to lower — chest up, knees push out","Drive through heels to stand. Squeeze glutes at top."],tip:"Weight in front auto-corrects form. Better than regular squat for beginners."},
    {name:"Romanian Deadlift",sets:"4",reps:"10",anim:"hinge",gifQuery:"romanian deadlift dumbbell how to",steps:["10kg in each hand, in front of thighs","Push hips BACKWARD — like closing a car door with your bum","Slide weights down legs until strong hamstring stretch","Drive hips forward to stand. Squeeze glutes hard."],tip:"Feel it in back of thighs — not lower back. If lower back: you're bending, not hinging."},
    {name:"Reverse Lunge",sets:"3",reps:"10 each leg",anim:"lunge",gifQuery:"reverse lunge dumbbell exercise",steps:["7kg in each hand","Step ONE foot backward, lower back knee toward floor","Front knee at 90° — above ankle, never past toes","Drive through FRONT heel to return"],tip:"Easier on knees than forward lunge. Back knee hovers 2cm from floor."},
    {name:"Band Glute Bridge",sets:"4",reps:"20",anim:"bridge",gifQuery:"glute bridge resistance band",steps:["Band above knees, lie on back, feet flat near bum","Push knees outward against band throughout","Drive hips to ceiling squeezing glutes HARD","Hold 1 sec at top, lower slowly in 3 sec"],tip:"Feel it in glutes — not lower back. Feet too far = lower back engagement."},
    {name:"Band Lateral Walk",sets:"3",reps:"15 steps each way",anim:"squeeze",gifQuery:"lateral band walk exercise glutes",steps:["Band above knees, quarter squat position — stay here","Step sideways: outside foot, then inside follows","Constant band tension throughout","Knees never cave inward"],tip:"Works side glutes that stabilize every movement you make."},
    {name:"Wall Sit",sets:"3",reps:"45 sec",anim:"squat",gifQuery:"wall sit exercise how to",steps:["2 feet from wall, back flat against it","Slide down until thighs parallel to floor — invisible chair","Feet flat, knees at 90° over ankles","Hold. The burn is the goal."],tip:"When easy: hold 10kg on lap. Build from 45s to 90s."},
    {name:"Single Leg Calf Raise",sets:"3",reps:"15 each",anim:"march",gifQuery:"single leg calf raise exercise",steps:["One foot on edge of step or thick book","Fingertips on wall — balance only, not support","Rise as HIGH as possible on toes","Lower SLOWLY — 3 full seconds down. That's the exercise."],tip:"3 sec down is non-negotiable. Prevents running and trekking injuries."},
  ]},
  {id:3,name:"STAMINA",color:"#5B8FD4",emoji:"💨",duration:"40 min",note:"Slightly breathless but can talk = right zone.",exercises:[
    {name:"High Knee March Warm-Up",sets:"1",reps:"3 min",anim:"march",gifQuery:"high knee march warm up cardio",steps:["March in place, knees to hip height","Pump OPPOSITE arm as each knee rises","Start slow 1 min, build speed over next 2 min","Land softly on balls of feet"],tip:"Mandatory — not optional. Cold joints under load = injury."},
    {name:"Quick Feet Intervals",sets:"4",reps:"30s on / 30s rest",anim:"march",gifQuery:"quick feet agility drill exercise",steps:["Athletic stance, knees slightly bent","Move feet as FAST as possible with tiny rapid steps","Arms pump at sides","Full 30s on, walk slowly 30s. 4 rounds."],tip:"Small quick steps — not big stomping ones."},
    {name:"Squat Hold Pulses",sets:"3",reps:"1 min",anim:"squat",gifQuery:"squat pulse exercise cardio",steps:["Sink into squat and STAY there","Tiny bouncing movements — 5-8cm only","Never come back to standing — stay in squat the whole minute","When it burns — that's when it works"],tip:"Brutal on thighs. Rest briefly then return."},
    {name:"Zone 2 Continuous March",sets:"1",reps:"20 min NONSTOP",anim:"march",gifQuery:"marching in place cardio exercise",steps:["March in place at steady comfortable pace","Should hold a full conversation — gasping = slow down","Consistent knee drive, natural arm swing","20 minutes. No breaks. Most important block of the week."],tip:"Builds aerobic base powering trekking, running, and all endurance."},
    {name:"Dead Bug Core Finish",sets:"3",reps:"10 each side",anim:"plank",gifQuery:"dead bug exercise core how to",steps:["Lie on back, arms to ceiling, knees raised 90°","Lower RIGHT arm behind head AND LEFT leg to floor — simultaneously","Lower back stays COMPLETELY FLAT — non-negotiable","Back arches = too far. Reset and reduce range."],tip:"Most effective core exercise — zero spine compression, zero shoulder load."},
  ]},
  {id:4,name:"RECOVERY",color:"#9B6BC4",emoji:"🧘",duration:"30 min",note:"This day IS training. Body adapts during rest, not work. Don't skip.",exercises:[
    {name:"Child's Pose",sets:"1",reps:"2 min",anim:"stretch",gifQuery:"childs pose yoga stretch lower back",steps:["Kneel, sit back toward heels","Reach arms forward on floor, forehead down","Breathe into lower back — feel it expand each inhale","Completely passive. Gravity does the work."],tip:"Pillow between heels and glutes if they don't meet. Never force."},
    {name:"Figure-4 Hip Stretch",sets:"1",reps:"90 sec each side",anim:"stretch",gifQuery:"figure 4 hip stretch glute piriformis",steps:["Lie on back, knees bent, feet flat","Cross right ankle over left thigh just above knee","Reach hands behind left thigh, pull legs toward chest","Breathe. Deep stretch in right outer hip and glute."],tip:"As effective as pigeon pose but much safer."},
    {name:"Hip Flexor Lunge Hold",sets:"1",reps:"60 sec each side",anim:"lunge",gifQuery:"hip flexor stretch kneeling lunge",steps:["One knee on folded towel on floor","Other foot flat in front — 90° at both knees","Shift weight forward until stretch in front of back hip","Torso perfectly upright — don't lean forward"],tip:"Tight hip flexors cause lower back pain. This fixes them."},
    {name:"Shoulder Pendulum ⚠️",sets:"3",reps:"30 sec circles",anim:"swing",gifQuery:"shoulder pendulum rehabilitation impingement",steps:["Lean on table with healthy arm","Injured arm hangs completely loose","Rock body to create slow circular swings","Clockwise 30s, counterclockwise 30s"],tip:"⚠️ Every single day including rest day."},
    {name:"Band External Rotation ⚠️",sets:"3",reps:"20 each side",anim:"squeeze",gifQuery:"shoulder external rotation exercise band",steps:["Light band at elbow height","Elbow tucked to ribs at 90° — immovable","Rotate forearm outward slowly","Slow return. Work, never pain."],tip:"⚠️ Rebuilds rotator cuff daily."},
    {name:"Thoracic Stretch on Bed",sets:"1",reps:"2 min",anim:"stretch",gifQuery:"thoracic spine stretch forearms bed mobility",steps:["Kneel in front of bed","Both forearms on surface","Let chest sink DOWN — completely passive","Breathe slowly. Upper back opens dramatically."],tip:"Best home stretch for thoracic spine and shoulder impingement."},
  ]},
  {id:5,name:"CORE + LOWER",color:"#D4A017",emoji:"⚡",duration:"40 min",note:"Real core = bracing, not bending. These are more effective than crunches.",exercises:[
    {name:"Pallof Press",sets:"3",reps:"12 each side",anim:"squeeze",gifQuery:"pallof press resistance band core",steps:["Band in door at chest height","Stand sideways, feet shoulder-width","Hold band at chest with both hands","Press straight forward — hold 2s — return. Don't rotate."],tip:"Anti-rotation training = what core actually does in real life."},
    {name:"Dead Bug Weighted",sets:"3",reps:"10 each side",anim:"plank",gifQuery:"dead bug weighted dumbbell exercise",steps:["Lie on back, hold 5kg to ceiling","Lower arm behind head AND opposite leg simultaneously","Lower back COMPLETELY FLAT — always","Back arches = reduce range"],tip:"Adding weight makes core brace significantly harder."},
    {name:"Side Plank Modified",sets:"3",reps:"30 sec each side",anim:"plank",gifQuery:"side plank modified knees exercise",steps:["Lie on side, bottom knee bent","Push up onto bottom elbow","Lift hips until body forms diagonal","Hold steady. Breathe normally."],tip:"Obliques and QL — muscles preventing lower back pain."},
    {name:"Bulgarian Split Squat",sets:"3",reps:"8 each leg",anim:"lunge",gifQuery:"bulgarian split squat dumbbell exercise",steps:["2 feet in front of stable chair, 7kg each hand","One foot on chair behind you","Lower straight down until front thigh parallel to floor","Drive through front heel to return"],tip:"Hardest exercise in your program. Drop to bodyweight if form breaks."},
    {name:"Single Leg Deadlift",sets:"3",reps:"8 each side",anim:"hinge",gifQuery:"single leg romanian deadlift dumbbell balance",steps:["Stand on one leg, 10kg in OPPOSITE hand","Hinge forward at hip — back leg rises behind","Spine flat and neutral throughout","Drive standing hip forward to return"],tip:"Builds single-leg stability critical for stairs, outdoor activities."},
    {name:"Copenhagen Plank",sets:"3",reps:"20 sec each side",anim:"plank",gifQuery:"copenhagen plank adductor inner thigh",steps:["Lie on side, top foot on chair/sofa edge","Bottom leg is free","Push up so body forms straight diagonal line","Hold. Intense in inner thigh of top leg."],tip:"Most effective inner thigh exercise in existence. Very unusual but critical."},
  ]},
  {id:6,name:"PLYOMETRICS",color:"#E83A5A",emoji:"💥",duration:"30 min",note:"⚠️ Read your phase. Do NOT skip ahead. Tendons adapt slower than muscles.",exercises:[
    {name:"Phase 1 · Step Touch Fast (Wks 1-4)",sets:"4",reps:"45s on / 30s rest",anim:"march",gifQuery:"lateral step touch cardio exercise",steps:["Stand feet together","Step right foot wide right, left meets it","Step left foot wide left, right follows","As fast as you can control — no jumping"],tip:"Joint conditioning phase — mandatory before any jumping."},
    {name:"Phase 1 · Squat Pulses Fast (Wks 1-4)",sets:"3",reps:"1 min",anim:"squat",gifQuery:"squat pulse exercise",steps:["Sink into squat, STAY there","Fast small bouncy pulses — stay low","Chest up, core braced","Full minute without standing"],tip:"Conditions tendons around knee for impact."},
    {name:"Phase 2 · Pogos (Wks 5-8)",sets:"4",reps:"20",anim:"hop",gifQuery:"pogo jumps plyometric",steps:["Feet hip-width, slight knee bend","Very small rapid jumps — ANKLES do the work","Land soft on balls of feet, immediately spring back","Stiff springs — not deep knee bends"],tip:"Trains Achilles elastic storage — key to running economy."},
    {name:"Phase 2 · Squat Jumps (Wks 5-8)",sets:"3",reps:"8",anim:"hop",gifQuery:"squat jump plyometric exercise",steps:["Feet shoulder-width","Drop to squat, EXPLODE upward — arms swing up","At top: fully extend ankles, knees, hips","Land with soft bent knees. Silent landing = good form."],tip:"Loud landing = bad form = future injury. Silent = correct."},
    {name:"Phase 3 · Lateral Skater Jumps (Wk 9+)",sets:"4",reps:"10 each side",anim:"hop",gifQuery:"lateral skater jumps plyometric exercise",steps:["Stand on right foot","Bound sideways landing on LEFT foot only","Hold single-leg landing 2 seconds — control it","Then bound back. Control over speed."],tip:"Stick each landing before jumping again."},
    {name:"Phase 3 · Single Leg Hops (Wk 9+)",sets:"3",reps:"15 each leg",anim:"hop",gifQuery:"single leg line hops plyometric",steps:["Imagine a line on floor","Balance on one leg","Hop side to side — quick and controlled","Land soft, stabilize, then hop again"],tip:"Builds ankle stability and single-leg power."},
  ]},
  {id:7,name:"REST",color:"#607D8B",emoji:"😴",duration:"0 min",note:"Muscle is built during rest. This day matters as much as the others.",exercises:[
    {name:"Shoulder Pendulum (Always)",sets:"2",reps:"30 sec",anim:"swing",gifQuery:"shoulder pendulum exercise",steps:["Even on rest day — do this","Lean on table, injured arm hangs","Gentle circular swings from body rocking","2 minutes total"],tip:"Daily habit. Keeps healing momentum going."},
    {name:"Protein Target",sets:"—",reps:"110-150g",anim:"breathe",gifQuery:"high protein meal prep",steps:["Aim for 110-150g protein across all meals","Eggs, chicken, paneer, dal, fish, curd, whey","Spread across 3-4 meals","Without this, training breaks muscle down not builds it"],tip:"Food is literally part of the program."},
    {name:"8 Hours Sleep",sets:"—",reps:"8 hrs",anim:"breathe",gifQuery:"sleep recovery muscle growth",steps:["Growth hormone peaks during deep sleep — body changes happen here","Sleep deprivation raises cortisol which stores fat","Consistent wake/sleep times matter most","Phone off 30 min before bed"],tip:"More impactful than any supplement."},
  ]},
];

const getKegel = w=>`${4+Math.min(w,6)}s hold × ${8+w*2} reps × ${w<3?3:4} sets`;
const getHipThrust = w=>`3 sets × ${12+w*4} reps`;
const getPlank = w=>`3 × ${15+w*10}s hold`;
const getSqueeze = w=>`3 × ${15+w*2} reps`;

const PERF_CATS = [
  {title:"🎯 Pelvic Floor Control",subtitle:"Most direct impact on control and stamina",color:"#E83A5A",exercises:[
    {name:"Slow Kegel Hold",sets:"—",reps:"—",anim:"kegel",gifQuery:"kegel exercise pelvic floor",getTarget:getKegel,steps:["Sit or lie — no one can tell you're doing this","Find muscles by imagining stopping urination mid-flow — squeeze those","Squeeze and HOLD for target duration","Fully release for SAME duration. Release = as important as squeeze."],tip:"The #1 exercise. 3 months daily = noticeable lasting change."},
    {name:"Fast Kegel Flicks",sets:"3",reps:"20 fast pulses",anim:"kegel",gifQuery:"kegel exercise fast pelvic floor",steps:["Same muscles as above","Squeeze QUICKLY and release immediately — 1 per second","Rapid pulses — no holding","Rest 30s between sets"],tip:"Builds quick-twitch pelvic floor response — different quality than slow holds."},
    {name:"Reverse Kegel",sets:"3",reps:"10 holds",anim:"breathe",gifQuery:"reverse kegel pelvic floor relaxation",steps:["Instead of squeezing — gently PUSH OUT and downward","Like slowly exhaling air through the pelvic region","Hold the relaxed/expanded state for 4-6 seconds","Alternate: squeeze 5s → relax 5s → push out 5s → relax 5s = 1 cycle"],tip:"The ability to RELAX is what gives real control. Most men only train the squeeze — this is the missing half."},
    {name:"Kegel + Glute Bridge Combo",sets:"3",reps:"12",anim:"bridge",gifQuery:"glute bridge pelvic floor exercise",steps:["Set up for glute bridge on floor","As you drive hips up: squeeze kegel simultaneously","Hold both contractions at top for 3 seconds","Lower slowly, release kegel at bottom"],tip:"Trains pelvic floor and hip extensors as coordinated system — much more effective than isolated training."},
    {name:"Mula Bandha (Root Lock)",sets:"3",reps:"5 holds",anim:"kegel",gifQuery:"mula bandha yoga root lock",steps:["Sit cross-legged, spine tall","Contract entire pelvic floor — perineum, anus, deep abs together","Imagine lifting everything upward toward navel","Hold 10-20 seconds. Breathe NORMALLY — don't hold breath."],tip:"Yoga's advanced pelvic floor. Deeper than regular kegel — engages full pelvic basin."},
  ]},
  {title:"🔥 Hip & Glute Endurance",subtitle:"Power, thrust strength, staying power",color:"#E05A2B",exercises:[
    {name:"Hip Thrust High Rep",sets:"—",reps:"—",anim:"thrust",gifQuery:"hip thrust bodyweight high rep",getTarget:getHipThrust,steps:["Upper back against sofa, feet flat on floor","Drive hips up until body is flat from shoulders to knees","Squeeze glutes HARD at top — hold 2 seconds","Lower slowly. Build toward 50+ reps over weeks."],tip:"Build from 15 reps toward 50+ per set. Most directly relevant strength quality."},
    {name:"Single Leg Glute Bridge",sets:"3",reps:"15 each leg",anim:"bridge",gifQuery:"single leg glute bridge exercise",steps:["Lie on back, extend one leg straight","Drive hips up using ONLY planted leg","Squeeze hard at top, hold 2 seconds","Lower slowly. Keep hips level throughout."],tip:"Forces each side to work independently — fixes imbalances."},
    {name:"Frog Pumps",sets:"3",reps:"25",anim:"frog",gifQuery:"frog pumps glute exercise",steps:["Lie face UP, soles of feet together (butterfly but lying)","Knees drop out to sides — diamond shape","Drive hips straight up squeezing glutes","Small rapid pumps — stay near top, don't lower fully"],tip:"Unusual but highly effective — foot position forces maximum glute activation that regular bridges miss."},
    {name:"Donkey Kicks",sets:"3",reps:"15 each side",anim:"fire",gifQuery:"donkey kick exercise glute",steps:["On all fours — hands under shoulders, knees under hips","Keep knee bent at 90°","Drive foot straight up toward ceiling — squeeze glute","Lower slowly. Hip stays level — don't rotate body."],tip:"Isolates glute at top of hip extension range — the range that matters most for power."},
    {name:"Fire Hydrants",sets:"3",reps:"15 each side",anim:"fire",gifQuery:"fire hydrant exercise hip abductor",steps:["On all fours — same start position","Keep knee bent, lift it OUT to the SIDE","Go as high as possible while keeping spine neutral","Lower slowly with control"],tip:"Works glute medius and hip abductors — stabilizers different from donkey kicks."},
  ]},
  {title:"💪 Core Endurance",subtitle:"Stability and control under sustained effort",color:"#5B8FD4",exercises:[
    {name:"Plank Hold",sets:"—",reps:"—",anim:"plank",gifQuery:"plank hold core exercise",getTarget:getPlank,steps:["Forearms on floor, body straight from head to heels","Squeeze EVERYTHING: glutes, core, thighs, shoulders","Breathe normally — never hold breath","Build duration week by week"],tip:"Core endurance for supporting bodyweight. Build from 20s to 2 minutes."},
    {name:"Copenhagen Plank",sets:"3",reps:"15 sec each side",anim:"plank",gifQuery:"copenhagen plank adductor inner thigh exercise",steps:["Lie on side, top foot on chair/sofa edge","Bottom leg free in the air","Push up so body forms straight diagonal","Hold. Intense in inner thigh of top leg."],tip:"Most effective inner thigh exercise in existence."},
    {name:"Hollow Body Hold",sets:"3",reps:"20 sec",anim:"plank",gifQuery:"hollow body hold gymnastics core exercise",steps:["Lie on back, press lower back FLAT into floor — stays flat entire time","Arms reach overhead, legs slightly raised","You should look slightly banana-curved","Hold. Lower back FLAT or the exercise isn't working."],tip:"Gymnastic core training. Whole-body tension highly transferable."},
    {name:"Inner Thigh Squeeze (Pillow)",sets:"—",reps:"—",anim:"squeeze",gifQuery:"inner thigh squeeze exercise",getTarget:getSqueeze,steps:["Lie on back, knees bent","Place rolled pillow between your knees","Squeeze knees together — maximum effort","Hold 3 seconds, release fully. Repeat."],tip:"Adductor strength contributes to hip stability and control."},
  ]},
  {title:"🧘 Flexibility & Positioning",subtitle:"Range, comfort, and hip openness",color:"#9B6BC4",exercises:[
    {name:"Happy Baby Pose",sets:"1",reps:"90 sec",anim:"frog",gifQuery:"happy baby pose yoga hip opener",steps:["Lie on back, bring knees toward chest","Reach hands to OUTSIDE edges of feet and hold","Pull feet apart — knees draw toward armpits","Rock gently side to side. Let lower back flatten into floor."],tip:"Unusual for men but brilliant — inner groin, hip flexors, lower back all at once. Do daily."},
    {name:"Deep Squat Hold",sets:"1",reps:"60-120 sec",anim:"squat",gifQuery:"deep squat hold hip flexibility",steps:["Hold door frame for support","Lower into deepest squat possible","Gently shift weight side to side, forward and back","Work toward releasing the door and holding freely"],tip:"Build from 30s to 2+ minutes."},
    {name:"Butterfly Stretch",sets:"1",reps:"90 sec",anim:"frog",gifQuery:"butterfly stretch inner thigh groin",steps:["Sit with soles of feet together, knees dropping","Hold feet with both hands","Lean forward gently from hips — spine stays long","Elbows gently push knees closer to floor"],tip:"Inner thigh and hip opener."},
    {name:"Lizard Pose",sets:"1",reps:"60 sec each side",anim:"lunge",gifQuery:"lizard pose yoga hip flexor deep stretch",steps:["Lunge with right foot forward, outside of foot","Lower left knee to floor","Walk right foot out to the right side","Drop to forearms if possible"],tip:"Deep hip flexor and inner groin stretch combined."},
    {name:"Frog Stretch",sets:"1",reps:"90 sec",anim:"frog",gifQuery:"frog stretch hip groin flexibility",steps:["On all fours","Walk knees out wide","Turn feet out to match knees","Sink hips back and down toward floor. Breathe deeply."],tip:"One of the deepest hip and groin openers available."},
  ]},
  {title:"🫁 Breathing & Mental Control",subtitle:"Composure and endurance under effort",color:"#4CAF82",exercises:[
    {name:"Box Breathing",sets:"1",reps:"5 min daily",anim:"breathe",gifQuery:"box breathing technique exercise",steps:["Sit comfortably, spine straight","Inhale slowly for 4 counts","Hold 4 counts","Exhale slowly 4 counts, then hold empty 4 counts. That's 1 cycle."],tip:"Trains nervous system composure under exertion. Directly extends endurance."},
    {name:"Rhythmic Breath Matching",sets:"3",reps:"2 min each",anim:"breathe",gifQuery:"rhythmic breathing exercise technique",steps:["Begin hip thrusts at slow steady pace","Match each thrust to a breath — exhale on effort, inhale on return","When comfortable: double the pace but maintain breath rhythm","This trains calm under sustained effort"],tip:"The reason people lose stamina is losing breath control. This trains the solution."},
    {name:"Hypopressive Breathing",sets:"3",reps:"5 cycles",anim:"breathe",gifQuery:"hypopressive breathing technique core",steps:["Stand or sit tall, exhale ALL air out completely","Without inhaling: expand your ribcage outward (not breathing — just expanding)","Hold this vacuum state for 10-15 seconds","Release and breathe normally"],tip:"Passive pelvic floor training through breath. Used in European sports medicine."},
  ]},
];

const RULES=[
  {icon:"🩺",title:"Shoulder rule",desc:"ANY shoulder pain = stop immediately. Pain-free range only. Every time."},
  {icon:"🦵",title:"Knee rule",desc:"Knee tracks over 2nd toe. Never inward. If it caves: reduce weight."},
  {icon:"🫁",title:"Breathing",desc:"Exhale on effort. Inhale on recovery. Never hold breath during any exercise."},
  {icon:"📈",title:"Progress rule",desc:"Add 1-2 reps or small weight increase every 2 WEEKS. Slow = sustainable."},
  {icon:"💧",title:"Hydration",desc:"3-3.5L daily at your weight. Before, during, and after sessions."},
  {icon:"🍗",title:"Protein",desc:"110-150g daily. Without this workouts break muscle down. Non-negotiable."},
  {icon:"😴",title:"Sleep",desc:"7-8 hours. Growth hormone releases during deep sleep. Body changes happen here."},
  {icon:"🎯",title:"Timeline",desc:"Month 1: Learn movements. Month 2-3: Endurance climbs. Month 4: Visible changes. Month 6: Full plyos, shoulder healed."},
];

// ─── APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [checked, setChecked] = useState({});
  const [view, setView] = useState("schedule");
  const [activeDay, setActiveDay] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [perfWeek, setPerfWeek] = useState(1);
  const [modal, setModal] = useState(null);
  const [openCat, setOpenCat] = useState(Object.fromEntries(PERF_CATS.map((_,i)=>[i,i<2])));

  const toggle = k => setChecked(p=>({...p,[k]:!p[k]}));
  const expand = k => setExpanded(p=>({...p,[k]:!p[k]}));

  const dayProgress = id => {
    const day = DAYS.find(d=>d.id===id);
    if(!day) return {done:0,total:0};
    return {done:day.exercises.filter((_,i)=>checked[`d${id}_${i}`]).length, total:day.exercises.length};
  };
  const resetDay = id => {
    const day=DAYS.find(d=>d.id===id);
    if(!day) return;
    setChecked(p=>{const n={...p};day.exercises.forEach((_,i)=>delete n[`d${id}_${i}`]);return n;});
  };

  const perfTotal = PERF_CATS.reduce((a,c)=>a+c.exercises.length,0);
  const perfDone = PERF_CATS.reduce((a,c,ci)=>a+c.exercises.filter((_,i)=>checked[`p${ci}_${i}`]).length,0);
  const sel = DAYS.find(d=>d.id===activeDay);
  const navView = view==="day"?"schedule":view;

  return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#0D0D12",minHeight:"100vh",color:"#E8E8EC",maxWidth:480,margin:"0 auto",paddingBottom:80}}>
      <style>{CSS}</style>
      {modal&&<ImgModal name={modal.name} query={modal.query} color={modal.color} onClose={()=>setModal(null)}/>}

      {/* Sticky header */}
      <div style={{padding:"18px 16px 12px",background:"#0D0D12",position:"sticky",top:0,zIndex:10,borderBottom:"1px solid #181824"}}>
        {view==="day"&&sel
          ?<button onClick={()=>{setView("schedule");setActiveDay(null);}} style={{background:"none",border:"none",color:sel.color,fontSize:14,cursor:"pointer",padding:0,marginBottom:10,display:"block"}}>← Schedule</button>
          :<div style={{marginBottom:10}}><div style={{fontSize:10,letterSpacing:3,color:"#444",textTransform:"uppercase"}}>7-Day Home Routine</div><div style={{fontSize:21,fontWeight:800,marginTop:2}}>Your <span style={{color:"#4CAF82"}}>Blueprint</span></div></div>
        }
        <div style={{display:"flex",gap:6}}>
          {[{id:"schedule",label:"📅 Schedule"},{id:"performance",label:"🔥 Performance"},{id:"rules",label:"📋 Rules"}].map(tab=>(
            <button key={tab.id} onClick={()=>{setView(tab.id);setActiveDay(null);}}
              style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,
                background:navView===tab.id?"#4CAF82":"#181824",color:navView===tab.id?"#000":"#666",transition:"all 0.15s",whiteSpace:"nowrap"}}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SCHEDULE */}
      {view==="schedule"&&(
        <div style={{padding:"14px 16px"}}>
          <div style={{background:"#14101A",border:"1px solid #2A1A3A",borderRadius:12,padding:"12px 14px",marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:700,color:"#E83A5A",marginBottom:5}}>⚡ Plyometrics Phase</div>
            <div style={{fontSize:12,color:"#888",lineHeight:1.7}}>
              <b style={{color:"#E8E8EC"}}>Wks 1–4:</b> Phase 1 (low impact only)<br/>
              <b style={{color:"#E8E8EC"}}>Wks 5–8:</b> Phase 2 (add pogos + squat jumps)<br/>
              <b style={{color:"#E8E8EC"}}>Wk 9+:</b> Phase 3 (full plyometrics)
            </div>
          </div>
          {DAYS.map(day=>{
            const{done,total}=dayProgress(day.id);
            return(
              <button key={day.id} onClick={()=>{setActiveDay(day.id);setView("day");}}
                style={{display:"flex",alignItems:"center",width:"100%",background:"#14141E",border:"1px solid #1C1C2C",borderLeft:`4px solid ${day.color}`,borderRadius:12,padding:"13px",marginBottom:9,cursor:"pointer",textAlign:"left"}}>
                <div style={{width:44,height:44,borderRadius:10,background:day.color+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,marginRight:12,flexShrink:0}}>{day.emoji}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                    <span style={{fontSize:10,color:day.color,fontWeight:800,letterSpacing:1}}>DAY {day.id}</span>
                    <span style={{fontSize:10,color:"#444"}}>· {day.duration}</span>
                    {done>0&&<span style={{fontSize:10,color:day.color,marginLeft:"auto"}}>{done}/{total}</span>}
                  </div>
                  <div style={{fontSize:15,fontWeight:700}}>{day.name}</div>
                  <div style={{height:3,background:"#1C1C2C",borderRadius:2,marginTop:6,overflow:"hidden"}}>
                    <div style={{width:`${total>0?(done/total)*100:0}%`,height:"100%",background:day.color,borderRadius:2,transition:"width 0.4s"}}/>
                  </div>
                </div>
                <div style={{color:"#333",fontSize:18,marginLeft:10}}>›</div>
              </button>
            );
          })}
        </div>
      )}

      {/* DAY DETAIL */}
      {view==="day"&&sel&&(
        <div>
          <div style={{padding:"14px 16px",background:"#0F0F16"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:50,height:50,borderRadius:12,background:sel.color+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{sel.emoji}</div>
              <div><div style={{fontSize:11,color:sel.color,fontWeight:800,letterSpacing:1}}>DAY {sel.id} · {sel.duration}</div><div style={{fontSize:19,fontWeight:800}}>{sel.name}</div></div>
            </div>
            <div style={{background:"#09090F",borderLeft:`3px solid ${sel.color}`,borderRadius:"0 8px 8px 0",padding:"9px 12px",marginTop:12,fontSize:13,color:"#999",lineHeight:1.5}}>💬 {sel.note}</div>
            {(()=>{const{done,total}=dayProgress(sel.id);return(
              <div style={{marginTop:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:12,color:"#555"}}>{done} of {total} done</span>
                  {done>0&&<button onClick={()=>resetDay(sel.id)} style={{background:"none",border:"1px solid #2A2A2A",borderRadius:6,color:"#555",fontSize:11,cursor:"pointer",padding:"3px 10px"}}>Reset</button>}
                </div>
                <div style={{height:4,background:"#181824",borderRadius:2,overflow:"hidden"}}>
                  <div style={{width:`${total>0?(done/total)*100:0}%`,height:"100%",background:sel.color,transition:"width 0.4s",borderRadius:2}}/>
                </div>
              </div>
            );})()}
          </div>
          <div style={{padding:"12px 16px"}}>
            {sel.exercises.map((ex,i)=>{const k=`d${sel.id}_${i}`;return(
              <ExCard key={k} ex={ex} cardKey={k} color={sel.color} isChecked={!!checked[k]} onCheck={()=>toggle(k)} isExpanded={!!expanded[k]} onExpand={()=>expand(k)} onSearch={()=>setModal({name:ex.name,query:ex.gifQuery||ex.name,color:sel.color})}/>
            );})}
          </div>
        </div>
      )}

      {/* PERFORMANCE */}
      {view==="performance"&&(
        <div style={{padding:"14px 16px"}}>
          <div style={{background:"#150A0A",border:"1px solid #3A1A1A",borderRadius:12,padding:"13px",marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:800,color:"#E83A5A",marginBottom:5}}>🔥 Performance & Endurance</div>
            <div style={{fontSize:13,color:"#999",lineHeight:1.6}}>Daily progressive practice. Targets update by week. All exercises build stamina, control, and endurance.</div>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,color:"#555",letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Select Your Current Week</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {[1,2,3,4,5,6,7,8].map(w=>(
                <button key={w} onClick={()=>setPerfWeek(w)} style={{width:38,height:38,borderRadius:8,border:"none",background:perfWeek===w?"#E83A5A":"#181824",color:perfWeek===w?"#fff":"#555",fontWeight:700,fontSize:13,cursor:"pointer",transition:"all 0.15s"}}>W{w}</button>
              ))}
            </div>
          </div>
          <div style={{background:"#0F0F16",border:"1px solid #1C1C2C",borderRadius:12,padding:"12px 14px",marginBottom:14}}>
            <div style={{fontSize:12,color:"#E83A5A",fontWeight:700,marginBottom:8}}>Week {perfWeek} Targets</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[{l:"Kegel",v:getKegel(perfWeek)},{l:"Hip Thrust",v:getHipThrust(perfWeek)},{l:"Plank",v:getPlank(perfWeek)},{l:"Inner Thigh",v:getSqueeze(perfWeek)}].map(t=>(
                <div key={t.l} style={{background:"#14141E",borderRadius:8,padding:"8px 10px"}}>
                  <div style={{fontSize:10,color:"#555",marginBottom:2}}>{t.l}</div>
                  <div style={{fontSize:11,color:"#E8E8EC",fontWeight:700,lineHeight:1.3}}>{t.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:12,color:"#555"}}>{perfDone}/{perfTotal} done today</span>
            {perfDone>0&&<button onClick={()=>setChecked(p=>{const n={...p};PERF_CATS.forEach((c,ci)=>c.exercises.forEach((_,i)=>delete n[`p${ci}_${i}`]));return n;})} style={{background:"none",border:"1px solid #2A2A2A",borderRadius:6,color:"#555",fontSize:11,cursor:"pointer",padding:"3px 10px"}}>Reset All</button>}
          </div>
          <div style={{height:4,background:"#181824",borderRadius:2,overflow:"hidden",marginBottom:14}}>
            <div style={{width:`${perfTotal>0?(perfDone/perfTotal)*100:0}%`,height:"100%",background:"#E83A5A",transition:"width 0.4s",borderRadius:2}}/>
          </div>
          {PERF_CATS.map((cat,ci)=>(
            <div key={ci} style={{marginBottom:10}}>
              <button onClick={()=>setOpenCat(p=>({...p,[ci]:!p[ci]}))} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#181824",border:"none",borderRadius:openCat[ci]?"10px 10px 0 0":10,padding:"12px 14px",cursor:"pointer",color:"#E8E8EC"}}>
                <div style={{textAlign:"left"}}>
                  <div style={{fontSize:13,fontWeight:800,color:cat.color}}>{cat.title}</div>
                  <div style={{fontSize:11,color:"#444",marginTop:2}}>{cat.subtitle}</div>
                </div>
                <span style={{color:"#444",fontSize:12,marginLeft:8}}>{openCat[ci]?"▴":"▾"}</span>
              </button>
              {openCat[ci]&&(
                <div style={{background:"#111118",border:"1px solid #181824",borderTop:"none",borderRadius:"0 0 10px 10px",padding:"10px 10px 4px"}}>
                  {cat.exercises.map((ex,i)=>{const k=`p${ci}_${i}`;return(
                    <ExCard key={k} ex={ex} cardKey={k} color={cat.color} isChecked={!!checked[k]} onCheck={()=>toggle(k)} isExpanded={!!expanded[k]} onExpand={()=>expand(k)} onSearch={()=>setModal({name:ex.name,query:ex.gifQuery||ex.name,color:cat.color})} weekNum={perfWeek}/>
                  );})}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* RULES */}
      {view==="rules"&&(
        <div style={{padding:"14px 16px"}}>
          {RULES.map((r,i)=>(
            <div key={i} style={{background:"#14141E",border:"1px solid #1C1C2C",borderRadius:12,padding:"14px",marginBottom:9,display:"flex",gap:14,alignItems:"flex-start"}}>
              <div style={{fontSize:22,flexShrink:0}}>{r.icon}</div>
              <div><div style={{fontSize:14,fontWeight:700,marginBottom:4}}>{r.title}</div><div style={{fontSize:13,color:"#888",lineHeight:1.55}}>{r.desc}</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
