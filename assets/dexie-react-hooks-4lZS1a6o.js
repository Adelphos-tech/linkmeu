import{c as b,R as s}from"./index-B8TTN9f3.js";import{t as v}from"./database-BVUcwnx2.js";/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R=b("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=b("MapPin",[["path",{d:"M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z",key:"2oe9fu"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]]);function y(n,o,a){var i,f;typeof n=="function"?(i=o||[],f=a):(i=[],f=o);var r=s.useRef({hasResult:!1,result:f,error:null}),c=s.useReducer(function(e){return e+1},0);c[0];var l=c[1],p=s.useMemo(function(){var e=typeof n=="function"?n():n;if(!e||typeof e.subscribe!="function")throw n===e?new TypeError("Given argument to useObservable() was neither a valid observable nor a function."):new TypeError("Observable factory given to useObservable() did not return a valid observable.");if(!r.current.hasResult&&typeof window<"u"&&(typeof e.hasValue!="function"||e.hasValue()))if(typeof e.getValue=="function")r.current.result=e.getValue(),r.current.hasResult=!0;else{var t=e.subscribe(function(u){r.current.result=u,r.current.hasResult=!0});typeof t=="function"?t():t.unsubscribe()}return e},i);if(s.useDebugValue(r.current.result),s.useEffect(function(){var e=p.subscribe(function(t){var u=r.current;(u.error!==null||u.result!==t)&&(u.error=null,u.result=t,u.hasResult=!0,l())},function(t){var u=r.current;u.error!==t&&(u.error=t,l())});return typeof e=="function"?e:e.unsubscribe.bind(e)},i),r.current.error)throw r.current.error;return r.current.result}function w(n,o,a){return y(function(){return v(n)},o||[],a)}export{R as L,g as M,w as u};
