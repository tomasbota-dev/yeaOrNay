import { readFile } from 'node:fs/promises';

export function checkPolicy(base, head, sameRepository) {
  if (base === 'main') {
    if (head !== 'staging' || !sameRepository) throw new Error('Production PRs must come from this repository\'s staging branch.');
  } else if (base === 'staging') {
    if (!/^(feature|bugfix)\/[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(head)) {
      throw new Error('Staging PRs must come from a feature/* or bugfix/* branch created from staging.');
    }
  } else throw new Error(`Unsupported PR target: ${base}`);
}

if (process.env.GITHUB_EVENT_PATH) {
  const { pull_request: pr } = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
  checkPolicy(pr.base.ref, pr.head.ref, pr.head.repo?.full_name === pr.base.repo.full_name);
  console.log('Branch flow is valid.');
}
