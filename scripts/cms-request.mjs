import { readFile } from 'node:fs/promises';
const host = 'https://hype-content-cms.contactosebastiangui.chatgpt.site';
const token = process.env.HYPE_CMS_ACCESS_TOKEN;
if (!token)
  throw new Error(
    'Set HYPE_CMS_ACCESS_TOKEN only for this process using the existing token from Sites get_site. Never store credentials.',
  );
const [method = 'GET', path = '/api/profiles', file] = process.argv.slice(2);
if (
  !['GET', 'POST', 'PATCH', 'DELETE'].includes(method) ||
  !/^\/api\/(profiles|content|workflow)(\?profile=(hype|sebastian))?$/.test(
    path,
  )
)
  throw new Error('Unsupported CMS operation.');
const response = await fetch(host + path, {
  method,
  redirect: 'error',
  headers: {
    'OAI-Sites-Authorization': 'Bearer ' + token,
    ...(file ? { 'Content-Type': 'application/json' } : {}),
  },
  body: file ? await readFile(file, 'utf8') : undefined,
});
const data = await response.json();
if (!response.ok)
  throw new Error(data.error || 'CMS request failed: ' + response.status);
console.log(JSON.stringify(data));
