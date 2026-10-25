/** Provision an environment-specific signup widget without writing its secret
 * to config files or artifacts. `api` is already scoped to the account and
 * returns the Cloudflare response's `result` value. */
export async function provisionTurnstile({ api, target, hostname }) {
  if (!target?.name || typeof target.name !== 'string' || typeof hostname !== 'string' ||
      !hostname || new URL(`https://${hostname}`).hostname !== hostname || /[\s/?:#]/.test(hostname)) {
    throw new Error('A Worker name and valid hostname are required for Turnstile.');
  }
  const name = `${target.name}-signup`;
  let widget;
  for (let page = 1; page <= 100; page++) {
    const result = await api(`/challenges/widgets?page=${page}&per_page=100`);
    const widgets = Array.isArray(result) ? result : result?.widgets;
    if (!Array.isArray(widgets)) throw new Error('Unexpected Turnstile widget list response.');
    widget = widgets.find(candidate => candidate.name === name);
    if (widget || widgets.length < 100) break;
    if (page === 100) throw new Error('Turnstile widget pagination exceeded its safety limit.');
  }
  if (widget) {
    if (!widget.sitekey) throw new Error('Turnstile widget is missing its site key.');
    widget = await api(`/challenges/widgets/${encodeURIComponent(widget.sitekey)}`);
    // Reject unexpected detail results instead of altering another environment.
    if (widget.name !== name || !widget.sitekey) throw new Error('Turnstile widget identity did not match.');
    const domains = widget.domains || [];
    if (!domains.includes(hostname)) {
      if (domains.length >= 10) throw new Error('Turnstile widget has reached the free hostname limit.');
      await api(`/challenges/widgets/${encodeURIComponent(widget.sitekey)}`, {
        method: 'PUT', body: JSON.stringify({ name, domains: [...domains, hostname], mode: 'managed', clearance_level: 'no_clearance' }),
      });
    }
  } else {
    widget = await api('/challenges/widgets', {
      method: 'POST', body: JSON.stringify({ name, domains: [hostname], mode: 'managed', clearance_level: 'no_clearance' }),
    });
  }
  if (!widget?.sitekey) throw new Error('Cloudflare did not return a Turnstile site key.');
  if (!widget.secret) widget = await api(`/challenges/widgets/${encodeURIComponent(widget.sitekey)}`);
  const { secret, sitekey } = widget;
  if (typeof secret !== 'string' || !secret || typeof sitekey !== 'string' || !sitekey) {
    throw new Error('Cloudflare did not return Turnstile credentials.');
  }
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.log('::add-mask::' + secret.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A'));
  }
  try {
    await api(`/workers/scripts/${encodeURIComponent(target.name)}/secrets`, {
      method: 'PUT', body: JSON.stringify({ name: 'TURNSTILE_SECRET_KEY', text: secret, type: 'secret_text' }),
    });
  } catch {
    // Do not propagate provider errors that could echo the secret request body.
    throw new Error('Could not install the Turnstile Worker secret; signup must remain disabled.');
  }
  return sitekey;
}
