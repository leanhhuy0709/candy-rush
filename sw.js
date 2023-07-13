(()=>{"use strict";var e={913:()=>{try{self["workbox:core:6.5.4"]&&_()}catch(e){}},977:()=>{try{self["workbox:precaching:6.5.4"]&&_()}catch(e){}},80:()=>{try{self["workbox:routing:6.5.4"]&&_()}catch(e){}},873:()=>{try{self["workbox:strategies:6.5.4"]&&_()}catch(e){}}},t={};function s(a){var n=t[a];if(void 0!==n)return n.exports;var r=t[a]={exports:{}};return e[a](r,r.exports,s),r.exports}(()=>{s(913);class e extends Error{constructor(e,t){super(((e,...t)=>{let s=e;return t.length>0&&(s+=` :: ${JSON.stringify(t)}`),s})(e,t)),this.name=e,this.details=t}}const t={googleAnalytics:"googleAnalytics",precache:"precache-v2",prefix:"workbox",runtime:"runtime",suffix:"undefined"!=typeof registration?registration.scope:""},a=e=>[t.prefix,e,t.suffix].filter((e=>e&&e.length>0)).join("-"),n=e=>e||a(t.precache);function r(e,t){const s=t();return e.waitUntil(s),s}function i(t){if(!t)throw new e("add-to-cache-list-unexpected-type",{entry:t});if("string"==typeof t){const e=new URL(t,location.href);return{cacheKey:e.href,url:e.href}}const{revision:s,url:a}=t;if(!a)throw new e("add-to-cache-list-unexpected-type",{entry:t});if(!s){const e=new URL(a,location.href);return{cacheKey:e.href,url:e.href}}const n=new URL(a,location.href),r=new URL(a,location.href);return n.searchParams.set("__WB_REVISION__",s),{cacheKey:n.href,url:r.href}}s(977);class c{constructor(){this.updatedURLs=[],this.notUpdatedURLs=[],this.handlerWillStart=async({request:e,state:t})=>{t&&(t.originalRequest=e)},this.cachedResponseWillBeUsed=async({event:e,state:t,cachedResponse:s})=>{if("install"===e.type&&t&&t.originalRequest&&t.originalRequest instanceof Request){const e=t.originalRequest.url;s?this.notUpdatedURLs.push(e):this.updatedURLs.push(e)}return s}}}class o{constructor({precacheController:e}){this.cacheKeyWillBeUsed=async({request:e,params:t})=>{const s=(null==t?void 0:t.cacheKey)||this._precacheController.getCacheKeyForURL(e.url);return s?new Request(s,{headers:e.headers}):e},this._precacheController=e}}let h;function l(e,t){const s=new URL(e);for(const e of t)s.searchParams.delete(e);return s.href}class u{constructor(){this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}}const d=new Set;function f(e){return"string"==typeof e?new Request(e):e}s(873);class p{constructor(e,t){this._cacheKeys={},Object.assign(this,t),this.event=t.event,this._strategy=e,this._handlerDeferred=new u,this._extendLifetimePromises=[],this._plugins=[...e.plugins],this._pluginStateMap=new Map;for(const e of this._plugins)this._pluginStateMap.set(e,{});this.event.waitUntil(this._handlerDeferred.promise)}async fetch(t){const{event:s}=this;let a=f(t);if("navigate"===a.mode&&s instanceof FetchEvent&&s.preloadResponse){const e=await s.preloadResponse;if(e)return e}const n=this.hasCallback("fetchDidFail")?a.clone():null;try{for(const e of this.iterateCallbacks("requestWillFetch"))a=await e({request:a.clone(),event:s})}catch(t){if(t instanceof Error)throw new e("plugin-error-request-will-fetch",{thrownErrorMessage:t.message})}const r=a.clone();try{let e;e=await fetch(a,"navigate"===a.mode?void 0:this._strategy.fetchOptions);for(const t of this.iterateCallbacks("fetchDidSucceed"))e=await t({event:s,request:r,response:e});return e}catch(e){throw n&&await this.runCallbacks("fetchDidFail",{error:e,event:s,originalRequest:n.clone(),request:r.clone()}),e}}async fetchAndCachePut(e){const t=await this.fetch(e),s=t.clone();return this.waitUntil(this.cachePut(e,s)),t}async cacheMatch(e){const t=f(e);let s;const{cacheName:a,matchOptions:n}=this._strategy,r=await this.getCacheKey(t,"read"),i=Object.assign(Object.assign({},n),{cacheName:a});s=await caches.match(r,i);for(const e of this.iterateCallbacks("cachedResponseWillBeUsed"))s=await e({cacheName:a,matchOptions:n,cachedResponse:s,request:r,event:this.event})||void 0;return s}async cachePut(t,s){const a=f(t);await(0,new Promise((e=>setTimeout(e,0))));const n=await this.getCacheKey(a,"write");if(!s)throw new e("cache-put-with-no-response",{url:(r=n.url,new URL(String(r),location.href).href.replace(new RegExp(`^${location.origin}`),""))});var r;const i=await this._ensureResponseSafeToCache(s);if(!i)return!1;const{cacheName:c,matchOptions:o}=this._strategy,h=await self.caches.open(c),u=this.hasCallback("cacheDidUpdate"),p=u?await async function(e,t,s,a){const n=l(t.url,s);if(t.url===n)return e.match(t,a);const r=Object.assign(Object.assign({},a),{ignoreSearch:!0}),i=await e.keys(t,r);for(const t of i)if(n===l(t.url,s))return e.match(t,a)}(h,n.clone(),["__WB_REVISION__"],o):null;try{await h.put(n,u?i.clone():i)}catch(e){if(e instanceof Error)throw"QuotaExceededError"===e.name&&await async function(){for(const e of d)await e()}(),e}for(const e of this.iterateCallbacks("cacheDidUpdate"))await e({cacheName:c,oldResponse:p,newResponse:i.clone(),request:n,event:this.event});return!0}async getCacheKey(e,t){const s=`${e.url} | ${t}`;if(!this._cacheKeys[s]){let a=e;for(const e of this.iterateCallbacks("cacheKeyWillBeUsed"))a=f(await e({mode:t,request:a,event:this.event,params:this.params}));this._cacheKeys[s]=a}return this._cacheKeys[s]}hasCallback(e){for(const t of this._strategy.plugins)if(e in t)return!0;return!1}async runCallbacks(e,t){for(const s of this.iterateCallbacks(e))await s(t)}*iterateCallbacks(e){for(const t of this._strategy.plugins)if("function"==typeof t[e]){const s=this._pluginStateMap.get(t),a=a=>{const n=Object.assign(Object.assign({},a),{state:s});return t[e](n)};yield a}}waitUntil(e){return this._extendLifetimePromises.push(e),e}async doneWaiting(){let e;for(;e=this._extendLifetimePromises.shift();)await e}destroy(){this._handlerDeferred.resolve(null)}async _ensureResponseSafeToCache(e){let t=e,s=!1;for(const e of this.iterateCallbacks("cacheWillUpdate"))if(t=await e({request:this.request,response:t,event:this.event})||void 0,s=!0,!t)break;return s||t&&200!==t.status&&(t=void 0),t}}class g{constructor(e={}){this.cacheName=e.cacheName||a(t.runtime),this.plugins=e.plugins||[],this.fetchOptions=e.fetchOptions,this.matchOptions=e.matchOptions}handle(e){const[t]=this.handleAll(e);return t}handleAll(e){e instanceof FetchEvent&&(e={event:e,request:e.request});const t=e.event,s="string"==typeof e.request?new Request(e.request):e.request,a="params"in e?e.params:void 0,n=new p(this,{event:t,request:s,params:a}),r=this._getResponse(n,s,t);return[r,this._awaitComplete(r,n,s,t)]}async _getResponse(t,s,a){let n;await t.runCallbacks("handlerWillStart",{event:a,request:s});try{if(n=await this._handle(s,t),!n||"error"===n.type)throw new e("no-response",{url:s.url})}catch(e){if(e instanceof Error)for(const r of t.iterateCallbacks("handlerDidError"))if(n=await r({error:e,event:a,request:s}),n)break;if(!n)throw e}for(const e of t.iterateCallbacks("handlerWillRespond"))n=await e({event:a,request:s,response:n});return n}async _awaitComplete(e,t,s,a){let n,r;try{n=await e}catch(r){}try{await t.runCallbacks("handlerDidRespond",{event:a,request:s,response:n}),await t.doneWaiting()}catch(e){e instanceof Error&&(r=e)}if(await t.runCallbacks("handlerDidComplete",{event:a,request:s,response:n,error:r}),t.destroy(),r)throw r}}class y extends g{constructor(e={}){e.cacheName=n(e.cacheName),super(e),this._fallbackToNetwork=!1!==e.fallbackToNetwork,this.plugins.push(y.copyRedirectedCacheableResponsesPlugin)}async _handle(e,t){return await t.cacheMatch(e)||(t.event&&"install"===t.event.type?await this._handleInstall(e,t):await this._handleFetch(e,t))}async _handleFetch(t,s){let a;const n=s.params||{};if(!this._fallbackToNetwork)throw new e("missing-precache-entry",{cacheName:this.cacheName,url:t.url});{const e=n.integrity,r=t.integrity,i=!r||r===e;a=await s.fetch(new Request(t,{integrity:"no-cors"!==t.mode?r||e:void 0})),e&&i&&"no-cors"!==t.mode&&(this._useDefaultCacheabilityPluginIfNeeded(),await s.cachePut(t,a.clone()))}return a}async _handleInstall(t,s){this._useDefaultCacheabilityPluginIfNeeded();const a=await s.fetch(t);if(!await s.cachePut(t,a.clone()))throw new e("bad-precaching-response",{url:t.url,status:a.status});return a}_useDefaultCacheabilityPluginIfNeeded(){let e=null,t=0;for(const[s,a]of this.plugins.entries())a!==y.copyRedirectedCacheableResponsesPlugin&&(a===y.defaultPrecacheCacheabilityPlugin&&(e=s),a.cacheWillUpdate&&t++);0===t?this.plugins.push(y.defaultPrecacheCacheabilityPlugin):t>1&&null!==e&&this.plugins.splice(e,1)}}y.defaultPrecacheCacheabilityPlugin={cacheWillUpdate:async({response:e})=>!e||e.status>=400?null:e},y.copyRedirectedCacheableResponsesPlugin={cacheWillUpdate:async({response:t})=>t.redirected?await async function(t,s){let a=null;if(t.url&&(a=new URL(t.url).origin),a!==self.location.origin)throw new e("cross-origin-copy-response",{origin:a});const n=t.clone(),r={headers:new Headers(n.headers),status:n.status,statusText:n.statusText},i=s?s(r):r,c=function(){if(void 0===h){const e=new Response("");if("body"in e)try{new Response(e.body),h=!0}catch(e){h=!1}h=!1}return h}()?n.body:await n.blob();return new Response(c,i)}(t):t};class w{constructor({cacheName:e,plugins:t=[],fallbackToNetwork:s=!0}={}){this._urlsToCacheKeys=new Map,this._urlsToCacheModes=new Map,this._cacheKeysToIntegrities=new Map,this._strategy=new y({cacheName:n(e),plugins:[...t,new o({precacheController:this})],fallbackToNetwork:s}),this.install=this.install.bind(this),this.activate=this.activate.bind(this)}get strategy(){return this._strategy}precache(e){this.addToCacheList(e),this._installAndActiveListenersAdded||(self.addEventListener("install",this.install),self.addEventListener("activate",this.activate),this._installAndActiveListenersAdded=!0)}addToCacheList(t){const s=[];for(const a of t){"string"==typeof a?s.push(a):a&&void 0===a.revision&&s.push(a.url);const{cacheKey:t,url:n}=i(a),r="string"!=typeof a&&a.revision?"reload":"default";if(this._urlsToCacheKeys.has(n)&&this._urlsToCacheKeys.get(n)!==t)throw new e("add-to-cache-list-conflicting-entries",{firstEntry:this._urlsToCacheKeys.get(n),secondEntry:t});if("string"!=typeof a&&a.integrity){if(this._cacheKeysToIntegrities.has(t)&&this._cacheKeysToIntegrities.get(t)!==a.integrity)throw new e("add-to-cache-list-conflicting-integrities",{url:n});this._cacheKeysToIntegrities.set(t,a.integrity)}if(this._urlsToCacheKeys.set(n,t),this._urlsToCacheModes.set(n,r),s.length>0){const e=`Workbox is precaching URLs without revision info: ${s.join(", ")}\nThis is generally NOT safe. Learn more at https://bit.ly/wb-precache`;console.warn(e)}}}install(e){return r(e,(async()=>{const t=new c;this.strategy.plugins.push(t);for(const[t,s]of this._urlsToCacheKeys){const a=this._cacheKeysToIntegrities.get(s),n=this._urlsToCacheModes.get(t),r=new Request(t,{integrity:a,cache:n,credentials:"same-origin"});await Promise.all(this.strategy.handleAll({params:{cacheKey:s},request:r,event:e}))}const{updatedURLs:s,notUpdatedURLs:a}=t;return{updatedURLs:s,notUpdatedURLs:a}}))}activate(e){return r(e,(async()=>{const e=await self.caches.open(this.strategy.cacheName),t=await e.keys(),s=new Set(this._urlsToCacheKeys.values()),a=[];for(const n of t)s.has(n.url)||(await e.delete(n),a.push(n.url));return{deletedURLs:a}}))}getURLsToCacheKeys(){return this._urlsToCacheKeys}getCachedURLs(){return[...this._urlsToCacheKeys.keys()]}getCacheKeyForURL(e){const t=new URL(e,location.href);return this._urlsToCacheKeys.get(t.href)}getIntegrityForCacheKey(e){return this._cacheKeysToIntegrities.get(e)}async matchPrecache(e){const t=e instanceof Request?e.url:e,s=this.getCacheKeyForURL(t);if(s)return(await self.caches.open(this.strategy.cacheName)).match(s)}createHandlerBoundToURL(t){const s=this.getCacheKeyForURL(t);if(!s)throw new e("non-precached-url",{url:t});return e=>(e.request=new Request(t),e.params=Object.assign({cacheKey:s},e.params),this.strategy.handle(e))}}let m;const _=()=>(m||(m=new w),m);s(80);const R=e=>e&&"object"==typeof e?e:{handle:e};class v{constructor(e,t,s="GET"){this.handler=R(t),this.match=e,this.method=s}setCatchHandler(e){this.catchHandler=R(e)}}class C extends v{constructor(e,t,s){super((({url:t})=>{const s=e.exec(t.href);if(s&&(t.origin===location.origin||0===s.index))return s.slice(1)}),t,s)}}class b{constructor(){this._routes=new Map,this._defaultHandlerMap=new Map}get routes(){return this._routes}addFetchListener(){self.addEventListener("fetch",(e=>{const{request:t}=e,s=this.handleRequest({request:t,event:e});s&&e.respondWith(s)}))}addCacheListener(){self.addEventListener("message",(e=>{if(e.data&&"CACHE_URLS"===e.data.type){const{payload:t}=e.data,s=Promise.all(t.urlsToCache.map((t=>{"string"==typeof t&&(t=[t]);const s=new Request(...t);return this.handleRequest({request:s,event:e})})));e.waitUntil(s),e.ports&&e.ports[0]&&s.then((()=>e.ports[0].postMessage(!0)))}}))}handleRequest({request:e,event:t}){const s=new URL(e.url,location.href);if(!s.protocol.startsWith("http"))return;const a=s.origin===location.origin,{params:n,route:r}=this.findMatchingRoute({event:t,request:e,sameOrigin:a,url:s});let i=r&&r.handler;const c=e.method;if(!i&&this._defaultHandlerMap.has(c)&&(i=this._defaultHandlerMap.get(c)),!i)return;let o;try{o=i.handle({url:s,request:e,event:t,params:n})}catch(e){o=Promise.reject(e)}const h=r&&r.catchHandler;return o instanceof Promise&&(this._catchHandler||h)&&(o=o.catch((async a=>{if(h)try{return await h.handle({url:s,request:e,event:t,params:n})}catch(e){e instanceof Error&&(a=e)}if(this._catchHandler)return this._catchHandler.handle({url:s,request:e,event:t});throw a}))),o}findMatchingRoute({url:e,sameOrigin:t,request:s,event:a}){const n=this._routes.get(s.method)||[];for(const r of n){let n;const i=r.match({url:e,sameOrigin:t,request:s,event:a});if(i)return n=i,(Array.isArray(n)&&0===n.length||i.constructor===Object&&0===Object.keys(i).length||"boolean"==typeof i)&&(n=void 0),{route:r,params:n}}return{}}setDefaultHandler(e,t="GET"){this._defaultHandlerMap.set(t,R(e))}setCatchHandler(e){this._catchHandler=R(e)}registerRoute(e){this._routes.has(e.method)||this._routes.set(e.method,[]),this._routes.get(e.method).push(e)}unregisterRoute(t){if(!this._routes.has(t.method))throw new e("unregister-route-but-not-found-with-method",{method:t.method});const s=this._routes.get(t.method).indexOf(t);if(!(s>-1))throw new e("unregister-route-route-not-registered");this._routes.get(t.method).splice(s,1)}}let q;class U extends v{constructor(e,t){super((({request:s})=>{const a=e.getURLsToCacheKeys();for(const n of function*(e,{ignoreURLParametersMatching:t=[/^utm_/,/^fbclid$/],directoryIndex:s="index.html",cleanURLs:a=!0,urlManipulation:n}={}){const r=new URL(e,location.href);r.hash="",yield r.href;const i=function(e,t=[]){for(const s of[...e.searchParams.keys()])t.some((e=>e.test(s)))&&e.searchParams.delete(s);return e}(r,t);if(yield i.href,s&&i.pathname.endsWith("/")){const e=new URL(i.href);e.pathname+=s,yield e.href}if(a){const e=new URL(i.href);e.pathname+=".html",yield e.href}if(n){const e=n({url:r});for(const t of e)yield t.href}}(s.url,t)){const t=a.get(n);if(t)return{cacheKey:t,integrity:e.getIntegrityForCacheKey(t)}}}),e.strategy)}}var L;L=[{'revision':'a72143fd73fb204d6dc9b07ac5fadf6c','url':'assets/License.txt'},{'revision':'ffc358f5805bf4dfeafd563b496fde47','url':'assets/background/bg.png'},{'revision':'2d13db03711fec84aa6ffa0d3d47e80c','url':'assets/images/cookie1.png'},{'revision':'3d7217e240c1c41d32864a065ab938d6','url':'assets/images/cookie2.png'},{'revision':'d627dbea88c468bf0a11f6a471d3b185','url':'assets/images/croissant.png'},{'revision':'f23fad1c608a78b716183df69c0634fe','url':'assets/images/cupcake.png'},{'revision':'502ef2e67222d276a764d264dee396ef','url':'assets/images/donut.png'},{'revision':'ee14a72523b0f5525c5edcb7e15cf0b7','url':'assets/images/eclair.png'},{'revision':'1cbdf6b3fce2b6b03b5e63b79dde4f28','url':'assets/images/macaroon.png'},{'revision':'0b1500a0647929ea85a73e53af670689','url':'assets/images/pie.png'},{'revision':'aad7687d17ae8a4e5234a39da0a5a989','url':'assets/images/poptart1.png'},{'revision':'3bfbf2737d24008597aa36e12aa32aec','url':'assets/images/poptart2.png'},{'revision':'1cf71f717a67c59729166f1924c5f7d4','url':'assets/images/starcookie1.png'},{'revision':'996f19fd6990669bb02b2bb7e7588d1b','url':'assets/images/starcookie2.png'},{'revision':'de98c276fcde6e287ee5e7a51f111bed','url':'assets/pack.json'},{'revision':'d8ecea7c62a01714e74efcff74f52c4a','url':'assets/particles/blue-flare.png'},{'revision':'431b99d2aa2576def6aa2b940c6fff1f','url':'assets/particles/blue.png'},{'revision':'d5c7dab4a08cb768cabdbc51c5ba0716','url':'assets/particles/bluebubble.png'},{'revision':'9635eaa47e8debe4a4873fb395e0d502','url':'assets/particles/bubble.png'},{'revision':'e779be4fdbc82487489d8d908478db98','url':'assets/particles/bubble256.png'},{'revision':'3b0bf7937e8f7fbd0d7c76c081fb5fec','url':'assets/particles/bubbles.json'},{'revision':'ec9b363544073b980428321f94647dcc','url':'assets/particles/bubbles.png'},{'revision':'57bc355a89c6d598f80a8381b6e0c16e','url':'assets/particles/bubbles.tps'},{'revision':'e18da1002211dcaf309b86c618e92119','url':'assets/particles/cloud.png'},{'revision':'a0bae8c223ddf89e00e2cc241a1beb11','url':'assets/particles/coin.png'},{'revision':'77605bed8e1e690507956092877fd130','url':'assets/particles/copyright.txt'},{'revision':'258cd3285ee764fd3807f9a69346cb71','url':'assets/particles/elec1.png'},{'revision':'a1ea432c4ee1396066c877c7968f4c88','url':'assets/particles/elec2.png'},{'revision':'65b559a65539e55afeb8429933c64206','url':'assets/particles/elec3.png'},{'revision':'2f4accb6fe75ecb70f7a7b7137d38a15','url':'assets/particles/elec4.png'},{'revision':'0f9130ece42445ad2761f79ae9781671','url':'assets/particles/emitter.json'},{'revision':'bfc0018740dbebf47017ec28f72fecfd','url':'assets/particles/explosion.json'},{'revision':'77adb8a9aaf81f9c569bd8e6016d4c55','url':'assets/particles/explosion.png'},{'revision':'98a825426560b398cc429b6734d21fcd','url':'assets/particles/fire1.png'},{'revision':'aa575c0e4ab17e026ac004ae3e5c88e8','url':'assets/particles/fire2.png'},{'revision':'c40e4ff39a7146c905f94aa572a682f8','url':'assets/particles/fire3.png'},{'revision':'073220f1e7c08709b652122bbe829f96','url':'assets/particles/flame1.png'},{'revision':'b545bdbf067af9f12c5dd51418f94c2d','url':'assets/particles/flame2.png'},{'revision':'25c92f951c74b835cb09427026e1b1e8','url':'assets/particles/flares.json'},{'revision':'587b045c9c55398b6f1dd00c2ab13995','url':'assets/particles/flares.png'},{'revision':'8817f185b12c3afd36498c757713ec1f','url':'assets/particles/fuse.png'},{'revision':'826cab41c6f8f46bd5afa12b7119db63','url':'assets/particles/glass.png'},{'revision':'526fdb4e663f6db6b3dc5f08ea434cd0','url':'assets/particles/gold.png'},{'revision':'cb6c4f411d8f8a7e7cad98d8bd5a9a26','url':'assets/particles/green-orb.png'},{'revision':'f7f2953918f633867f9f7d28ead79c79','url':'assets/particles/green.png'},{'revision':'98fddc4fe7283dde1fab62a640c1a65d','url':'assets/particles/greenbubble.png'},{'revision':'0e6b99996e5d697712e0b69052cb60c8','url':'assets/particles/leaf1.png'},{'revision':'ed574364667706a9bd3c4660f97bac68','url':'assets/particles/leaf2.png'},{'revision':'94fa074b09cc32f26d14122e498072c7','url':'assets/particles/leaf3.png'},{'revision':'0524cf749c73409207136039d7a00ebe','url':'assets/particles/lit-smoke.png'},{'revision':'a82d1fe3c4a08b46a62fafd4400aa65f','url':'assets/particles/muzzleflash1.png'},{'revision':'a9ce566841f793d2b76059e5f04a507c','url':'assets/particles/muzzleflash2.png'},{'revision':'8e240a8507243a4f9c004bf3c91e1400','url':'assets/particles/muzzleflash3.png'},{'revision':'3e4f5d25539196fc67d51b941da54110','url':'assets/particles/muzzleflash4.png'},{'revision':'2cf2babfb3e6659d023cad56e761b449','url':'assets/particles/muzzleflash5.png'},{'revision':'153a08678c7016ed5eadb6e153169d1c','url':'assets/particles/muzzleflash6.png'},{'revision':'b663e9622f2381fe4b65901b89d4fd8b','url':'assets/particles/muzzleflash7.png'},{'revision':'3d2e32712cffdab777fcd0a9860676d1','url':'assets/particles/orb.png'},{'revision':'dd6e42ff30b78da5d22a0c7fdc8f7152','url':'assets/particles/pipe.png'},{'revision':'8fb331318b2d44a4c8385ef5435b4fe0','url':'assets/particles/plasmaball.png'},{'revision':'459a64c024a1efec8969bb7634db6769','url':'assets/particles/platform.png'},{'revision':'7b08dc394c87746e766e3e921f99667d','url':'assets/particles/racetrack-bend.png'},{'revision':'988b2908c0a39b4586a187e2958915d1','url':'assets/particles/red.png'},{'revision':'a7b4df0ffb65081d9daaaeb8d177c7f3','url':'assets/particles/redbubble.png'},{'revision':'425496c4a2473555ab99355a32af542f','url':'assets/particles/ring.png'},{'revision':'bfd9e2b08156a537f171807c018c0829','url':'assets/particles/rising-smoke.png'},{'revision':'8f3bbea89db9dcb0fa19533165094d43','url':'assets/particles/silverbubble.png'},{'revision':'ceb52ff3375c9f3a547eb37c197c141a','url':'assets/particles/slime.png'},{'revision':'8fc96fc7bc1f848d58060817cab71e70','url':'assets/particles/smoke-puff.png'},{'revision':'756adaf2de298928d681e5d57081295e','url':'assets/particles/smoke0.png'},{'revision':'c6d68f88ae5769f966206e40c37fdc37','url':'assets/particles/snowflake.png'},{'revision':'7a5d5285ac36a2016941f4cde9634b6e','url':'assets/particles/soft1.png'},{'revision':'43500544ad0b3ecf81fcb3baad04861f','url':'assets/particles/soft10.png'},{'revision':'5adf222d18781173ec0fe59c107ade4c','url':'assets/particles/soft11.png'},{'revision':'4459819e4f8a7cb0217f5e1b93f84076','url':'assets/particles/soft12.png'},{'revision':'0c03c624f950dd2f54d5e4c6fd8acc9a','url':'assets/particles/soft13.png'},{'revision':'ce5417f9fbaf502aca2f618ca8d89418','url':'assets/particles/soft14.png'},{'revision':'669f27986cbf673f20877de16eda96a2','url':'assets/particles/soft15.png'},{'revision':'b5905081cbbf09b7dfb975e9c7e57009','url':'assets/particles/soft2.png'},{'revision':'4c2bc59c52bbae639cbadf0606c59e1a','url':'assets/particles/soft3.png'},{'revision':'992f6349cfdae369e02ef71a0374ae8c','url':'assets/particles/soft4.png'},{'revision':'310dd1afd3d112d90214ace907737977','url':'assets/particles/soft5.png'},{'revision':'3f48ae98284e28af95e5523bb2c80971','url':'assets/particles/soft6.png'},{'revision':'cdbe24e3240a67aa5d19df670888895b','url':'assets/particles/soft7.png'},{'revision':'64e3da705a8c094015339ccec9120899','url':'assets/particles/soft8.png'},{'revision':'1fdd8dc41486b84ca6212dc5cbf755f6','url':'assets/particles/soft9.png'},{'revision':'2f665eb92e938a6069cacd1311428c06','url':'assets/particles/sparkle1.png'},{'revision':'867592dc18d2fe9b08a27e1ca1951292','url':'assets/particles/splinter1.png'},{'revision':'bffd7394509e887873ab3d9bf10cd6b3','url':'assets/particles/splinter2.png'},{'revision':'079cc3ccc4f33e6b3729ba8f2e918a2c','url':'assets/particles/square.png'},{'revision':'35125eb9db912807ebfdc973204d5348','url':'assets/particles/star.png'},{'revision':'d48e6f22c5ca1f6adb0cb33f93733205','url':'assets/particles/stone.png'},{'revision':'8dc46151b7c71fa0c8e9a28fb9965e46','url':'assets/particles/white-flare.png'},{'revision':'db768556295b9f7018283ba6fb56b358','url':'assets/particles/white-smoke.png'},{'revision':'69a62c3c6233e4977490dc50acb2d74e','url':'assets/particles/white.png'},{'revision':'11752848c21ef3f9545d286981bb9648','url':'assets/particles/yellow.png'},{'revision':'502ef2e67222d276a764d264dee396ef','url':'favicon.ico'},{'revision':'2ffbc23293ee8a797bc61e9c02534206','url':'icons/icons-192.png'},{'revision':'8bdcc486cda9b423f50e886f2ddb6604','url':'icons/icons-512.png'},{'revision':'bec5632636fae8186cd22f373d0862aa','url':'index.html'},{'revision':null,'url':'main.3d4e9fe9f2f1ed68e805.bundle.js'},{'revision':'4b7794a9c6ccfc90c36c434a89288a64','url':'manifest.json'},{'revision':null,'url':'vendors.8887ded182b84702ea7a.bundle.js'},{'revision':'ae91117b5769d61766f8f08bdea195aa','url':'vendors.8887ded182b84702ea7a.bundle.js.LICENSE.txt'}],_().precache(L),function(t){const s=_();!function(t,s,a){let n;if("string"==typeof t){const e=new URL(t,location.href);n=new v((({url:t})=>t.href===e.href),s,a)}else if(t instanceof RegExp)n=new C(t,s,a);else if("function"==typeof t)n=new v(t,s,a);else{if(!(t instanceof v))throw new e("unsupported-route-type",{moduleName:"workbox-routing",funcName:"registerRoute",paramName:"capture"});n=t}(q||(q=new b,q.addFetchListener(),q.addCacheListener()),q).registerRoute(n)}(new U(s,t))}(undefined)})()})();