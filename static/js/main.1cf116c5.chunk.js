(this.webpackJsonpdamjiro=this.webpackJsonpdamjiro||[]).push([[0],{38:function(e,t,n){e.exports=n(84)},43:function(e,t,n){},84:function(e,t,n){"use strict";n.r(t);var r=n(0),a=n.n(r),u=n(9),o=n.n(u),c=(n(43),n(8)),i=n(4),l=n.n(i),s=n(1),f=n(28),p=n(15),d=n(29),h=n(2),E=n(3),m=n(33),v=n(17),b=n.n(v),g=n(11),O=n(18),y=n.n(O),j=n(31),S=n(32),T=n.n(S),w=n(19),k=n.n(w),_=n(7),N=n.n(_);function x(){var e=Object(f.a)(["\n  width: 80vw;\n  height: 80vh;\n"]);return x=function(){return e},e}function I(e,t){return Math.floor(e/t)*t}function M(e,t){return function(n,r){for(var a=r-n;0!==a;){var u=Math.floor(a/2),o=n+u;t(e[o])?(a-=u+1,n=o+1):a=u}return n}(0,e.length)}function R(e,t,n){var r={notes:e.map((function(e){return[Math.round(e.tpos),Math.round(e.duration),Math.round(e.pitch)]})),youtubeVideoId:t,timeOffset:n};return JSON.stringify(r)}function F(){return U.apply(this,arguments)}function U(){return(U=Object(p.a)(l.a.mark((function e(){var t,n,r,a,u;return l.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t=new AudioContext,e.next=3,navigator.mediaDevices.getUserMedia({audio:!0,video:!1});case 3:return n=e.sent,e.next=6,new Promise((function(e){var r=T.a.pitchDetection("./model",t,n,(function(){e(r)}))}));case 6:return r=e.sent,a=function(){return new Promise((function(e,t){return r.getPitch((function(n,r){n&&t(n),r||e(null);var a=Math.round(Math.log(r/440)/Math.log(2)*12)+69;e(a)}))}))},u=function(){n.getTracks().forEach((function(e){return e.stop()})),t.close()},e.abrupt("return",[a,u]);case 10:case"end":return e.stop()}}),e)})))).apply(this,arguments)}var C=m.a.svg(x());function A(e){var t,n,r,u=e.curtpos,o=e.gNotes,c=e.uNotes,i=e.seconds,l=100*i,s=function(e){return 100*e/1e6},f=I(s(u),l),p=I(s(u),l)+l,d=function(e){return s(e)-f},h=function(e,t){return e.filter((function(e){return f<s(e.tpos+e.duration)&&s(e.tpos)<p})).reduce((function(e,t){if(0===e.length)return[t];var n,r,a=e[e.length-1];return a.pitch===t.pitch&&(n=a.tpos+a.duration,r=t.tpos,Math.abs(n-r)<1e-4)?(e[e.length-1]={tpos:a.tpos,duration:t.tpos+t.duration-a.tpos,pitch:a.pitch},e):e.concat(t)}),[]).map((function(e){return a.a.createElement(a.a.Fragment,{key:e.tpos},a.a.createElement("rect",{x:d(e.tpos),y:500-5*e.pitch,width:s(e.duration),height:5,rx:1,ry:1,fill:t,fillOpacity:.7}))}))};return a.a.createElement(a.a.Fragment,null,a.a.createElement("p",null,u),a.a.createElement(C,{viewBox:"0,0,"+l+",500",preserveAspectRatio:"none"},a.a.createElement("line",{x1:0,x2:l,y1:0,y2:0,strokeWidth:5,stroke:"gray"}),a.a.createElement("line",{x1:0,x2:l,y1:500,y2:500,strokeWidth:5,stroke:"gray"}),(t=0,n=l,r=100,Array.from({length:(n-t)/r+1},(function(e,n){return t+n*r}))).map((function(e){return a.a.createElement("line",{key:e,x1:e,x2:e,y1:0,y2:500,strokeWidth:1,stroke:"gray",fillOpacity:.7})})),a.a.createElement("line",{x1:d(u),x2:d(u),y1:0,y2:500,strokeWidth:1,stroke:"red"}),h(o,"gray"),h(c.filter((function(e){return e.correct})),"#FFA500"),h(c.filter((function(e){return!e.correct})),"red")))}function P(e){var t=e.dispatch,n=Object(r.useState)(""),u=Object(s.a)(n,2),o=u[0],c=u[1],i=Object(r.useState)(null),l=Object(s.a)(i,2),f=l[0],p=l[1];return a.a.createElement("div",null,a.a.createElement("textarea",{value:o,onChange:function(e){c(e.target.value);try{var n=JSON.parse(e.target.value),r=n.notes.map((function(e){return{tpos:e[0],duration:e[1],pitch:e[2]}})),a=n.youtubeVideoId,u=n.timeOffset;if(!("string"===typeof(o=a)||o instanceof String)||isNaN(u))throw new Error("Invalid JSON");t({type:"SET_GAKUFU",gakufu:{notes:r,videoId:a}}),t({type:"SET_USER_TIME_OFFSET",value:u}),p(null)}catch(e){t({type:"RESET_GAKUFU"}),p(e.message)}var o;t({type:"RESET_USER_NOTES"})}}),f)}function D(e){var t=e.timeOffset,n=e.dispatch;return a.a.createElement("div",null,a.a.createElement("input",{type:"number",value:Math.floor(t/1e3),onChange:function(e){return n({type:"SET_USER_TIME_OFFSET",value:1e3*Number(e.target.value)})},required:!0}),"ms")}function V(e){var t=e.pitchOffset,n=e.dispatch;return a.a.createElement("div",null,a.a.createElement("input",{type:"number",value:Math.floor(t),onChange:function(e){return n({type:"SET_USER_PITCH_OFFSET",value:Number(e.target.value)})},required:!0}),"note#")}function B(e){var t=e.dispatch,n=e.gakufu,u=e.user,o=u.notes,c=u.timeOffset,i=u.pitchOffset,f=Object(r.useRef)(!1),d=Object(r.useRef)(c),h=Object(r.useRef)(i),E=Object(r.useState)(0),m=Object(s.a)(E,2),v=m[0],g=m[1],O=Object(r.useRef)(null),y=Object(r.useCallback)(Object(p.a)(l.a.mark((function e(){var r,a,u,o,c,i,p,E,m,v,b,y,j,S,T;return l.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(!f.current){e.next=2;break}return e.abrupt("return");case 2:return f.current=!0,r=setInterval((function(){return g(1e3*O.current.getCurrentTime()*1e3)}),25),e.next=6,F();case 6:a=e.sent,u=Object(s.a)(a,2),o=u[0],c=u[1],t({type:"RESET_USER_NOTES"}),p=(i=function(){return 1e6*O.current.getCurrentTime()-d.current})();case 13:if(!f.current){e.next=22;break}return e.next=16,o();case 16:E=e.sent,m=i(),E&&(v=m-p,b=E,y=!1,j=M(n.notes,(function(e){return e.tpos<p}))-1,(S=j>=0?n.notes[j]:n.notes[0])&&(b=S.pitch+h.current,(T=E-b-12*Math.floor((E-b)/12))>6&&(T-=12),b+=T,S.tpos<p&&p<S.tpos+S.duration&&0==T&&(y=!0)),t({type:"APPEND_USER_NOTE",note:{tpos:p,duration:v,pitch:b,correct:y}})),p=m,e.next=13;break;case 22:c(),clearInterval(r);case 24:case"end":return e.stop()}}),e)}))),[n.notes,t]);return d.current=c,h.current=i,n.notes?a.a.createElement(a.a.Fragment,null,a.a.createElement(b.a,{videoId:n.videoId,onReady:function(e){return O.current=e.target},onPlay:y,onPause:function(){return f.current=!1},onEnd:function(){return f.current=!1}}),n.notes&&a.a.createElement(A,{curtpos:v,gNotes:n.notes,uNotes:o,seconds:30})):a.a.createElement("div",null)}function W(e){var t=e.gNotes,n=e.uNotes;if(!t||!n)return a.a.createElement("div",null);var r=1.2*(100*(n.reduce((function(e,n){var r=t[M(t,(function(e){return e.tpos<n.tpos}))-1];if(!r||r.tpos+r.duration<n.tpos)return e;var a,u=Math.abs(n.pitch-r.pitch);return e+n.duration*(1-(a=u)/(1+Math.abs(a)))}),0)/t.reduce((function(e,t){return e+t.duration}),0))+0);return a.a.createElement("div",null,"Score: ",Math.round(100*r)/100)}function J(){var e=Object(r.useState)(null),t=Object(s.a)(e,2),n=t[0],u=t[1],o=Object(r.useState)(0),c=Object(s.a)(o,2),i=c[0],l=c[1],f=Object(r.useState)(0),p=Object(s.a)(f,2),h=p[0],E=p[1],m=Object(r.useState)(0),v=Object(s.a)(m,2),g=v[0],O=v[1],y=Object(r.useState)(0),j=Object(s.a)(y,2),S=j[0],T=j[1],w=Object(r.useState)(null),_=Object(s.a)(w,2),x=_[0],I=_[1],M=Object(r.useState)(null),F=Object(s.a)(M,2),U=F[0],C=F[1],P=Object(r.useRef)(null),D=[],V=[];if(n)try{V=function(e,t,n){if(0===e.length)return e;var r=e[0].tpos;return e.map((function(e){return{tpos:e.tpos-r+t,duration:e.duration,pitch:e.pitch+n}}))}(D=function(e,t,n){var r=new k.a(e);if(2===r.header.getFormat())throw new Error("Unsupported format of MIDI");if(0===r.header.getTracksCount())throw new Error("Not enough tracks");if(r.header.getTimeDivision()!==k.a.Header.TICKS_PER_BEAT)throw new Error("Unsupported time division");var a,u=r.header.getTicksPerBeat(),o=null,c=[],i=[],l=r.getTrackEvents(t),s=0,f=Object(d.a)(l);try{for(f.s();!(a=f.n()).done;){var p=a.value;switch(s+=p.delta,p.subtype){case N.a.EVENT_META_SET_TEMPO:o=p.tempo;break;case N.a.EVENT_MIDI_NOTE_ON:if(p.channel!==n)break;c.push([s,p.param1]);break;case N.a.EVENT_MIDI_NOTE_OFF:if(p.channel!==n)break;if(0===c.length||c[c.length-1][1]!==p.param1)throw new Error("Invalid note off");i.push([s,p.param1])}}}catch(b){f.e(b)}finally{f.f()}if(!o)throw new Error("Tempo Not found");if(c.length!==i.length)throw new Error("Invalid # of note offs");for(var h=[],E=0;E<c.length;E++){var m=c[E],v=i[E];h.push({tpos:m[0]*o/u,duration:(v[0]-m[0])*o/u,pitch:m[1]})}return h}(n,i,h),1e6*g,S),P.current=null}catch(B){P.current=B.message}return Object(r.useEffect)((function(){if(0!==D.length){var e=D[0].tpos/1e6;O(e)}}),[n,i,h]),Object(r.useEffect)((function(){U&&U.seekTo(g,!0)}),[U,g]),a.a.createElement("div",null,a.a.createElement("div",null,a.a.createElement("input",{type:"file",accept:"audio/midi, audio/x-midi",onChange:function(e){u(null),l(0),E(0),O(0),T(0),I(null),C(null),P.current=null;try{var t=e.target.files[0];if("audio/midi"!==t.type&&"audio/x-midi"!==t.type)throw"invalid mime type";var n=new FileReader;n.onload=function(e){return u(e.target.result)},n.readAsArrayBuffer(t)}catch(e){console.log(e)}}})),a.a.createElement("div",null,a.a.createElement("label",null,"Track No.:",a.a.createElement("input",{type:"number",onChange:function(e){return l(Number(e.target.value))},value:i})),a.a.createElement("label",null,"Channel No.:",a.a.createElement("input",{type:"number",onChange:function(e){return E(Number(e.target.value))},value:h}))),a.a.createElement("div",null,a.a.createElement("label",null,"YouTube video id:",a.a.createElement("input",{type:"text",onChange:function(e){return I(e.target.value)},value:x||""}))),a.a.createElement("div",null,a.a.createElement("label",null,"intro time (sec):",a.a.createElement("input",{type:"number",step:"any",onChange:function(e){return O(Number(e.target.value))},value:g})),a.a.createElement("label",null,"pitch offset (SMF note #):",a.a.createElement("input",{type:"number",onChange:function(e){return T(Number(e.target.value))},value:S}))),a.a.createElement("div",null,a.a.createElement("textarea",{value:n&&x?R(V,x,3e5):"",readOnly:!0})),a.a.createElement("p",null,P.current),n&&x?a.a.createElement(b.a,{videoId:x,onReady:function(e){var t=e.target;C(t),t.playVideo(),t.pauseVideo()}}):a.a.createElement("div",null),a.a.createElement(A,{curtpos:0,gNotes:V,uNotes:[],seconds:60}))}P=Object(E.b)()(P),D=Object(E.b)((function(e){return{timeOffset:e.user.timeOffset}}))(D),V=Object(E.b)((function(e){return{pitchOffset:e.user.pitchOffset}}))(V),B=Object(E.b)((function(e){return{gakufu:e.gakufu,user:e.user}}))(B),W=Object(E.b)((function(e){return{gNotes:e.gakufu.notes,uNotes:e.user.notes}}))(W);var K=Object(h.b)({gakufu:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{notes:null,videoId:null},t=arguments.length>1?arguments[1]:void 0;switch(t.type){case"SET_GAKUFU":return t.gakufu;case"RESET_GAKUFU":return{notes:null,videoId:null};default:return e}},user:Object(g.a)({key:"user",storage:y.a,whitelist:["pitchOffset"]},(function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{notes:[],timeOffset:3e5,pitchOffset:0},t=arguments.length>1?arguments[1]:void 0;switch(t.type){case"SET_USER_TIME_OFFSET":return Object(c.a)({},e,{timeOffset:t.value});case"SET_USER_PITCH_OFFSET":return Object(c.a)({},e,{pitchOffset:t.value});case"RESET_USER_NOTES":return Object(c.a)({},e,{notes:[]});case"APPEND_USER_NOTE":return Object(c.a)({},e,{notes:e.notes.concat(t.note)});default:return e}}))}),G=Object(g.a)({key:"root",storage:y.a,whitelist:["user"]},K),H=Object(h.c)(G),q=Object(g.b)(H);var Y=function(){return a.a.createElement(E.a,{store:H},a.a.createElement(j.a,{loading:null,persistor:q},a.a.createElement(P,null),a.a.createElement(D,null),a.a.createElement(V,null),a.a.createElement(W,null),a.a.createElement(B,null),a.a.createElement("hr",null),a.a.createElement(J,null)))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));o.a.render(a.a.createElement(a.a.StrictMode,null,a.a.createElement(Y,null)),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[38,1,2]]]);
//# sourceMappingURL=main.1cf116c5.chunk.js.map