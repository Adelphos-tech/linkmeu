import{c as d}from"./index-B8TTN9f3.js";/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=d("FileText",[["path",{d:"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",key:"1nnpy2"}],["polyline",{points:"14 2 14 8 20 8",key:"1ew0cm"}],["line",{x1:"16",x2:"8",y1:"13",y2:"13",key:"14keom"}],["line",{x1:"16",x2:"8",y1:"17",y2:"17",key:"17nazh"}],["line",{x1:"10",x2:"8",y1:"9",y2:"9",key:"1a5vjj"}]]),m=(t,o)=>{if(!t||t.length===0){alert("No data to export");return}const e=Object.keys(t[0]),i=[e.join(","),...t.map(a=>e.map(s=>{const l=a[s]||"";return`"${String(l).replace(/"/g,'""')}"`}).join(","))].join(`
`),c=new Blob([i],{type:"text/csv;charset=utf-8;"}),n=document.createElement("a"),r=URL.createObjectURL(c);n.setAttribute("href",r),n.setAttribute("download",o),n.style.visibility="hidden",document.body.appendChild(n),n.click(),document.body.removeChild(n)},u=(t,o=!1)=>t.map(e=>({Name:e.name,Email:e.email,Contact:e.contact||"",Notes:e.notes||"",Attended:o?e.attended?"Yes":"No":"Registered","Registration Date":new Date(e.registeredAt).toLocaleString()}));export{p as F,m as e,u as p};
