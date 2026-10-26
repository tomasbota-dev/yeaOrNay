// Real HTTP -> Worker -> D1 -> hibernating DO integration, loopback only.
import assert from 'node:assert/strict';
import { WebSocket } from 'undici';
const origin = new URL(process.env.LOCAL_SMOKE_URL || 'http://127.0.0.1:8788');
if (origin.protocol !== 'http:' || !['127.0.0.1','localhost','[::1]'].includes(origin.hostname)) throw new Error('Security smoke must target loopback HTTP.');
const tag=crypto.randomUUID().slice(0,8), password='Local-test-passphrase-2026';
const accounts=[], sockets=[];
let roomCode;
async function request(path,{method='GET',cookie,body,status=200}={}) {
  const response=await fetch(new URL(path,origin),{method,headers:{origin:origin.origin,'CF-Connecting-IP':'127.0.0.2',...(cookie?{cookie}:{}),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  const value=await response.json().catch(()=>null);
  assert.equal(response.status,status,`${method} ${path}: ${JSON.stringify(value)}`);
  return {response,value};
}
async function account(name) {
  const {response,value}=await request('/api/auth/signup',{method:'POST',body:{name,email:`security-${tag}-${name}@example.invalid`,password,ageConfirmed:true}});
  const user={cookie:response.headers.get('set-cookie').split(';')[0],id:value.user.id};
  accounts.push(user); return user;
}
function event(socket,type) {
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{cleanup();reject(new Error(`Timed out waiting for ${type}`));},15000);
    const listener=e=>{cleanup();resolve(e);};
    const cleanup=()=>{clearTimeout(timer);socket.removeEventListener(type,listener);};
    socket.addEventListener(type,listener,{once:true});
  });
}
async function connect(user) {
  const url=new URL(`/api/rooms/${roomCode}/events`,origin);url.protocol='ws:';
  const socket=new WebSocket(url,{headers:{origin:origin.origin,cookie:user.cookie,'CF-Connecting-IP':'127.0.0.2'}});sockets.push(socket);
  const initial=event(socket,'message');
  await event(socket,'open');
  assert.deepEqual(JSON.parse((await initial).data),{type:'room-changed'});
  return socket;
}
try {
  const host=await account('host'),guest=await account('guest');
  roomCode=(await request('/api/rooms',{method:'POST',cookie:host.cookie,body:{name:'Security integration',duration:30},status:201})).value.room.code;
  await request(`/api/rooms/${roomCode}/events`,{cookie:host.cookie,status:426});
  await request('/api/rooms/join',{method:'POST',cookie:guest.cookie,body:{code:roomCode}});
  await request(`/api/rooms/${roomCode}/ideas`,{method:'POST',cookie:host.cookie,body:{title:'A safe plan'},status:201});
  const hostSocket=await connect(host),guestSocket=await connect(guest);
  const idea=(await request(`/api/rooms/${roomCode}`,{cookie:guest.cookie})).value.ideas[0];
  const changed=event(hostSocket,'message');
  await request(`/api/ideas/${idea.id}/vote`,{method:'PUT',cookie:guest.cookie,body:{value:1}});
  assert.deepEqual(JSON.parse((await changed).data),{type:'room-changed'});
  assert.equal((await request(`/api/rooms/${roomCode}`,{cookie:guest.cookie})).value.ideas[0].my_vote,1);
  assert.equal((await request(`/api/rooms/${roomCode}`,{cookie:host.cookie})).value.ideas[0].my_vote,0);
  const kicked=event(guestSocket,'close');
  await request(`/api/rooms/${roomCode}/members/kick`,{method:'POST',cookie:host.cookie,body:{userId:guest.id}});
  assert.equal((await kicked).code,4001);
  await request('/api/rooms/join',{method:'POST',cookie:guest.cookie,body:{code:roomCode}});
  const rejoined=await connect(guest),banned=event(rejoined,'close');
  await request(`/api/rooms/${roomCode}/members/ban`,{method:'POST',cookie:host.cookie,body:{userId:guest.id}});
  assert.equal((await banned).code,4001);
  await request('/api/rooms/join',{method:'POST',cookie:guest.cookie,body:{code:roomCode},status:403});
  await request(`/api/ideas/${idea.id}/vote`,{method:'PUT',cookie:guest.cookie,body:{value:1},status:403});
  await request('/api/account',{method:'DELETE',cookie:guest.cookie,body:{password:'Wrong-password-2026'},status:403});
  console.log('Local security smoke passed: end-to-end notifications, personalized votes, kick/rejoin, ban/revocation, and deletion reauthentication.');
} finally {
  for(const socket of sockets) {try{socket.close();}catch{}}
  if(roomCode&&accounts[0]) await request(`/api/rooms/${roomCode}`,{method:'DELETE',cookie:accounts[0].cookie});
  for(const user of accounts) await request('/api/account',{method:'DELETE',cookie:user.cookie,body:{password}});
}
