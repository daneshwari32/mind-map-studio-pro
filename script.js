let nodes = [{id:1, x:350, y:250, text:"Main Topic", central:true}];
let connections = [];
let selectedNode = null;
let connectFrom = null;
let mode = 'select';
let nodeIdCounter = 2;

const container = document.getElementById('mindmap-container');
const nodesLayer = document.getElementById('nodes-layer');
const svg = document.getElementById('lines');

function render(){
  nodesLayer.innerHTML='';
  svg.innerHTML='';

  // Draw connections
  connections.forEach(c=>{
    let from = nodes.find(n=>n.id===c.from);
    let to = nodes.find(n=>n.id===c.to);
    if(!from ||!to) return;
    let line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',from.x); line.setAttribute('y1',from.y);
    line.setAttribute('x2',to.x); line.setAttribute('y2',to.y);
    line.setAttribute('stroke','#636e72'); line.setAttribute('stroke-width','3');
    svg.appendChild(line);
  });

  // Draw nodes
  nodes.forEach(n=>{
    let div = document.createElement('div');
    div.className = 'node' + (n.central? ' central' : '') + (selectedNode===n.id? ' selected' : '');
    div.style.left = n.x+'px'; div.style.top = n.y+'px';
    div.innerText = n.text;
    div.onclick = (e)=>{ e.stopPropagation(); handleNodeClick(n.id); };
    div.ondblclick = ()=>{ editNode(n.id); };
    makeDraggable(div, n);
    nodesLayer.appendChild(div);
  });
}

function handleNodeClick(id){
  if(mode==='connect'){
    if(!connectFrom){ connectFrom=id; selectedNode=id; document.getElementById('status').innerText='Now click second node to connect...'; }
    else{
      if(connectFrom!==id){ connections.push({from:connectFrom, to:id}); saveToLocal(); }
      connectFrom=null; mode='select'; document.getElementById('btnConnect').classList.remove('active');
      document.getElementById('status').innerText='Connected!';
    }
  } else { selectedNode=id; }
  render();
}

function addNode(x=0,y=0,text=null){
  let txt = text || prompt('Enter topic / idea:','New Idea');
  if(!txt) return;
  let posX = x || 200 + Math.random()*300;
  let posY = y || 150 + Math.random()*250;
  nodes.push({id:nodeIdCounter++, x:posX, y:posY, text:txt});
  saveToLocal(); render();
}

function setMode(m){
  mode=m;
  if(m==='connect'){ document.getElementById('btnConnect').classList.add('active'); document.getElementById('status').innerText='Connect Mode: Click 2 nodes to connect'; connectFrom=null; }
}

function editNode(id=null){
  let targetId = id || selectedNode;
  if(!targetId) return alert('Select a node first!');
  let node = nodes.find(n=>n.id===targetId);
  let newText = prompt('Edit node:', node.text);
  if(newText){ node.text=newText; saveToLocal(); render(); }
}

function deleteNode(){
  if(!selectedNode) return alert('Select a node first!');
  if(selectedNode===1) return alert('Cannot delete main topic!');
  nodes = nodes.filter(n=>n.id!==selectedNode);
  connections = connections.filter(c=>c.from!==selectedNode && c.to!==selectedNode);
  selectedNode=null; saveToLocal(); render();
}

function makeDraggable(el, node){
  let isDragging=false, startX, startY;
  el.onmousedown = (e)=>{
    isDragging=true; startX=e.clientX-node.x; startY=e.clientY-node.y;
  };
  document.onmousemove = (e)=>{
    if(!isDragging) return;
    node.x=e.clientX-startX; node.y=e.clientY-startY; render();
  };
  document.onmouseup = ()=>{ if(isDragging){ isDragging=false; saveToLocal(); } };
}

container.onclick = (e)=>{
  if(e.target.id==='mindmap-container' || e.target.id==='nodes-layer'){
    let rect=container.getBoundingClientRect();
    addNode(e.clientX-rect.left, e.clientY-rect.top);
  }
};

function saveToLocal(){ localStorage.setItem('mindmapPro', JSON.stringify({nodes, connections, counter:nodeIdCounter})); }

function saveMap(){
  saveToLocal();
  let data = JSON.stringify({nodes, connections}, null, 2);
  let blob = new Blob([data], {type:'application/json'});
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a'); a.href=url; a.download='my-mindmap.json'; a.click();
  document.getElementById('status').innerText='Saved! File downloaded + Auto saved in browser';
}

function loadMap(){
  let saved = localStorage.getItem('mindmapPro');
  if(saved){ let data=JSON.parse(saved); nodes=data.nodes; connections=data.connections; nodeIdCounter=data.counter||10; render(); document.getElementById('status').innerText='Loaded from browser storage!'; }
  else alert('No saved map found!');
}

function clearMap(){ if(confirm('Clear all?')){ nodes=[{id:1,x:350,y:250,text:"Main Topic",central:true}]; connections=[]; nodeIdCounter=2; saveToLocal(); render(); } }

// OCR Feature
document.getElementById('upload').onchange = async (e)=>{
  let file=e.target.files[0];
  document.getElementById('status').innerText='Scanning notes... 15 sec...';
  let result=await Tesseract.recognize(file,'eng');
  let lines=result.data.text.split('\n').filter(l=>l.trim().length>10).slice(0,6);
  lines.forEach((txt,i)=>{
    let angle=(i/lines.length)*Math.PI*2;
    addNode(350+Math.cos(angle)*180, 250+Math.sin(angle)*180, txt.substring(0,30));
  });
  document.getElementById('status').innerText='Notes scanned and converted to nodes!';
};

// Init
let saved = localStorage.getItem('mindmapPro');
if(saved){ try{ let d=JSON.parse(saved); nodes=d.nodes; connections=d.connections; nodeIdCounter=d.counter; }catch(e){} }
render();